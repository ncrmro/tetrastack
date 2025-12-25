import { integer, sqliteTable, text, check } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { projects } from './schema.projects';
import { users } from './schema.auth';
import { uuidv7 } from '@tetrastack/backend/utils';

/**
 * Task status enum - defines all possible task states
 */
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

/**
 * Task priority enum - defines task priority levels
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const tasks = sqliteTable(
  'tasks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', {
      enum: Object.values(TASK_STATUS) as [string, ...string[]],
    })
      .notNull()
      .default(TASK_STATUS.TODO),
    priority: text('priority', {
      enum: Object.values(TASK_PRIORITY) as [string, ...string[]],
    })
      .notNull()
      .default(TASK_PRIORITY.MEDIUM),
    assigneeId: text('assignee_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    dueDate: integer('due_date', { mode: 'timestamp_ms' }),
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

export const comments = sqliteTable(
  'comments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [check('content_not_empty', sql`length(${table.content}) > 0`)],
);

// Relations
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

// Schema generation and types
import { createSelectSchema } from 'drizzle-zod';
import { createAutoInsertSchema } from '@/lib/db/schema-helpers';
import { z } from 'zod';

/**
 * Base task schema for insertions (auto-generated from Drizzle table)
 * Auto-omits: id, createdAt, updatedAt
 */
export const insertTaskSchema = createAutoInsertSchema(tasks);

/**
 * Complete task schema including all fields (auto-generated from Drizzle table)
 */
export const selectTaskSchema = createSelectSchema(tasks);

/**
 * Base comment schema for insertions (auto-generated from Drizzle table)
 * Auto-omits: id, createdAt, updatedAt
 */
export const insertCommentSchema = createAutoInsertSchema(comments);

/**
 * Complete comment schema including all fields (auto-generated from Drizzle table)
 */
export const selectCommentSchema = createSelectSchema(comments);

// Export types for TypeScript usage
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type SelectTask = z.infer<typeof selectTaskSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type SelectComment = z.infer<typeof selectCommentSchema>;
