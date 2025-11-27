import { and, inArray } from 'drizzle-orm'
import { db } from '@/database'
import { comments, insertCommentSchema } from '@/database/schema.tasks'
import { createModelFactory } from '@/lib/models'

/**
 * CRUD operations for comments using many-first design pattern
 * All operations work with arrays by default
 */
export const {
  insert: insertComments,
  select: selectComments,
  update: updateComments,
  delete: deleteComments,
  buildConditions,
  takeFirst: takeFirstComment,
} = createModelFactory('comments', comments, comments.id, insertCommentSchema)

/**
 * Get comments with flexible filtering using WHERE IN clauses
 * All parameters are optional arrays for bulk operations
 * Uses relations for efficient querying with user and task data
 *
 * @example
 * // Get by IDs
 * await getComments({ ids: ['comment-uuid-1', 'comment-uuid-2'] })
 *
 * @example
 * // Get by task
 * await getComments({ taskIds: ['task-1', 'task-2'] })
 *
 * @example
 * // Get by user
 * await getComments({ userIds: [1, 2] })
 */
export async function getComments(params: {
  ids?: string[]
  taskIds?: string[]
  userIds?: number[]
}) {
  const conditions = []

  if (params.ids) {
    conditions.push(inArray(comments.id, params.ids))
  }

  if (params.taskIds) {
    conditions.push(inArray(comments.taskId, params.taskIds))
  }

  if (params.userIds) {
    conditions.push(inArray(comments.userId, params.userIds))
  }

  return await db.query.comments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      user: true,
      task: true,
    },
  })
}
