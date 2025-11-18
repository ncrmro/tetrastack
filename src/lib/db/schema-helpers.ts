import { createInsertSchema } from 'drizzle-zod';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

/**
 * Creates an insert schema with automatic omission of common auto-generated fields
 *
 * Always omits:
 * - id (auto-generated UUIDv7)
 * - createdAt (auto-generated timestamp)
 * - updatedAt (auto-generated timestamp)
 *
 * For tables that need to omit additional fields (like slug), use createInsertSchema directly.
 *
 * @param table - Drizzle table definition
 *
 * @example
 * // Standard usage (omits id, createdAt, updatedAt)
 * export const insertTagSchema = createAutoInsertSchema(tags);
 *
 * @example
 * // For tables with extra omitted fields, use createInsertSchema directly
 * export const insertProjectSchema = createInsertSchema(projects).omit({
 *   id: true,
 *   slug: true,
 *   createdAt: true,
 *   updatedAt: true,
 * });
 */
export function createAutoInsertSchema<TTable extends SQLiteTable>(
  table: TTable,
) {
  return createInsertSchema(table).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
}
