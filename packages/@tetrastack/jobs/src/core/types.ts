/**
 * Core types for the jobs system
 */

import { z } from 'zod';

/**
 * Job status enum - defines all possible job states
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Job status constant object
 */
export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/**
 * Configuration for defining a new job
 */
export interface JobConfig<TParams, TResult> {
  name: string;
  paramsSchema: z.ZodType<TParams>;
  resultSchema: z.ZodType<TResult>;
  handler: (params: TParams, context: JobContext) => Promise<TResult>;
}

/**
 * Metadata about job execution
 */
export interface JobMetadata {
  jobId?: string;
  jobName: string;
  enqueuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: JobStatus;
  attemptCount?: number;
  error?: string;
}

/**
 * Result wrapper from job execution
 */
export interface JobResult<T> {
  data: T;
  metadata: JobMetadata;
}

/**
 * Runtime context passed to job handler
 */
export interface JobContext {
  jobId?: string;
  updateProgress(percent: number, message?: string): Promise<void>;
  getDatabase(): unknown;
  log: {
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
  };
}

/**
 * Options for immediate execution (.now)
 */
export interface JobExecutionOptions {
  persist?: boolean;
  workerTimeoutMs?: number;
}

/**
 * Options for batch execution (.batch)
 */
export interface BatchExecutionOptions {
  concurrency?: number;
  persist?: boolean;
  stopOnError?: boolean;
}

/**
 * Database job record type (matches schema)
 */
export interface JobRecord {
  id: string;
  jobName: string;
  params: unknown;
  result?: unknown;
  status: JobStatus;
  progress: number;
  progressMessage?: string;
  error?: string;
  workerStartedAt?: Date;
  workerExpiresAt?: Date;
  attemptCount: number;
  maxAttempts: number;
  scheduledFor?: Date;
  correlationId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
