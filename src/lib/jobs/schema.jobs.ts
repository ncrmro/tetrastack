import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { generateUuidV7 } from '@/lib/uuid';

/**
 * Job status enum - defines all possible job states
 */
export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/**
 * Jobs table - tracks individual job executions
 *
 * This table provides:
 * - Job execution state machine (pending → running → completed/failed)
 * - Worker locking mechanism with expiration for distributed job processing
 * - Progress tracking (0-100%) with descriptive messages
 * - Full job history with parameters, results, and errors
 * - Retry attempt tracking for manual retry from admin dashboard
 */
export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUuidV7()),
    jobName: text('job_name').notNull(),
    params: text('params', { mode: 'json' }), // JSON-encoded job parameters
    result: text('result', { mode: 'json' }), // JSON-encoded job result
    status: text('status', {
      enum: Object.values(JOB_STATUS) as [string, ...string[]],
    })
      .notNull()
      .default(JOB_STATUS.PENDING),
    progress: integer('progress').default(0), // 0-100 percentage
    progressMessage: text('progress_message'), // Current step description
    error: text('error'), // Error message if failed
    workerStartedAt: integer('worker_started_at', { mode: 'timestamp_ms' }), // When worker claimed job
    workerExpiresAt: integer('worker_expires_at', { mode: 'timestamp_ms' }), // Worker lock expiration
    attemptCount: integer('attempt_count').notNull().default(0), // Number of retry attempts
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }), // When job finished
  },
  (table) => [
    // Index for finding available jobs to process
    index('jobs_status_expires_idx').on(table.status, table.workerExpiresAt),
    // Index for filtering by job name
    index('jobs_name_idx').on(table.jobName),
    // Index for finding jobs by status
    index('jobs_status_idx').on(table.status),
    // Validate progress is 0-100
    check(
      'progress_range',
      sql`${table.progress} >= 0 AND ${table.progress} <= 100`,
    ),
  ],
);

/**
 * Cron Jobs table - schedules recurring jobs with cron expressions
 *
 * Supports standard cron syntax like "0 * * * *" for hourly,
 * or "0 0 * * 0" for weekly on Sunday at midnight.
 */
export const cronJobs = sqliteTable(
  'cron_jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUuidV7()),
    jobName: text('job_name').notNull(), // Job class name to execute
    cronExpression: text('cron_expression').notNull(), // Standard cron syntax
    params: text('params', { mode: 'json' }), // Default parameters for the job
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    lastRunAt: integer('last_run_at', { mode: 'timestamp_ms' }),
    nextRunAt: integer('next_run_at', { mode: 'timestamp_ms' }), // Calculated from cron expression
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

// Relations (if needed in the future)
export const jobsRelations = relations(jobs, () => ({}));
export const cronJobsRelations = relations(cronJobs, () => ({}));

// Schema generation and types
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

/**
 * Base job schema for insertions (auto-generated from Drizzle table)
 */
export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true, // Auto-generated UUIDv7
  createdAt: true, // Auto-generated
  updatedAt: true, // Auto-generated
});

/**
 * Complete job schema including all fields (auto-generated from Drizzle table)
 */
export const selectJobSchema = createSelectSchema(jobs);

/**
 * Base cron job schema for insertions (auto-generated from Drizzle table)
 */
export const insertCronJobSchema = createInsertSchema(cronJobs).omit({
  id: true, // Auto-generated UUIDv7
  createdAt: true, // Auto-generated
  updatedAt: true, // Auto-generated
});

/**
 * Complete cron job schema including all fields (auto-generated from Drizzle table)
 */
export const selectCronJobSchema = createSelectSchema(cronJobs);

// Export types for TypeScript usage
export type InsertJob = z.infer<typeof insertJobSchema>;
export type SelectJob = z.infer<typeof selectJobSchema>;
export type InsertCronJob = z.infer<typeof insertCronJobSchema>;
export type SelectCronJob = z.infer<typeof selectCronJobSchema>;
