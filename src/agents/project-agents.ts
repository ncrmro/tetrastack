import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { generateText, Output, stepCountIs } from 'ai';
import { z } from 'zod';
import {
  insertProjectSchema,
  PROJECT_PRIORITY,
  PROJECT_STATUS,
  projects,
} from '@/database/schema.projects';
import { BaseAgent } from '@/lib/agents/base-agent';
import {
  createEventBuilders,
  createEventConstants,
  type ExtractEventUnion,
} from '@/lib/agents/event-factory';
import { createSearchTool, createSystemPrompt } from '@/lib/agents/factories';
import { createStandardOnStepFinish } from '@/lib/agents/standard-handlers';
import type { ChatMessage, ProgressCallback } from '@/lib/agents/types';

/**
 * Schema for AI-generated project with suggested tags
 * Extends base project schema with tag suggestions
 */
export const PROJECT_GENERATION_SCHEMA = insertProjectSchema.extend({
  suggestedTags: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Suggested tag names for this project (1-5 relevant tags)'),
});

export type ProjectGenerationData = z.infer<typeof PROJECT_GENERATION_SCHEMA>;

/**
 * Generates or finds existing projects with AI.
 *
 * Uses discriminated union pattern: searches database first before generating new projects.
 * When generating new projects, suggests relevant tags.
 * Returns either existing project ID or new project data ready for persistence.
 *
 * **Important**: This agent does NOT persist data. Actions/scripts must handle persistence
 * by calling the models layer (createProjects, createTag, addProjectTags, etc.).
 *
 * @example
 * ```typescript
 * // In a server action:
 * const agent = await ProjectGeneratorAgent.generate([
 *   { role: 'user', content: 'Create a project for redesigning our website' }
 * ]);
 * const result = agent.getResult();
 *
 * if (result.type === 'existing') {
 *   const projects = await getProjects({ ids: [result.id] });
 *   return projects[0];
 * } else {
 *   const created = await createProjects({ ...result.project, teamId: 'team-123' });
 *   // Handle tags separately via model layer
 *   return created[0];
 * }
 * ```
 */
export class ProjectGeneratorAgent extends BaseAgent<
  {
    USER_MESSAGE: string;
  },
  | {
      type: 'existing';
      id: string;
      explanation: string;
    }
  | {
      type: 'new';
      project: ProjectGenerationData;
      explanation: string;
    },
  never
> {
  static readonly DEFAULT_MODEL = openai('gpt-4o-mini');

  static readonly event = createEventConstants({
    entity: 'project',
    custom: ['tagsGenerated'],
  });

  static readonly eventBuilder = createEventBuilders({
    entity: 'project',
    custom: {
      tagsGenerated: (projectName: string, tags: string[]) => ({
        projectName,
        tags,
      }),
    },
  });

  static readonly SYSTEM_PROMPT = createSystemPrompt({
    role: 'project management expert',
    task: 'create project entries',
    entityName: 'project',
    guidelines: [
      'Use clear, concise project titles that describe the main goal or deliverable',
      'Provide detailed descriptions that explain the project scope, objectives, and expected outcomes',
      'Set realistic status (planning, active, completed, archived) based on project context',
      'Assign appropriate priority (low, medium, high) based on urgency and importance',
      'Suggest 1-5 relevant tags that categorize the project (e.g., "frontend", "backend", "infrastructure", "ux", "urgent")',
      'Consider the project lifecycle when setting status - new projects should typically start in "planning"',
    ],
    criticalRules: [
      'ALWAYS search before creating to avoid duplicates',
      'Follow all field requirements and validation rules defined in the schema',
      'Suggested tags should be lowercase, hyphenated slugs (e.g., "high-priority" not "High Priority")',
    ],
  });

  static readonly TOOLS = {
    searchProjects: createSearchTool({
      entityName: 'project',
      table: projects,
    }),
  };

  static readonly PROMPT = `The user described: "{USER_MESSAGE}"

Generate a structured project object based on this description.`;

  /**
   * Discriminated union output schema
   * - type: 'existing' = AI found project in database via searchProjects tool
   * - type: 'new' = AI generated new project data with tag suggestions
   */
  static readonly OUTPUT_SCHEMA = z.object({
    result: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('existing'),
        id: z
          .string()
          .describe('ID of existing project found via searchProjects tool'),
      }),
      z.object({
        type: z.literal('new'),
        project: PROJECT_GENERATION_SCHEMA,
      }),
    ]),
    explanation: z
      .string()
      .min(1)
      .describe(
        'Conversational explanation describing your project choices and tag suggestions.',
      ),
  });

  static async generate(
    messages: ChatMessage[],
    progressCallback?: ProgressCallback,
    model?: LanguageModel,
  ): Promise<ProjectGeneratorAgent> {
    const agent = new ProjectGeneratorAgent(progressCallback, model);
    await agent.execute(messages);
    return agent;
  }

  async execute(messages: ChatMessage[]) {
    this.messages = messages;

    const userMessage = this.getLatestUserMessage(messages);

    try {
      const prompt = this.getPrompt({ USER_MESSAGE: userMessage });

      this.emit.generationStart(userMessage);

      const aiResult = await generateText({
        model: this.model,
        system: ProjectGeneratorAgent.SYSTEM_PROMPT,
        tools: ProjectGeneratorAgent.TOOLS,
        stopWhen: stepCountIs(5),
        experimental_output: Output.object({
          schema: ProjectGeneratorAgent.OUTPUT_SCHEMA,
        }),
        onStepFinish: createStandardOnStepFinish({
          eventBuilder: ProjectGeneratorAgent.eventBuilder,
          emit: (e) => this.emitEvent(e),
        }),
        prompt,
      });

      if (!aiResult.experimental_output) {
        throw new Error(
          'Failed to generate project - no structured output from AI',
        );
      }

      const output = aiResult.experimental_output;

      if (output.result.type === 'existing') {
        this.emit.existingFound(userMessage, output.result.id);

        this.result = {
          type: 'existing',
          id: output.result.id,
          explanation: output.explanation,
        };
      } else {
        const { suggestedTags, ...projectData } = output.result.project;

        this.emit.tagsGenerated(projectData.title, suggestedTags);

        this.result = {
          type: 'new',
          project: output.result.project,
          explanation: output.explanation,
        };

        this.emit.generationComplete(projectData.title, this.result);
      }

      return this.result;
    } catch (error) {
      this.emit.error(
        userMessage,
        error instanceof Error ? error.message : 'Unknown error',
        error,
      );
      throw error;
    }
  }
}

export type ProjectEvent = ExtractEventUnion<
  typeof ProjectGeneratorAgent.eventBuilder
>;

export const ProjectEvents = ProjectGeneratorAgent.event;

/**
 * Schema for multi-project planning output
 */
export const PROJECT_PLANNING_SCHEMA = z.object({
  overview: z.string().describe('High-level overview of the project plan'),
  projects: z
    .array(
      z.object({
        title: z.string().describe('Project title'),
        description: z.string().describe('Detailed project description'),
        status: z
          .enum([
            PROJECT_STATUS.PLANNING,
            PROJECT_STATUS.ACTIVE,
            PROJECT_STATUS.COMPLETED,
            PROJECT_STATUS.ARCHIVED,
          ])
          .describe('Current project status'),
        priority: z
          .enum([
            PROJECT_PRIORITY.LOW,
            PROJECT_PRIORITY.MEDIUM,
            PROJECT_PRIORITY.HIGH,
          ])
          .describe('Project priority level'),
        suggestedTags: z
          .array(z.string())
          .min(1)
          .max(5)
          .describe('Suggested tags for this project'),
        tasks: z
          .array(
            z.object({
              title: z.string().describe('Task title'),
              description: z
                .string()
                .optional()
                .describe('Task description (optional)'),
              priority: z
                .enum(['low', 'medium', 'high'])
                .describe('Task priority'),
            }),
          )
          .describe('Initial tasks for this project'),
      }),
    )
    .min(1)
    .max(10)
    .describe('List of projects in the plan (1-10 projects)'),
});

export type ProjectPlanningData = z.infer<typeof PROJECT_PLANNING_SCHEMA>;

/**
 * Multi-step project planning agent that breaks down high-level goals into projects and tasks.
 *
 * Unlike ProjectGeneratorAgent which creates single projects, this agent:
 * - Takes a high-level goal or initiative
 * - Breaks it down into multiple related projects
 * - Generates initial tasks for each project
 * - Demonstrates complex multi-entity generation
 *
 * **Important**: This agent does NOT persist data. Actions/scripts must handle persistence
 * by calling the models layer in a transaction (createProjects, createTasks, etc.).
 *
 * @example
 * ```typescript
 * // In a server action:
 * const agent = await ProjectPlannerAgent.generate([
 *   { role: 'user', content: 'Plan out a complete website redesign initiative' }
 * ]);
 * const plan = agent.getResult();
 *
 * // Action handles persistence via models
 * for (const projectData of plan.projects) {
 *   const created = await createProjects({ ...projectData, teamId: 'team-123' });
 *   const tasks = projectData.tasks.map(t => ({ ...t, projectId: created[0].id }));
 *   await createTasks(tasks);
 * }
 * ```
 */
export class ProjectPlannerAgent extends BaseAgent<
  {
    USER_MESSAGE: string;
  },
  ProjectPlanningData,
  never
> {
  static readonly DEFAULT_MODEL = openai('gpt-4o');

  static readonly event = createEventConstants({
    entity: 'projectPlan',
    custom: ['projectsPlanned'],
  });

  static readonly eventBuilder = createEventBuilders({
    entity: 'projectPlan',
    custom: {
      projectsPlanned: (projectCount: number, taskCount: number) => ({
        projectCount,
        taskCount,
      }),
    },
  });

  static readonly SYSTEM_PROMPT =
    `You are a strategic project planning expert helping users break down complex initiatives into manageable projects and tasks.

Your task is to take a high-level goal or initiative and create a comprehensive project plan with:
1. Multiple related projects that together accomplish the goal
2. Initial tasks for each project to get started
3. Appropriate priorities and status for each project
4. Relevant tags to categorize projects

Project Planning Guidelines:
- Break down large initiatives into 2-10 distinct projects
- Each project should be substantial enough to warrant separate tracking
- Projects should have clear deliverables and milestones
- Order projects by logical dependency or priority
- Start with foundational/infrastructure projects before dependent projects
- Include 3-8 initial tasks per project to provide concrete next steps
- Tasks should be actionable and specific
- Consider project phases: planning → active → completed

Critical Rules:
- Provide a high-level overview explaining the strategy and project breakdown
- Each project must have a clear, concise title and detailed description
- Set realistic status (most new projects should start in "planning")
- Assign appropriate priority based on dependencies and business value
- Suggest relevant tags (e.g., "frontend", "backend", "infrastructure", "ux")
- Tasks should be ordered by logical execution sequence`;

  static readonly PROMPT =
    `The user described their initiative: "{USER_MESSAGE}"

Create a comprehensive project plan with multiple projects and initial tasks.`;

  static readonly OUTPUT_SCHEMA = PROJECT_PLANNING_SCHEMA.extend({
    explanation: z
      .string()
      .min(1)
      .describe('Explanation of your planning strategy and key decisions'),
  });

  static async generate(
    messages: ChatMessage[],
    progressCallback?: ProgressCallback,
    model?: LanguageModel,
  ): Promise<ProjectPlannerAgent> {
    const agent = new ProjectPlannerAgent(progressCallback, model);
    await agent.execute(messages);
    return agent;
  }

  async execute(messages: ChatMessage[]): Promise<ProjectPlanningData> {
    this.messages = messages;

    const userMessage = this.getLatestUserMessage(messages);

    try {
      const prompt = this.getPrompt({ USER_MESSAGE: userMessage });

      this.emit.generationStart(userMessage);

      const aiResult = await generateText({
        model: this.model,
        system: ProjectPlannerAgent.SYSTEM_PROMPT,
        tools: {}, // No search - always generate fresh plan
        stopWhen: stepCountIs(5),
        experimental_output: Output.object({
          schema: ProjectPlannerAgent.OUTPUT_SCHEMA,
        }),
        onStepFinish: createStandardOnStepFinish({
          eventBuilder: ProjectPlannerAgent.eventBuilder,
          emit: (e) => this.emitEvent(e),
        }),
        prompt,
      });

      if (!aiResult.experimental_output) {
        throw new Error(
          'Failed to generate project plan - no structured output from AI',
        );
      }

      const output = aiResult.experimental_output;
      const planData = output;

      const totalTasks = planData.projects.reduce(
        (sum, p) => sum + p.tasks.length,
        0,
      );

      this.emit.projectsPlanned(planData.projects.length, totalTasks);

      this.result = planData;

      this.emit.generationComplete(
        `${planData.projects.length} projects`,
        planData,
      );

      return this.result;
    } catch (error) {
      this.emit.error(
        userMessage,
        error instanceof Error ? error.message : 'Unknown error',
        error,
      );
      throw error;
    }
  }
}

export type ProjectPlannerEvent = ExtractEventUnion<
  typeof ProjectPlannerAgent.eventBuilder
>;

export const ProjectPlannerEvents = ProjectPlannerAgent.event;
