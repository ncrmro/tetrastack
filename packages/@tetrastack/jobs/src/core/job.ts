/**
 * Job implementation - Core job class and defineJob factory
 */

import { z } from 'zod';
import type {
  JobConfig,
  JobResult,
  JobMetadata,
  JobExecutionOptions,
  BatchExecutionOptions,
  JobContext,
} from './types';
import { createJobContext } from './context';

// Used for typing but not imported to avoid circular dependency issues
// Actual Job classes will define these statically
type JobClass<TParams, TResult> = typeof Job & {
  now(
    params: TParams,
    options?: JobExecutionOptions,
  ): Promise<JobResult<TResult>>;
  later(params: TParams): Promise<string>;
  batch(
    paramsList: TParams[],
    options?: BatchExecutionOptions,
  ): Promise<JobResult<TResult>[]>;
  executeFromDatabase(jobId: string): Promise<JobResult<TResult>>;
};

/**
 * Abstract Job base class
 */
export abstract class Job {
  // Required Zod schemas for runtime validation
  static readonly paramsSchema: z.ZodType<unknown>;
  static readonly resultSchema: z.ZodType<unknown>;
  static readonly jobName: string;

  // Handler function
  protected static handler?: (
    params: unknown,
    context: JobContext,
  ) => Promise<unknown>;

  // Database client (to be set by backend)
  protected static database?: unknown;

  /**
   * Set the database client for this job class
   */
  static setDatabase(db: unknown): void {
    this.database = db;
  }

  /**
   * Validate and parse job parameters using the schema
   */
  protected static validateParams<T>(params: unknown, jobName: string): T {
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
  protected static validateResult<T>(result: unknown, jobName: string): T {
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
   * Execute job immediately
   *
   * @param params - Job parameters
   * @param options - Execution options
   * @returns Job result with metadata
   */
  static async now<TParams, TResult>(
    this: JobClass<TParams, TResult>,
    params: TParams,
    options: JobExecutionOptions = {},
  ): Promise<JobResult<TResult>> {
    const { persist = true } = options;
    const jobName = this.jobName || this.name;
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
        const context = createJobContext({
          database: this.database,
          persist: false,
        });

        const handler = this.handler;
        if (!handler) {
          throw new Error(`No handler defined for job ${jobName}`);
        }

        const data = await handler(validatedParams, context);
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

    // Persist to database
    if (!this.database) {
      throw new Error('Database not configured for job persistence');
    }

    // Create job record in database
    // Note: This is a simplified placeholder
    // Actual implementation should use proper Drizzle ORM
    const jobRecord = {
      id: 'temp-id',
      createdAt: now,
    };

    const jobId = jobRecord.id;

    const metadata: JobMetadata = {
      jobId,
      jobName,
      enqueuedAt: jobRecord.createdAt,
      startedAt: now,
      status: 'running',
      attemptCount: 1,
    };

    try {
      const context = createJobContext({
        jobId,
        database: this.database,
        persist: true,
      });

      const handler = this.handler;
      if (!handler) {
        throw new Error(`No handler defined for job ${jobName}`);
      }

      const data = await handler(validatedParams, context);
      const validatedResult = this.validateResult<TResult>(data, jobName);

      metadata.completedAt = new Date();
      metadata.status = 'completed';

      // Update job record with success
      // Simplified - actual implementation should use Drizzle
      console.log('Job completed:', jobId);

      return { data: validatedResult, metadata } as JobResult<TResult>;
    } catch (error) {
      metadata.completedAt = new Date();
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);

      // Update job record with failure
      // Simplified - actual implementation should use Drizzle
      console.error('Job failed:', jobId, metadata.error);

      throw error;
    }
  }

  /**
   * Queue job for later execution (persists to database)
   *
   * @param params - Job parameters
   * @returns Promise that resolves with the job ID
   */
  static async later<TParams, TResult>(
    this: JobClass<TParams, TResult>,
    params: TParams,
  ): Promise<string> {
    const jobName = this.jobName || this.name;

    // Validate params before storing
    this.validateParams<TParams>(params, jobName);

    if (!this.database) {
      throw new Error('Database not configured for job persistence');
    }

    // Simplified implementation - actual use would need Drizzle
    const jobId = 'temp-job-id';
    console.log('Job queued:', jobId);

    return jobId;
  }

  /**
   * Execute multiple jobs in batch
   *
   * @param paramsList - Array of job parameters
   * @param options - Batch execution options
   * @returns Array of job results
   */
  static async batch<TParams, TResult>(
    this: JobClass<TParams, TResult>,
    paramsList: TParams[],
    options: BatchExecutionOptions = {},
  ): Promise<JobResult<TResult>[]> {
    const { concurrency = 3, stopOnError = false, persist = true } = options;

    // Validate concurrency is a positive integer
    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      throw new Error('Concurrency must be a positive integer');
    }

    const results: JobResult<TResult>[] = [];
    const errors: Error[] = [];

    // Process jobs in batches
    for (let i = 0; i < paramsList.length; i += concurrency) {
      const batch = paramsList.slice(i, i + concurrency);

      const batchPromises = batch.map((params) =>
        this.now(params, { persist }).catch((error: Error) => {
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
   * Execute a persisted job from the database
   *
   * @param jobId - The database ID of the job to execute
   * @param options - Execution options
   * @returns Job result with metadata
   */
  static async executeFromDatabase<TParams, TResult>(
    this: JobClass<TParams, TResult>,
    jobId: string,
  ): Promise<JobResult<TResult>> {
    const jobName = this.jobName || this.name;

    if (!this.database) {
      throw new Error('Database not configured for job persistence');
    }

    // Simplified implementation - actual use would need Drizzle
    const now = new Date();
    const jobRecord = {
      id: jobId,
      params: {},
      createdAt: now,
      attemptCount: 1,
    };

    // Validate params when retrieving from database
    const validatedParams = this.validateParams<TParams>(
      jobRecord.params,
      jobName,
    );

    const metadata: JobMetadata = {
      jobId,
      jobName,
      enqueuedAt: jobRecord.createdAt,
      startedAt: now,
      status: 'running',
      attemptCount: jobRecord.attemptCount,
    };

    try {
      const context = createJobContext({
        jobId,
        database: this.database,
        persist: true,
      });

      const handler = this.handler;
      if (!handler) {
        throw new Error(`No handler defined for job ${jobName}`);
      }

      const data = await handler(validatedParams, context);
      const validatedResult = this.validateResult<TResult>(data, jobName);

      metadata.completedAt = new Date();
      metadata.status = 'completed';

      // Update job record with success
      // Simplified - actual implementation should use Drizzle
      console.log('Database job completed:', jobId);

      return { data: validatedResult, metadata } as JobResult<TResult>;
    } catch (error) {
      metadata.completedAt = new Date();
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : String(error);

      // Update job record with failure
      // Simplified - actual implementation should use Drizzle
      console.error('Database job failed:', jobId, metadata.error);

      throw error;
    }
  }

  /**
   * Get job name (useful for logging and monitoring)
   */
  static getJobName(): string {
    return this.jobName || this.name;
  }
}

/**
 * Factory function to define a new job
 *
 * @param config - Job configuration
 * @returns Job class extending Job base
 */
export function defineJob<TParams, TResult>(
  config: JobConfig<TParams, TResult>,
): JobClass<TParams, TResult> {
  const { name, paramsSchema, resultSchema, handler } = config;

  class DefinedJob extends Job {
    static readonly jobName = name;
    static readonly paramsSchema = paramsSchema;
    static readonly resultSchema = resultSchema;
    // Cast handler to match base class type signature
    static readonly handler = handler as (
      params: unknown,
      context: JobContext,
    ) => Promise<unknown>;
  }

  // Set the class name for better debugging
  Object.defineProperty(DefinedJob, 'name', { value: name });

  return DefinedJob as JobClass<TParams, TResult>;
}
