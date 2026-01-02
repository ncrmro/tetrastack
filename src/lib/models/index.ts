import { and, inArray, type SQL } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { z } from 'zod';
import { db } from '@/database';

/**
 * Model utility functions and types
 * Provides helper utilities for extracting return types from model functions
 */

/**
 * Takes the first element from an array, throwing an error if not found.
 * Used to convert many-first operations to single-record operations.
 *
 * @param items - Array to extract first element from
 * @param errorMsg - Optional custom error message
 * @returns First element of array
 * @throws Error if array is empty or first element is undefined
 *
 * @example
 * // Single record create
 * const tag = await tagsCrud.create([data]).then(takeFirst);
 *
 * @example
 * // Single record update with custom error
 * const project = await updateMany([eq(projects.id, id)], data)
 *   .then(items => takeFirst(items, `Project ${id} not found`));
 */
export function takeFirst<T>(items: T[], errorMsg?: string): T {
  if (!items[0]) {
    throw new Error(errorMsg || 'Record not found');
  }
  return items[0];
}

/**
 * Model utility types
 * Provides helper types for extracting return types from model functions
 */

/**
 * Extracts the return type from an async model function
 * Automatically handles Promise unwrapping and removes undefined/null
 *
 * @example
 * // Get the return type of a model function
 * import { getProjectWithTags } from '@/models/projects';
 * type ProjectWithTags = ModelResult<typeof getProjectWithTags>;
 *
 * @example
 * // Use in action functions
 * export async function getProject(id: string): ActionResult<ModelResult<typeof getProjectWithTags>> {
 *   const project = await getProjectWithTags(id);
 *   return { success: true, data: project };
 * }
 */
export type ModelResult<T extends (...args: never[]) => Promise<unknown>> =
  NonNullable<Awaited<ReturnType<T>>>;

/**
 * Extracts the return type from an async model function that returns an array
 * Returns the element type of the array
 *
 * @example
 * // Get the element type from a model function that returns an array
 * import { getProjects } from '@/models/projects';
 * type Project = ModelArrayElement<typeof getProjects>;
 */
export type ModelArrayElement<
  T extends (...args: never[]) => Promise<unknown>,
> = NonNullable<Awaited<ReturnType<T>>> extends (infer U)[] ? U : never;

/**
 * Generic CRUD model factory - "many-first" design pattern
 * Creates standard database operations for a given table
 * Reduces boilerplate in model files while maintaining type safety
 *
 * Design Philosophy:
 * All operations work with arrays by default to avoid maintaining parallel
 * "single" and "many" implementations. Use takeFirst() to extract single records.
 *
 * @example
 * // In src/models/tags.ts
 * import { tags, insertTagSchema } from '@/database/schema.tags';
 * import { createModelFactory, takeFirst } from '@/lib/models';
 *
 * const tagsCrud = createModelFactory(
 *   'tags',
 *   tags,
 *   tags.id,          // Pass column reference (not column name)
 *   insertTagSchema,  // Runtime validation for input
 * );
 *
 * // Export with convenient naming (all are many-first, plural names)
 * export const {
 *   insert: createTags,
 *   select: selectTags,
 *   update: updateTags,
 *   delete: deleteTags,
 * } = createModelFactory('tags', tags, tags.id, insertTagSchema);
 *
 * // Usage examples:
 * const [tag] = await createTags([{ name: 'New Tag', teamId: 'team-1' }]);
 * const [updated] = await updateTags([eq(tags.id, id)], { name: 'Updated' });
 * await deleteTags([eq(tags.id, id)]);
 */
export function createModelFactory<
  TTable extends SQLiteTable,
  TInsert extends Record<string, unknown>,
>(
  tableName: string,
  table: TTable,
  _idColumn: TTable[keyof TTable], // Accept any column from the table
  insertSchema: z.ZodObject<z.ZodRawShape> & { _output: TInsert }, // Needs .partial() method
) {
  type TSelect = TTable['$inferSelect'];
  return {
    /**
     * Takes the first element from an array, throwing an error if not found.
     * Convenience re-export for single-record operations.
     */
    takeFirst,

    /**
     * Select multiple records with flexible filtering using SQL conditions
     * All parameters are optional for maximum flexibility
     *
     * @param conditions - Array of SQL conditions to filter by
     * @returns Array of matching records
     *
     * @example
     * // Select all records
     * await select([]);
     *
     * @example
     * // Select with conditions
     * await select([eq(table.status, 'active'), inArray(table.id, ids)]);
     */
    async select(conditions: SQL[] = []): Promise<TSelect[]> {
      const result = await (
        db.query as Record<
          string,
          { findMany: (opts?: { where?: SQL }) => Promise<TSelect[]> }
        >
      )[tableName].findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
      });

      // Drizzle already returns type-safe results
      return result;
    },

    /**
     * Insert multiple records (many-first design)
     *
     * @param data - Array of records to insert
     * @returns Array of inserted records
     *
     * @example
     * // Insert multiple records
     * await insert([
     *   { name: 'Tag 1', teamId: 'team-1' },
     *   { name: 'Tag 2', teamId: 'team-1' }
     * ]);
     *
     * @example
     * // Insert single record with array destructuring
     * const [tag] = await insert([{ name: 'Tag 1', teamId: 'team-1' }]);
     */
    async insert(data: TInsert[]): Promise<TSelect[]> {
      // Validate input data before inserting
      const validated = data.map((item) => insertSchema.parse(item));

      const result = await db
        .insert(table)
        .values(validated as TInsert[])
        .returning();

      // Drizzle .returning() returns type-safe TTable['$inferSelect'][]
      return result;
    },

    /**
     * Update multiple records matching conditions (many-first design)
     *
     * @param conditions - Array of SQL conditions to filter records to update
     * @param data - Partial record data to update
     * @returns Array of updated records
     *
     * @example
     * // Update multiple records
     * await update([inArray(table.status, ['draft', 'pending'])], { status: 'active' });
     *
     * @example
     * // Update single record with array destructuring
     * const [tag] = await update([eq(table.id, id)], { name: 'Updated' });
     */
    async update(
      conditions: SQL[],
      data: Partial<TInsert>,
    ): Promise<TSelect[]> {
      // Validate partial update data
      const validated = insertSchema.partial().parse(data);

      const result = await db
        .update(table)
        .set(validated as Partial<TInsert>)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .returning();

      // Drizzle .returning() returns type-safe TTable['$inferSelect'][]
      return result;
    },

    /**
     * Delete multiple records matching conditions (many-first design)
     *
     * @param conditions - Array of SQL conditions to filter records to delete
     * @returns void
     *
     * @example
     * // Delete multiple records
     * await delete([inArray(table.status, ['archived', 'deleted'])]);
     *
     * @example
     * // Delete single record
     * await delete([eq(table.id, id)]);
     */
    async delete(conditions: SQL[]): Promise<void> {
      await db
        .delete(table)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    },

    /**
     * Build SQL conditions for flexible querying
     * Helper to create WHERE IN clauses for common filter patterns
     *
     * @param filters - Object with optional array filters
     * @returns Array of SQL conditions
     *
     * @example
     * const conditions = buildConditions({
     *   ids: params.ids ? { column: table.id, values: params.ids } : undefined,
     *   teamIds: params.teamIds ? { column: table.teamId, values: params.teamIds } : undefined,
     * });
     * return await getMany(conditions);
     */
    buildConditions<TColumn extends keyof TTable['_']['columns']>(
      filters: Record<
        string,
        | {
            column: TTable['_']['columns'][TColumn];
            values: unknown[];
          }
        | undefined
      >,
    ): SQL[] {
      const conditions: SQL[] = [];
      for (const filter of Object.values(filters)) {
        if (filter && filter.values.length > 0) {
          conditions.push(inArray(filter.column, filter.values));
        }
      }
      return conditions;
    },
  };
}

/**
 * Type helper to infer Select type from a model CRUD instance
 * Useful for extracting the return type from model functions
 *
 * @example
 * const tagsCrud = createModelFactory(...);
 * type Tag = ModelCrudSelect<typeof tagsCrud>;
 */
export type ModelCrudSelect<
  T extends { getMany: (...args: never[]) => Promise<unknown[]> },
> = Awaited<ReturnType<T['getMany']>>[number];

/**
 * Type helper to infer Insert type from a model CRUD instance
 *
 * @example
 * const tagsCrud = createModelFactory(...);
 * type NewTag = ModelCrudInsert<typeof tagsCrud>;
 */
export type ModelCrudInsert<
  T extends { create: (...args: never[]) => Promise<unknown> },
> = Parameters<T['create']>[0] extends (infer U)[] | infer U ? U : never;
