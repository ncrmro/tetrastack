/**
 * Job System - Fluent Pattern Base Class
 *
 * Provides a fluent API for creating and executing jobs with support for:
 * - Immediate execution (.now())
 * - Deferred execution (.later()) - persisted to database
 * - Batch execution (.batch())
 * - Progress tracking with database persistence
 * - Worker locking with expiration for distributed processing
 *
 * @example
 * ```typescript
 * class MyJob extends Job<MyJobParams, MyJobResult> {
 *   protected async perform(params: MyJobParams): Promise<MyJobResult> {
 *     // Update progress during execution
 *     await this.updateProgress(25, 'Processing data...');
 *
 *     // Job logic here
 *     const result = await processData();
 *
 *     await this.updateProgress(75, 'Saving results...');
 *
 *     return result;
 *   }
 * }
 *
 * // Execute immediately (not persisted)
 * const result = await MyJob.now({ param1: 'value' });
 *
 * // Execute later (persisted to database)
 * const jobId = await MyJob.later({ param1: 'value' });
 *
 * // Batch execution
 * const results = await MyJob.batch([
 *   { param1: 'value1' },
 *   { param1: 'value2' }
 * ]);
 * ```
 */

import { db, createDatabaseClient, getResultArray } from '@/database';
import { jobs, JOB_STATUS } from '@/lib/jobs/schema.jobs';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobMetadata {
  jobName: string;
  enqueuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: JobStatus;
  error?: string;
}

export interface JobResult<T> {
  data: T;
  metadata: JobMetadata;
}

/**
 * Base Job class with fluent pattern support
 *
 * TParams: Type of parameters the job accepts (inferred from paramsSchema)
 * TResult: Type of result the job produces (inferred from resultSchema)
 */
export abstract class Job<TParams = unknown, TResult = unknown> {
  protected abstract perform(params: TParams): Promise<TResult>;

  // Required Zod schemas for runtime validation
  protected static readonly paramsSchema: z.ZodType<unknown>;
  protected static readonly resultSchema: z.ZodType<unknown>;

  // Current job ID when executing from database
  private _currentJobId?: string;

  /**
   * Validate and parse job parameters using the schema
   */
  private static validateParams<T>(params: unknown, jobName: string): T {
    try {
      return this.paramsSchema.parse(params) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid params for ${jobName}: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Validate and parse job result using the schema
   */
  private static validateResult<T>(result: unknown, jobName: string): T {
    try {
      return this.resultSchema.parse(result) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid result for ${jobName}: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        );
      }
      throw error;
    }
  }

  /**
   * Update job progress in database (only works when job is persisted)
   *
   * @param progress - Percentage (0-100)
   * @param message - Optional progress message
   */
  protected async updateProgress(
    progress: number,
    message?: string,
  ): Promise<void> {
    if (!this._currentJobId) {
      // Job not persisted, skip update
      return;
    }

    // Use fresh database client to avoid connection timeout issues
    const progressDb = createDatabaseClient();
    await progressDb
      .update(jobs)
      .set({
        progress,
        progressMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, this._currentJobId));
  }

  /**
   * Execute job immediately
   *
   * @param params - Job parameters
   * @param options - Execution options
   * @param options.persist - Whether to persist job to database (default: true)
   * @returns Job result with metadata including job ID
   */
  static async now<TParams, TResult>(
    this: typeof Job<TParams, TResult>,
    params: TParams,
    options: { persist?: boolean } = {},
  ): Promise<JobResult<TResult>> {
    const { persist = true } = options;
    const instance = new (this as unknown as new () => Job<TParams, TResult>)();
    const jobName = this.name;
    const now = new Date();

    // Validate params
    const validatedParams = this.validateParams<TParams>(params, jobName);

    // If persist is false, execute directly without database
    if (!persist) {
      const metadata: JobMetadata = {
        jobName,
        enqueuedAt: now,
        startedAt: now,
        status: 'running',
      };

      try {
        const data = await instance.perform(validatedParams);
        const validatedResult = this.validateResult<TResult>(data, jobName);

        metadata.completedAt = new Date();
        metadata.status = 'completed';

        return { data: validatedResult, metadata } as JobResult<TResult>;
      } catch (error) {
        metadata.completedAt = new Date();
        metadata.status = 'failed';
        metadata.error = error instanceof Error ? error.message : String(error);
        throw error;
      }
    }

    // Create fresh database client to avoid connection timeout issues
    const freshDb = createDatabaseClient();

    // Create job record in database
    const result = await freshDb
      .insert(jobs)
      .values({
        jobName,
        params: validatedParams as Record<string, unknown>,
        status: JOB_STATUS.RUNNING,
        progress: 0,
        attemptCount: 1,
        workerStartedAt: now,
      })
      .returning();
    const [jobRecord] = getResultArray(result);

    instance._currentJobId = jobRecord.id;

    const metadata: JobMetadata = {
      jobName,
      enqueuedAt: jobRecord.createdAt,
      startedAt: now,
      status: 'running',
    };

    try {
      const data = await instance.perform(validatedParams);

      // Validate result before storing
      const validatedResult = this.validateResult<TResult>(data, jobName);

      metadata.completedAt = new Date();
      metadata.status = 'completed';

      // Update job record with success (use fresh client)
      const updateDb = createDatabaseClient();
      await updateDb
        .update(jobs)
        .set({
          status: JOB_STATUS.COMPLETED,
          result: validatedResult as Record<string, unknown>,
          progress: 100,
          completedAt: metadata.completedAt,
          updatedAt: metadata.completedAt,
        })
        .where(eq(jobs.id, jobRecord.id));

      return { data: validatedResult, metadata } as JobResult<TResult>;
    } catch (error) {
      metadata.completedAt = new Date();
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);

      // Update job record with failure (use fresh client)
      const errorDb = createDatabaseClient();
      await errorDb
        .update(jobs)
        .set({
          status: JOB_STATUS.FAILED,
          error: metadata.error,
          completedAt: metadata.completedAt,
          updatedAt: metadata.completedAt,
        })
        .where(eq(jobs.id, jobRecord.id));

      throw error;
    }
  }

  /**
   * Queue job for later execution (persists to database)
   *
   * Creates a job record in the database with pending status.
   * A separate worker process should poll for pending jobs and execute them.
   *
   * @param params - Job parameters
   * @returns Promise that resolves with the job ID
   */
  static async later<TParams, TResult>(
    this: typeof Job<TParams, TResult>,
    params: TParams,
  ): Promise<string> {
    const jobName = this.name;

    // Validate params before storing
    const validatedParams = this.validateParams<TParams>(params, jobName);

    // Persist job to database
    const [job] = await db
      .insert(jobs)
      .values({
        jobName,
        params: validatedParams as Record<string, unknown>,
        status: JOB_STATUS.PENDING,
        progress: 0,
        attemptCount: 0,
      })
      .returning();

    return job.id;
  }

  /**
   * Execute a persisted job from the database
   *
   * This is called by worker processes to execute queued jobs.
   * It claims the job with a worker lock and executes it.
   *
   * @param jobId - The database ID of the job to execute
   * @param workerTimeoutMs - Worker lock timeout in milliseconds (default: 5 minutes)
   * @returns Job result with metadata
   */
  static async executeFromDatabase<TParams, TResult>(
    this: typeof Job<TParams, TResult>,
    jobId: string,
    workerTimeoutMs: number = 5 * 60 * 1000, // 5 minutes default
  ): Promise<JobResult<TResult>> {
    const instance = new (this as unknown as new () => Job<TParams, TResult>)();
    instance._currentJobId = jobId;
    const jobName = this.name;

    // Claim the job with worker lock
    const now = new Date();
    const expiresAt = new Date(now.getTime() + workerTimeoutMs);

    await db
      .update(jobs)
      .set({
        status: JOB_STATUS.RUNNING,
        workerStartedAt: now,
        workerExpiresAt: expiresAt,
        attemptCount: sql`${jobs.attemptCount} + 1`,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Fetch job details
    const [jobRecord] = await db.select().from(jobs).where(eq(jobs.id, jobId));

    if (!jobRecord) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Validate params when retrieving from database
    const validatedParams = this.validateParams<TParams>(
      jobRecord.params,
      jobName,
    );

    const metadata: JobMetadata = {
      jobName,
      enqueuedAt: jobRecord.createdAt,
      startedAt: now,
      status: 'running',
    };

    try {
      const data = await instance.perform(validatedParams);

      // Validate result before storing
      const validatedResult = this.validateResult<TResult>(data, jobName);

      metadata.completedAt = new Date();
      metadata.status = 'completed';

      // Update job record with success
      await db
        .update(jobs)
        .set({
          status: JOB_STATUS.COMPLETED,
          result: validatedResult as Record<string, unknown>,
          progress: 100,
          completedAt: metadata.completedAt,
          updatedAt: metadata.completedAt,
        })
        .where(eq(jobs.id, jobId));

      return { data: validatedResult, metadata } as JobResult<TResult>;
    } catch (error) {
      metadata.completedAt = new Date();
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);

      // Update job record with failure
      await db
        .update(jobs)
        .set({
          status: JOB_STATUS.FAILED,
          error: metadata.error,
          completedAt: metadata.completedAt,
          updatedAt: metadata.completedAt,
        })
        .where(eq(jobs.id, jobId));

      throw error;
    }
  }

  /**
   * Execute multiple jobs in batch
   *
   * @param paramsList - Array of job parameters
   * @param options - Batch execution options
   * @param options.concurrency - Maximum concurrent jobs (default: 3)
   * @param options.stopOnError - Stop on first error (default: false)
   * @param options.persist - Whether to persist jobs to database (default: true)
   * @returns Array of job results
   */
  static async batch<TParams, TResult>(
    this: typeof Job<TParams, TResult>,
    paramsList: TParams[],
    options: {
      concurrency?: number;
      stopOnError?: boolean;
      persist?: boolean;
    } = {},
  ): Promise<JobResult<TResult>[]> {
    const { concurrency = 3, stopOnError = false, persist = true } = options;

    // Validate concurrency is a positive integer
    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      throw new Error('Concurrency must be a positive integer');
    }

    // Simple batch execution with concurrency control
    const results: JobResult<TResult>[] = [];
    const errors: Error[] = [];

    // Get reference to the constructor with proper typing
    const JobClass = this as unknown as {
      now: (
        params: TParams,
        options?: { persist?: boolean },
      ) => Promise<JobResult<TResult>>;
    };

    for (let i = 0; i < paramsList.length; i += concurrency) {
      const batch = paramsList.slice(i, i + concurrency);

      const batchPromises = batch.map((params) =>
        JobClass.now(params, { persist }).catch((error: Error) => {
          if (stopOnError) throw error;
          errors.push(error);
          return null;
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(
        ...batchResults.filter((r): r is JobResult<TResult> => r !== null),
      );

      if (stopOnError && errors.length > 0) {
        throw errors[0];
      }
    }

    if (errors.length > 0 && !stopOnError) {
      console.warn(`${errors.length} jobs failed in batch execution`);
    }

    return results;
  }

  /**
   * Get job name (useful for logging and monitoring)
   */
  static getJobName(): string {
    return this.name;
  }
}

/**
 * Helper to create a simple job from a function
 *
 * @example
 * ```typescript
 * const sendEmailParamsSchema = z.object({
 *   to: z.string().email(),
 *   subject: z.string()
 * });
 *
 * const sendEmailResultSchema = z.object({
 *   sent: z.boolean()
 * });
 *
 * const SendEmailJob = createJob(
 *   'SendEmail',
 *   sendEmailParamsSchema,
 *   sendEmailResultSchema,
 *   async (params) => {
 *     await sendEmail(params);
 *     return { sent: true };
 *   }
 * );
 *
 * await SendEmailJob.now({ to: 'user@example.com', subject: 'Hello' });
 * ```
 */
export function createJob<TParams, TResult>(
  name: string,
  paramsSchema: z.ZodType<TParams>,
  resultSchema: z.ZodType<TResult>,
  handler: (params: TParams) => Promise<TResult>,
): typeof Job<TParams, TResult> {
  return class extends Job<TParams, TResult> {
    static readonly jobName = name;
    protected static readonly paramsSchema = paramsSchema;
    protected static readonly resultSchema = resultSchema;

    protected async perform(params: TParams): Promise<TResult> {
      return handler(params);
    }
  };
}
