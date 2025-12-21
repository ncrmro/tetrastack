/**
 * Worker Backend Interface
 */

import type { JobRecord } from '../core/types';
import type { JobRegistry } from '../core/registry';

/**
 * Worker backend configuration
 */
export interface WorkerBackendConfig {
  database: unknown;
  jobRegistry: JobRegistry;
  maxConcurrency?: number;
  lockTimeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * Result from polling for jobs
 */
export interface PollResult {
  claimedJobs: JobRecord[];
  availableCount: number;
}

/**
 * Result from executing a job
 */
export interface WorkerExecutionResult {
  jobId: string;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
}

/**
 * Pluggable abstraction for job execution infrastructure
 */
export interface WorkerBackend {
  name: string;
  config: WorkerBackendConfig;

  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;

  // Job Processing
  pollAndClaim(limit?: number): Promise<PollResult>;
  execute(job: JobRecord): Promise<WorkerExecutionResult>;
  releaseLock(jobId: string): Promise<void>;

  // Maintenance
  handleExpiredLocks(): Promise<number>;
  healthCheck(): Promise<HealthCheckResult>;
}
