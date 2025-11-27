import type { NextRequest } from 'next/server'
import { BulkTaskGeneratorAgent } from '@/agents/task-agents'
import { auth } from '@/app/auth'
import { insertTasks } from '@/models/tasks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/generate-tasks
 * Generates tasks using AI with streaming events
 *
 * Body: { description: string, projectId: string }
 *
 * Returns Server-Sent Events (SSE) stream:
 * - event: progress - Agent progress events
 * - event: complete - Final result with created tasks
 * - event: error - Error message
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await auth()
        if (!session?.user?.id) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Unauthorized' })}\n\n`,
            ),
          )
          controller.close()
          return
        }

        const body = (await request.json()) as {
          description?: string
          projectId?: string
        }
        const { description, projectId } = body

        if (!description?.trim()) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Description is required' })}\n\n`,
            ),
          )
          controller.close()
          return
        }

        if (!projectId) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: 'Project ID is required' })}\n\n`,
            ),
          )
          controller.close()
          return
        }

        // Generate tasks with AI, streaming progress events
        const agent = await BulkTaskGeneratorAgent.generate(
          [{ role: 'user', content: description }],
          (event) => {
            // Stream progress events to client
            controller.enqueue(
              encoder.encode(
                `event: progress\ndata: ${JSON.stringify(event)}\n\n`,
              ),
            )
          },
        )

        const result = agent.getResult()

        // Create all tasks
        const tasksWithProject = result.tasks.map((task) => ({
          ...task,
          projectId,
        }))

        const created = await insertTasks(tasksWithProject)

        controller.enqueue(
          encoder.encode(
            `event: complete\ndata: ${JSON.stringify({
              tasks: created,
              explanation: result.explanation,
              rationale: result.rationale,
            })}\n\n`,
          ),
        )

        controller.close()
      } catch (error) {
        console.error('Error generating tasks:', error)
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to generate tasks',
            })}\n\n`,
          ),
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
