/**
 * Cloudflare Cron Handler factory
 */

import { CloudflareWorkerBackend } from './backend';
import type { WorkerBackendConfig } from '../interface';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CronHandlerConfig extends WorkerBackendConfig {
  // Additional handler-specific options
}

/**
 * Create a cron handler for Cloudflare scheduled events
 */
export function createCronHandler(config: CronHandlerConfig) {
  return {
    /**
     * Scheduled event handler
     */
    async scheduled(
      event: ScheduledEvent,
      env: Record<string, unknown>,
      ctx: ExecutionContext,
    ): Promise<void> {
      // Create backend instance
      const backend = new CloudflareWorkerBackend(config);

      // Initialize backend
      await backend.initialize();

      // Use waitUntil to ensure background work completes
      ctx.waitUntil(backend.handleCron());
    },
  };
}
