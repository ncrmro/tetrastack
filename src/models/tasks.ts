import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/database'
import type { TaskPriority, TaskStatus } from '@/database/schema.tasks'
import { insertTaskSchema, tasks } from '@/database/schema.tasks'
import { createModelFactory } from '@/lib/models'

// Create and export CRUD functions using factory
export const {
  insert: insertTasks,
  select: selectTasks,
  update: updateTasks,
  delete: deleteTasks,
  buildConditions,
  takeFirst: takeFirstTask,
} = createModelFactory('tasks', tasks, tasks.id, insertTaskSchema)

/**
 * Get tasks with flexible filtering using WHERE IN clauses
 * All parameters are optional arrays for bulk operations
 *
 * @example
 * // Get by IDs
 * await getTasks({ ids: ['task-uuid-1', 'task-uuid-2'] })
 *
 * @example
 * // Get by project and status
 * await getTasks({ projectIds: ['proj-1'], status: ['todo', 'in_progress'] })
 *
 * @example
 * // Get by assignee
 * await getTasks({ assigneeIds: [1, 2] })
 */
export async function getTasks(params: {
  ids?: string[]
  projectIds?: string[]
  assigneeIds?: number[]
  status?: TaskStatus[]
  priority?: TaskPriority[]
}) {
  const conditions = []

  if (params.ids) {
    conditions.push(inArray(tasks.id, params.ids))
  }

  if (params.projectIds) {
    conditions.push(inArray(tasks.projectId, params.projectIds))
  }

  if (params.assigneeIds) {
    conditions.push(inArray(tasks.assigneeId, params.assigneeIds))
  }

  if (params.status) {
    conditions.push(inArray(tasks.status, params.status))
  }

  if (params.priority) {
    conditions.push(inArray(tasks.priority, params.priority))
  }

  return await db.query.tasks.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  })
}

/**
 * Get a task with its comments
 * Uses Drizzle relations for efficient querying
 *
 * @param id - Task ID
 * @returns Task with comments or undefined if not found
 */
export async function getTaskWithComments(id: string) {
  return await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      comments: {
        with: {
          user: true,
        },
      },
    },
  })
}
