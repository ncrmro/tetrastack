/**
 * Database schema for jobs table
 */

import {
  integer,
  sqliteTable,
  text,
  index,
  check,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { generateUuidV7 } from './uuid';

/**
 * Job status enum
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
 * Provides job execution state machine, worker locking, progress tracking,
 * and full job history with parameters, results, and errors.
 */
export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => generateUuidV7()),
    jobName: text('job_name').notNull(),
    params: text('params', { mode: 'json' }),
    result: text('result', { mode: 'json' }),
    status: text('status', {
      enum: Object.values(JOB_STATUS) as [string, ...string[]],
    })
      .notNull()
      .default(JOB_STATUS.PENDING),
    progress: integer('progress').notNull().default(0),
    progressMessage: text('progress_message'),
    error: text('error'),
    workerStartedAt: integer('worker_started_at', { mode: 'timestamp_ms' }),
    workerExpiresAt: integer('worker_expires_at', { mode: 'timestamp_ms' }),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }),
    correlationId: text('correlation_id'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date())
      .$onUpdate(() => new Date()),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    // Index for finding jobs by status and scheduled time
    index('jobs_status_scheduled_idx').on(table.status, table.scheduledFor),
    // Index for finding jobs with expired locks
    index('jobs_status_expires_idx').on(table.status, table.workerExpiresAt),
    // Index for filtering by job name
    index('jobs_name_idx').on(table.jobName),
    // Index for correlation tracking
    index('jobs_correlation_idx').on(table.correlationId),
    // Validate progress is 0-100
    check(
      'progress_range',
      sql`${table.progress} >= 0 AND ${table.progress} <= 100`,
    ),
  ],
);

// Infer types from schema
export type InsertJob = typeof jobs.$inferInsert;
export type SelectJob = typeof jobs.$inferSelect;
