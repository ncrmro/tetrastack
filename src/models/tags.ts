import { inArray } from 'drizzle-orm'
import { insertTagSchema, tags } from '@/database/schema.tags'
import { createModelFactory } from '@/lib/models'

/**
 * CRUD operations for tags using many-first design pattern
 * All operations work with arrays by default
 */
export const {
  insert: insertTags,
  select: selectTags,
  update: updateTags,
  delete: deleteTags,
  buildConditions,
  takeFirst: takeFirstTag,
} = createModelFactory('tags', tags, tags.id, insertTagSchema)

/**
 * Get tags with flexible filtering using WHERE IN clauses
 * All parameters are optional arrays for bulk operations
 * EXAMPLE: Custom function using factory buildConditions helper
 *
 * @example
 * // Get by IDs
 * await getTags({ ids: ['tag-uuid-1', 'tag-uuid-2'] })
 *
 * @example
 * // Get by team
 * await getTags({ teamIds: ['team-1', 'team-2'] })
 *
 * @example
 * // Get by name
 * await getTags({ names: ['frontend', 'backend'] })
 */
export async function getTags(params: {
  ids?: string[]
  teamIds?: string[]
  names?: string[]
}) {
  const conditions = buildConditions({
    ids: params.ids ? { column: tags.id, values: params.ids } : undefined,
    teamIds: params.teamIds
      ? { column: tags.teamId, values: params.teamIds }
      : undefined,
  })

  // Custom filter for names (not using buildConditions)
  if (params.names) {
    conditions.push(inArray(tags.name, params.names))
  }

  return await selectTags(conditions)
}
