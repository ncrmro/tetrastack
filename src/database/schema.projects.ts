import {
  integer,
  sqliteTable,
  text,
  primaryKey,
  check,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { teams } from './schema.teams';
import { users } from './schema.auth';
import { uuidv7 } from '@tetrastack/backend/utils';

/**
 * Project status enum - defines all possible project states
 */
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;
export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

/**
 * Project priority enum - defines project priority levels
 */
export const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type ProjectPriority =
  (typeof PROJECT_PRIORITY)[keyof typeof PROJECT_PRIORITY];

export const projects = sqliteTable(
  'projects',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    status: text('status', {
      enum: Object.values(PROJECT_STATUS) as [string, ...string[]],
    })
      .notNull()
      .default(PROJECT_STATUS.PLANNING),
    priority: text('priority', {
      enum: Object.values(PROJECT_PRIORITY) as [string, ...string[]],
    })
      .notNull()
      .default(PROJECT_PRIORITY.MEDIUM),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    createdBy: text('created_by').references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [check('title_not_empty', sql`length(${table.title}) > 0`)],
);

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  tags: many(projectTags),
}));

// Tags for projects (many-to-many through junction table)
import { tags } from './schema.tags';

export const projectTags = sqliteTable(
  'project_tags',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    compositePk: primaryKey({
      columns: [table.projectId, table.tagId],
    }),
  }),
);

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, {
    fields: [projectTags.tagId],
    references: [tags.id],
  }),
}));

// Schema generation and types
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Base project schema for insertions (auto-generated from Drizzle table)
 */
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true, // Auto-generated UUIDv7
  slug: true, // Generated server-side from title
  createdAt: true, // Auto-generated
  updatedAt: true, // Auto-generated
});

/**
 * Complete project schema including all fields (auto-generated from Drizzle table)
 */
export const selectProjectSchema = createSelectSchema(projects);

/**
 * Project tag junction schema for insertions (auto-generated from Drizzle table)
 */
export const insertProjectTagSchema = createInsertSchema(projectTags);

/**
 * Complete project tag schema for reads
 */
export const selectProjectTagSchema = createSelectSchema(projectTags);

// Export types for TypeScript usage
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SelectProject = z.infer<typeof selectProjectSchema>;
export type InsertProjectTag = z.infer<typeof insertProjectTagSchema>;
export type SelectProjectTag = z.infer<typeof selectProjectTagSchema>;
