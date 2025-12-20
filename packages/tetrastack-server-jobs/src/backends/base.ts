/**
 * Base Worker Backend implementation
 */

import type {
  WorkerBackend,
  WorkerBackendConfig,
  PollResult,
  WorkerExecutionResult,
  HealthCheckResult,
} from './interface';
import type { JobRecord } from '../core/types';

/**
 * Abstract base class for worker backends
 */
export abstract class BaseWorkerBackend implements WorkerBackend {
  abstract name: string;
  config: WorkerBackendConfig;

  constructor(config: WorkerBackendConfig) {
    this.config = {
      maxConcurrency: 5,
      lockTimeoutMs: 5 * 60 * 1000, // 5 minutes
      pollIntervalMs: 1000,
      ...config,
    };
  }

  // Abstract methods to be implemented by concrete backends
  abstract initialize(): Promise<void>;
  abstract pollAndClaim(limit?: number): Promise<PollResult>;
  abstract shutdown(): Promise<void>;

  /**
   * Execute a claimed job
   */
  async execute(job: JobRecord): Promise<WorkerExecutionResult> {
    const startTime = Date.now();

    try {
      // Get job class from registry
      const JobClass = this.config.jobRegistry.get(job.jobName);

      if (!JobClass) {
        throw new Error(`Job class "${job.jobName}" not found in registry`);
      }

      // Set database on job class
      JobClass.setDatabase(this.config.database);

      // Execute job from database
      await JobClass.executeFromDatabase(job.id);

      const duration = Date.now() - startTime;

      return {
        jobId: job.id,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        jobId: job.id,
        success: false,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Release job lock without executing
   */
  async releaseLock(): Promise<void> {
    // Database operations should be implemented by concrete backends
    // This is a placeholder that can be overridden
    const db = this.config.database as Record<string, unknown>;

    if (typeof db === 'object' && db !== null) {
      // Database update would go here
      console.warn('releaseLock called on base class - should be overridden');
    }
  }

  /**
   * Handle expired worker locks
   */
  async handleExpiredLocks(): Promise<number> {
    // Database operations should be implemented by concrete backends
    // This is a placeholder that can be overridden
    const db = this.config.database as Record<string, unknown>;

    if (typeof db === 'object' && db !== null) {
      // Database update would go here
      console.warn(
        'handleExpiredLocks called on base class - should be overridden',
      );
    }

    return 0;
  }

  /**
   * Check if backend is operational
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const db = this.config.database as Record<string, unknown>;

      // Verify database exists
      if (typeof db === 'object' && db !== null) {
        return {
          healthy: true,
        };
      }

      return {
        healthy: false,
        message: 'Database not configured',
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
