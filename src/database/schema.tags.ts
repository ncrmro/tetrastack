import { integer, sqliteTable, text, check } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { teams } from './schema.teams';
import { uuidv7 } from '@tetrastack/backend/utils';

export const tags = sqliteTable(
  'tags',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name').notNull(),
    color: text('color').notNull().default('#3b82f6'), // Default blue color
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [check('name_not_empty', sql`length(${table.name}) > 0`)],
);

// Relations
export const tagsRelations = relations(tags, ({ one }) => ({
  team: one(teams, {
    fields: [tags.teamId],
    references: [teams.id],
  }),
}));

// Schema generation and types
import { createSelectSchema } from 'drizzle-zod';
import { createAutoInsertSchema } from '@/lib/db/schema-helpers';
import { z } from 'zod';

/**
 * Base tag schema for insertions (auto-generated from Drizzle table)
 * Auto-omits: id, createdAt, updatedAt
 */
export const insertTagSchema = createAutoInsertSchema(tags);

/**
 * Complete tag schema including all fields (auto-generated from Drizzle table)
 */
export const selectTagSchema = createSelectSchema(tags);

// Export types for TypeScript usage
export type InsertTag = z.infer<typeof insertTagSchema>;
export type SelectTag = z.infer<typeof selectTagSchema>;
