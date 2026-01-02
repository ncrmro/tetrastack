/**
 * Generate Project Ideas Job
 *
 * Uses ProjectPlannerAgent to generate multiple project ideas and saves them to the database.
 * Demonstrates the job system working with AI agents and database persistence.
 */

import { z } from 'zod';
import { ProjectPlannerAgent } from '@/agents/project-agents';
import { Job } from '@/lib/jobs';
import { addProjectTags, insertProjects } from '@/models/projects';
import { getTags, insertTags } from '@/models/tags';

// Zod schemas for runtime validation
export const generateProjectIdeasParamsSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  theme: z
    .string()
    .optional()
    .default('Generate innovative software project ideas'),
  count: z.number().int().positive().optional().default(10),
  userId: z.number().int().positive().optional(),
});

export const generateProjectIdeasResultSchema = z.object({
  projectsCreated: z.number().int().nonnegative(),
  tagsCreated: z.number().int().nonnegative(),
  projects: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      tags: z.array(z.string()),
    }),
  ),
});

// TypeScript types inferred from Zod schemas
// Use input type for params (allows optional fields with defaults)
export type GenerateProjectIdeasParams = z.input<
  typeof generateProjectIdeasParamsSchema
>;
export type GenerateProjectIdeasResult = z.infer<
  typeof generateProjectIdeasResultSchema
>;

/**
 * Job that generates project ideas using AI and saves them to the database
 *
 * @example
 * ```typescript
 * // Generate immediately
 * const result = await GenerateProjectIdeasJob.now({
 *   teamId: 'team-123',
 *   theme: 'Generate web development projects focused on AI',
 *   count: 5
 * });
 *
 * // Queue for later
 * await GenerateProjectIdeasJob.later({
 *   teamId: 'team-123'
 * });
 *
 * // Batch multiple themes
 * await GenerateProjectIdeasJob.batch([
 *   { teamId: 'team-123', theme: 'Mobile apps' },
 *   { teamId: 'team-123', theme: 'Web apps' }
 * ]);
 * ```
 */
export class GenerateProjectIdeasJob extends Job<
  GenerateProjectIdeasParams,
  GenerateProjectIdeasResult
> {
  // Required Zod schemas for runtime validation
  protected static readonly paramsSchema = generateProjectIdeasParamsSchema;
  protected static readonly resultSchema = generateProjectIdeasResultSchema;

  protected async perform(
    params: GenerateProjectIdeasParams,
  ): Promise<GenerateProjectIdeasResult> {
    const {
      teamId,
      theme = 'Generate innovative software project ideas',
      count = 10,
      userId,
    } = params;

    console.log(`[GenerateProjectIdeasJob] Starting generation...`);
    console.log(`  Theme: ${theme}`);
    console.log(`  Count: ${count}`);
    console.log(`  Team ID: ${teamId}`);

    // Step 1: Use ProjectPlannerAgent to generate project ideas
    const prompt = `${theme}\n\nGenerate ${count} diverse project ideas with detailed descriptions, appropriate priorities, and suggested tags.`;

    console.log(`[GenerateProjectIdeasJob] Calling ProjectPlannerAgent...`);

    const agent = await ProjectPlannerAgent.generate(
      [{ role: 'user', content: prompt }],
      (step, details, completed, timelineEvent) => {
        // Log progress events
        console.log(`[Agent Event] ${step}:`, {
          details,
          completed,
          timelineEvent,
        });
      },
    );

    const planData = agent.getResult();

    console.log(
      `[GenerateProjectIdeasJob] Agent generated ${planData.projects.length} projects`,
    );

    // Step 2: Get or create tags for all projects
    const allSuggestedTags = new Set<string>();
    planData.projects.forEach((p) => {
      p.suggestedTags.forEach((tag) => allSuggestedTags.add(tag));
    });

    console.log(
      `[GenerateProjectIdeasJob] Processing ${allSuggestedTags.size} unique tags...`,
    );

    // Get existing tags
    const existingTags = await getTags({
      teamIds: [teamId],
      names: Array.from(allSuggestedTags),
    });

    const existingTagMap = new Map(existingTags.map((t) => [t.name, t.id]));

    // Create missing tags
    let tagsCreated = 0;
    const tagNameToIdMap = new Map<string, string>(existingTagMap);

    for (const tagName of allSuggestedTags) {
      if (!existingTagMap.has(tagName)) {
        const [newTag] = await insertTags([
          {
            name: tagName,
            teamId,
          },
        ]);
        tagNameToIdMap.set(tagName, newTag.id);
        tagsCreated++;
        console.log(`[GenerateProjectIdeasJob] Created tag: ${tagName}`);
      }
    }

    console.log(
      `[GenerateProjectIdeasJob] Tags: ${tagsCreated} created, ${existingTags.length} existing`,
    );

    // Step 3: Create all projects in bulk
    const projectsToCreate = planData.projects.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { suggestedTags, tasks, ...projectData } = p;
      return {
        ...projectData,
        teamId,
        ...(userId && { createdBy: userId }),
      };
    });

    console.log(
      `[GenerateProjectIdeasJob] Creating ${projectsToCreate.length} projects...`,
    );

    const createdProjects = await insertProjects(projectsToCreate);

    console.log(
      `[GenerateProjectIdeasJob] Created ${createdProjects.length} projects`,
    );

    // Step 4: Associate tags with projects
    for (let i = 0; i < createdProjects.length; i++) {
      const project = createdProjects[i];
      const suggestedTags = planData.projects[i].suggestedTags;

      const tagIds = suggestedTags
        .map((name) => tagNameToIdMap.get(name))
        .filter((id): id is string => id !== undefined);

      if (tagIds.length > 0) {
        await addProjectTags(project.id, tagIds);
        console.log(
          `[GenerateProjectIdeasJob] Added ${tagIds.length} tags to "${project.title}"`,
        );
      }
    }

    // Step 5: Prepare result
    const result: GenerateProjectIdeasResult = {
      projectsCreated: createdProjects.length,
      tagsCreated,
      projects: createdProjects.map((p, i) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        tags: planData.projects[i].suggestedTags,
      })),
    };

    console.log(`[GenerateProjectIdeasJob] Completed successfully!`);
    console.log(`  Projects created: ${result.projectsCreated}`);
    console.log(`  Tags created: ${result.tagsCreated}`);

    return result;
  }
}
