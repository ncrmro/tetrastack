/**
 * Job Context implementation
 */

import type { JobContext } from './types';

export interface CreateJobContextOptions {
  jobId?: string;
  database: unknown;
  persist?: boolean;
}

/**
 * Create a job context for handler execution
 */
export function createJobContext(options: CreateJobContextOptions): JobContext {
  const { jobId, database, persist = true } = options;

  return {
    jobId,

    /**
     * Update job progress in database (only works when job is persisted)
     */
    async updateProgress(percent: number, message?: string): Promise<void> {
      // Only update if job is persisted
      if (!jobId || !persist) {
        return;
      }

      // Clamp progress to 0-100
      const clampedProgress = Math.max(0, Math.min(100, percent));

      // Update database
      // Note: This assumes database is a Drizzle client
      // In actual usage, this would need proper typing
      if (database && typeof database === 'object') {
        try {
          // Database update would go here - simplified for now
          // In real implementation, use proper Drizzle ORM methods
          console.log('Progress update:', clampedProgress, message);
        } catch (error) {
          // Silently fail progress updates - they're not critical
          console.warn('Failed to update job progress:', error);
        }
      }
    },

    /**
     * Get database client
     */
    getDatabase(): unknown {
      return database;
    },

    /**
     * Logging methods
     */
    log: {
      info(message: string, data?: unknown): void {
        const prefix = jobId ? `[Job ${jobId}]` : '[Job]';
        console.log(`${prefix} INFO:`, message, data || '');
      },

      warn(message: string, data?: unknown): void {
        const prefix = jobId ? `[Job ${jobId}]` : '[Job]';
        console.warn(`${prefix} WARN:`, message, data || '');
      },

      error(message: string, data?: unknown): void {
        const prefix = jobId ? `[Job ${jobId}]` : '[Job]';
        console.error(`${prefix} ERROR:`, message, data || '');
      },
    },
  };
}
