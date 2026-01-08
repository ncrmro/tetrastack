/**
 * Database schema for cron jobs table
 */

import {
  integer,
  sqliteTable,
  text,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Generate UUIDv7 (time-ordered UUID)
 */
function generateUuidV7(): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));

  const timestampHex = timestamp.toString(16).padStart(12, '0');
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${timestampHex.slice(0, 8)}-${timestampHex.slice(8, 12)}-7${randomHex.slice(0, 3)}-${randomHex.slice(3, 7)}-${randomHex.slice(7, 19)}`;
}

/**
 * Cron Jobs table - schedules recurring jobs with cron expressions
 *
 * Supports standard cron syntax like "0 * * * *" for hourly execution
 */
export const cronJobs = sqliteTable(
  'cron_jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUuidV7()),
    jobName: text('job_name').notNull(),
    cronExpression: text('cron_expression').notNull(),
    params: text('params', { mode: 'json' }),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
    nextRunAt: integer('next_run_at', { mode: 'timestamp_ms' }),
    lastJobId: text('last_job_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Index for finding jobs to run
    index('cron_jobs_next_run_idx').on(table.enabled, table.nextRunAt),
    // Index for filtering by job name
    index('cron_jobs_name_idx').on(table.jobName),
    // Validate cron expression is not empty
    check(
      'cron_expression_not_empty',
      sql`length(${table.cronExpression}) > 0`,
    ),
  ],
);

// Infer types from schema
export type InsertCronJob = typeof cronJobs.$inferInsert;
export type SelectCronJob = typeof cronJobs.$inferSelect;
