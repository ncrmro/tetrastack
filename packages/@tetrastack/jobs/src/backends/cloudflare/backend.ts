/**
 * Cloudflare Worker Backend implementation
 */

import { BaseWorkerBackend } from '../base';
import type { WorkerBackendConfig, PollResult } from '../interface';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CloudflareBackendConfig extends WorkerBackendConfig {
  // Cloudflare-specific options can be added here
}

/**
 * Cloudflare-specific WorkerBackend implementation
 */
export class CloudflareWorkerBackend extends BaseWorkerBackend {
  name = 'cloudflare';

  constructor(config: CloudflareBackendConfig) {
    super(config);
  }

  /**
   * Initialize backend (verify database connection)
   */
  async initialize(): Promise<void> {
    const health = await this.healthCheck();
    if (!health.healthy) {
      throw new Error(
        `Cloudflare backend initialization failed: ${health.message}`,
      );
    }
  }

  /**
   * Shutdown backend (no-op for stateless Cloudflare Workers)
   */
  async shutdown(): Promise<void> {
    // Stateless, nothing to clean up
  }

  /**
   * Poll and atomically claim pending jobs
   */
  async pollAndClaim(): Promise<PollResult> {
    // This is a simplified implementation
    // In practice, use proper Drizzle ORM queries
    console.warn('pollAndClaim should use proper database implementation');

    return {
      claimedJobs: [],
      availableCount: 0,
    };
  }

  /**
   * Handle cron trigger event
   */
  async handleCron(): Promise<void> {
    console.log(
      `[Cloudflare Backend] Cron trigger fired at ${new Date().toISOString()}`,
    );

    // Step 1: Handle expired locks
    const expiredCount = await this.handleExpiredLocks();
    if (expiredCount > 0) {
      console.log(
        `[Cloudflare Backend] Reset ${expiredCount} expired job locks`,
      );
    }

    // Step 2: Poll and claim available jobs
    const { claimedJobs, availableCount } = await this.pollAndClaim();
    console.log(
      `[Cloudflare Backend] Claimed ${claimedJobs.length} jobs, ${availableCount} remaining`,
    );

    if (claimedJobs.length === 0) {
      return;
    }

    // Step 3: Execute claimed jobs concurrently
    const results = await Promise.allSettled(
      claimedJobs.map((job) => this.execute(job)),
    );

    // Step 4: Log results
    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
          console.log(
            `[Cloudflare Backend] Job ${claimedJobs[index].id} completed in ${result.value.duration}ms`,
          );
        } else {
          failureCount++;
          console.error(
            `[Cloudflare Backend] Job ${claimedJobs[index].id} failed: ${result.value.error}`,
          );
        }
      } else {
        failureCount++;
        console.error(
          `[Cloudflare Backend] Job ${claimedJobs[index].id} error: ${result.reason}`,
        );
      }
    });

    console.log(
      `[Cloudflare Backend] Completed: ${successCount} succeeded, ${failureCount} failed`,
    );
  }
}
