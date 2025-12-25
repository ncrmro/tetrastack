import { NextRequest } from 'next/server';
import { auth } from '@/app/auth';
import { ProjectGeneratorAgent } from '@/agents/project-agents';
import { insertProjects } from '@/models/projects';
import { insertTags } from '@/models/tags';
import { addProjectTags } from '@/models/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/generate-project
 * Generates a project using AI with streaming events
 *
 * Body: { description: string, teamId: string }
 *
 * Returns Server-Sent Events (SSE) stream:
 * - event: progress - Agent progress events
 * - event: complete - Final result with created project
 * - event: error - Error message
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await auth();
        if (!session?.user?.id) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Unauthorized' })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        const body = (await request.json()) as {
          description?: string;
          teamId?: string;
        };
        const { description, teamId } = body;

        if (!description?.trim()) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Description is required' })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        if (!teamId) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Team ID is required' })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        // Generate project with AI, streaming progress events
        const agent = await ProjectGeneratorAgent.generate(
          [{ role: 'user', content: description }],
          (event) => {
            // Stream progress events to client
            controller.enqueue(
              encoder.encode(
                `event: progress\ndata: ${JSON.stringify(event)}\n\n`,
              ),
            );
          },
        );

        const result = agent.getResult();

        if (result.type === 'existing') {
          // Found existing project
          controller.enqueue(
            encoder.encode(
              `event: complete\ndata: ${JSON.stringify({
                type: 'existing',
                projectId: result.id,
                explanation: result.explanation,
              })}\n\n`,
            ),
          );
        } else {
          // Create new project
          const created = await insertProjects([
            {
              ...result.project,
              teamId,
              createdBy: session.user.id,
            },
          ]);

          if (created.length === 0) {
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({ error: 'Failed to create project' })}\n\n`,
              ),
            );
            controller.close();
            return;
          }

          const project = created[0];

          // Handle suggested tags
          if (
            result.project.suggestedTags &&
            result.project.suggestedTags.length > 0
          ) {
            const tagIds: string[] = [];

            for (const tagName of result.project.suggestedTags) {
              try {
                const [tag] = await insertTags([
                  {
                    name: tagName,
                    teamId,
                    color: '#3B82F6', // Default blue color
                  },
                ]);
                if (tag) {
                  tagIds.push(tag.id);
                }
              } catch (error) {
                // Tag might already exist, continue
                console.error(`Failed to create tag ${tagName}:`, error);
              }
            }

            // Add tags to project
            if (tagIds.length > 0) {
              await addProjectTags(project.id, tagIds);
            }
          }

          controller.enqueue(
            encoder.encode(
              `event: complete\ndata: ${JSON.stringify({
                type: 'new',
                project,
                explanation: result.explanation,
                suggestedTags: result.project.suggestedTags,
              })}\n\n`,
            ),
          );
        }

        controller.close();
      } catch (error) {
        console.error('Error generating project:', error);
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to generate project',
            })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
