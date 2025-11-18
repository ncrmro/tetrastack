import { generateText, Output, stepCountIs } from 'ai';
import type { LanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { BaseAgent } from '@/lib/agents/base-agent';
import { createSystemPrompt, createSearchTool } from '@/lib/agents/factories';
import {
  createEventConstants,
  createEventBuilders,
  ExtractEventUnion,
} from '@/lib/agents/event-factory';
import { createStandardOnStepFinish } from '@/lib/agents/standard-handlers';
import { ChatMessage, ProgressCallback } from '@/lib/agents/types';
import { tasks, insertTaskSchema } from '@/database/schema.tasks';

export type TaskGenerationData = z.infer<typeof insertTaskSchema>;

/**
 * Generates or finds existing tasks with AI.
 *
 * Uses discriminated union pattern: searches database first before generating new tasks.
 * When generating new tasks, considers project context and assigns appropriate priority/status.
 * Returns either existing task ID or new task data ready for persistence.
 *
 * **Important**: This agent does NOT persist data. Actions/scripts must handle persistence
 * by calling the models layer (createTasks, etc.).
 *
 * @example
 * ```typescript
 * // In a server action:
 * const agent = await TaskGeneratorAgent.generate([
 *   { role: 'user', content: 'Create a task to implement user authentication' }
 * ]);
 * const result = agent.getResult();
 *
 * if (result.type === 'existing') {
 *   const tasks = await getTasks({ ids: [result.id] });
 *   return tasks[0];
 * } else {
 *   const created = await createTasks({ ...result.task, projectId: 'proj-123' });
 *   return created[0];
 * }
 * ```
 */
export class TaskGeneratorAgent extends BaseAgent<
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
      task: TaskGenerationData;
      explanation: string;
    },
  never
> {
  static readonly DEFAULT_MODEL = openai('gpt-4o-mini');

  static readonly event = createEventConstants({
    entity: 'task',
    custom: ['prioritySet'],
  });

  static readonly eventBuilder = createEventBuilders({
    entity: 'task',
    custom: {
      prioritySet: (taskName: string, priority: string) => ({
        taskName,
        priority,
      }),
    },
  });

  static readonly SYSTEM_PROMPT = createSystemPrompt({
    role: 'project management expert',
    task: 'create task entries',
    entityName: 'task',
    guidelines: [
      'Use clear, actionable task titles that describe what needs to be done',
      'Provide detailed descriptions that explain the task requirements, acceptance criteria, and any constraints',
      'Set appropriate status (todo, in_progress, done) based on task context - new tasks should typically be "todo"',
      'Assign priority (low, medium, high) based on urgency, dependencies, and business value',
      'If a due date is mentioned, include it in ISO 8601 format',
      'Tasks should be specific and achievable - break down large tasks into smaller ones',
      'Include any relevant technical details or requirements in the description',
    ],
    criticalRules: [
      'ALWAYS search before creating to avoid duplicates',
      'Follow all field requirements and validation rules defined in the schema',
      'Task titles should be concise (under 100 characters) but descriptive',
      'Descriptions should provide enough context for anyone to pick up the task',
    ],
  });

  static readonly TOOLS = {
    searchTasks: createSearchTool({
      entityName: 'task',
      table: tasks,
    }),
  };

  static readonly PROMPT = `The user described: "{USER_MESSAGE}"

Generate a structured task object based on this description.`;

  /**
   * Discriminated union output schema
   * - type: 'existing' = AI found task in database via searchTasks tool
   * - type: 'new' = AI generated new task data
   */
  static readonly OUTPUT_SCHEMA = z.object({
    result: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('existing'),
        id: z
          .string()
          .describe('ID of existing task found via searchTasks tool'),
      }),
      z.object({
        type: z.literal('new'),
        task: insertTaskSchema,
      }),
    ]),
    explanation: z
      .string()
      .min(1)
      .describe(
        'Conversational explanation describing your task choices and priority rationale.',
      ),
  });

  static async generate(
    messages: ChatMessage[],
    progressCallback?: ProgressCallback,
    model?: LanguageModel,
  ): Promise<TaskGeneratorAgent> {
    const agent = new TaskGeneratorAgent(progressCallback, model);
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
        system: TaskGeneratorAgent.SYSTEM_PROMPT,
        tools: TaskGeneratorAgent.TOOLS,
        stopWhen: stepCountIs(5),
        experimental_output: Output.object({
          schema: TaskGeneratorAgent.OUTPUT_SCHEMA,
        }),
        onStepFinish: createStandardOnStepFinish({
          eventBuilder: TaskGeneratorAgent.eventBuilder,
          emit: (e) => this.emitEvent(e),
        }),
        prompt,
      });

      if (!aiResult.experimental_output) {
        throw new Error(
          'Failed to generate task - no structured output from AI',
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
        const taskData = output.result.task;

        this.emit.prioritySet(taskData.title, taskData.priority);

        this.result = {
          type: 'new',
          task: taskData,
          explanation: output.explanation,
        };

        this.emit.generationComplete(taskData.title, this.result);
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

export type TaskEvent = ExtractEventUnion<
  typeof TaskGeneratorAgent.eventBuilder
>;

export const TaskEvents = TaskGeneratorAgent.event;

/**
 * Schema for bulk task generation output
 */
export const BULK_TASK_GENERATION_SCHEMA = z.object({
  tasks: z
    .array(insertTaskSchema)
    .min(1)
    .max(20)
    .describe('List of tasks to create (1-20 tasks)'),
  rationale: z.string().describe('Explanation of the task breakdown strategy'),
});

export type BulkTaskGenerationData = z.infer<
  typeof BULK_TASK_GENERATION_SCHEMA
>;

/**
 * Bulk task generation agent that creates multiple related tasks at once.
 *
 * Unlike TaskGeneratorAgent which creates single tasks, this agent:
 * - Takes a high-level feature or goal
 * - Breaks it down into multiple actionable tasks
 * - Assigns appropriate priorities and dependencies
 * - Demonstrates batch generation pattern
 *
 * **Important**: This agent does NOT persist data. Actions/scripts must handle persistence
 * by calling the models layer with bulk operations (createTasks with array).
 *
 * @example
 * ```typescript
 * // In a server action:
 * const agent = await BulkTaskGeneratorAgent.generate([
 *   { role: 'user', content: 'Break down the user authentication feature into tasks' }
 * ]);
 * const result = agent.getResult();
 *
 * // Action handles persistence via models
 * const tasksWithProject = result.tasks.map(t => ({ ...t, projectId: 'proj-123' }));
 * const created = await createTasks(tasksWithProject);
 * ```
 */
export class BulkTaskGeneratorAgent extends BaseAgent<
  {
    USER_MESSAGE: string;
  },
  BulkTaskGenerationData & { explanation: string },
  never
> {
  static readonly DEFAULT_MODEL = openai('gpt-4o-mini');

  static readonly event = createEventConstants({
    entity: 'bulkTasks',
    custom: ['tasksPlanned'],
  });

  static readonly eventBuilder = createEventBuilders({
    entity: 'bulkTasks',
    custom: {
      tasksPlanned: (taskCount: number) => ({ taskCount }),
    },
  });

  static readonly SYSTEM_PROMPT = `You are a project management expert helping users break down features and goals into actionable tasks.

Your task is to take a high-level feature, goal, or requirement and create a list of specific, actionable tasks:
1. Break down the work into 3-20 distinct tasks
2. Each task should be completable independently
3. Order tasks by logical execution sequence
4. Set appropriate priorities (high for blockers, medium for core work, low for nice-to-haves)
5. All tasks start with status "todo"
6. Include clear descriptions with acceptance criteria

Task Breakdown Guidelines:
- Start with foundational/setup tasks before implementation tasks
- Group related tasks together in sequence
- Consider testing, documentation, and deployment tasks
- Each task should be specific enough to estimate and track
- Include any technical constraints or dependencies in descriptions
- Avoid creating tasks that are too granular (< 1 hour) or too broad (> 1 week)

Critical Rules:
- Provide a rationale explaining your breakdown strategy
- Each task must have a clear, actionable title
- Descriptions should include acceptance criteria when applicable
- Set realistic priorities based on dependencies and business value
- Tasks should be ordered in a logical sequence for execution`;

  static readonly PROMPT = `The user wants to break down: "{USER_MESSAGE}"

Create a list of actionable tasks for this work.`;

  static readonly OUTPUT_SCHEMA = BULK_TASK_GENERATION_SCHEMA.extend({
    explanation: z
      .string()
      .min(1)
      .describe('Explanation of your task breakdown strategy'),
  });

  static async generate(
    messages: ChatMessage[],
    progressCallback?: ProgressCallback,
    model?: LanguageModel,
  ): Promise<BulkTaskGeneratorAgent> {
    const agent = new BulkTaskGeneratorAgent(progressCallback, model);
    await agent.execute(messages);
    return agent;
  }

  async execute(
    messages: ChatMessage[],
  ): Promise<BulkTaskGenerationData & { explanation: string }> {
    this.messages = messages;

    const userMessage = this.getLatestUserMessage(messages);

    try {
      const prompt = this.getPrompt({ USER_MESSAGE: userMessage });

      this.emit.generationStart(userMessage);

      const aiResult = await generateText({
        model: this.model,
        system: BulkTaskGeneratorAgent.SYSTEM_PROMPT,
        tools: {}, // No search - always generate fresh tasks
        stopWhen: stepCountIs(5),
        experimental_output: Output.object({
          schema: BulkTaskGeneratorAgent.OUTPUT_SCHEMA,
        }),
        onStepFinish: createStandardOnStepFinish({
          eventBuilder: BulkTaskGeneratorAgent.eventBuilder,
          emit: (e) => this.emitEvent(e),
        }),
        prompt,
      });

      if (!aiResult.experimental_output) {
        throw new Error(
          'Failed to generate tasks - no structured output from AI',
        );
      }

      const output = aiResult.experimental_output;
      const taskData = output;

      this.emit.tasksPlanned(taskData.tasks.length);

      this.result = taskData;

      this.emit.generationComplete(`${taskData.tasks.length} tasks`, taskData);

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

export type BulkTaskEvent = ExtractEventUnion<
  typeof BulkTaskGeneratorAgent.eventBuilder
>;

export const BulkTaskEvents = BulkTaskGeneratorAgent.event;
