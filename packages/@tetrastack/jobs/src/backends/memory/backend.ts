/**
 * In-Memory Backend implementation (for testing)
 */

import { BaseWorkerBackend } from '../base';
import type { WorkerBackendConfig, PollResult } from '../interface';
import type { JobRecord } from '../../core/types';
import { JOB_STATUS } from '../../schema';

/**
 * Testing backend that executes jobs synchronously without database
 */
export class InMemoryBackend extends BaseWorkerBackend {
  name = 'memory';

  private jobs = new Map<string, JobRecord>();
  private idCounter = 0;

  constructor(config: WorkerBackendConfig) {
    super(config);
  }

  /**
   * Initialize backend (no-op for in-memory)
   */
  async initialize(): Promise<void> {
    // No initialization needed for in-memory
  }

  /**
   * Shutdown backend (clear jobs)
   */
  async shutdown(): Promise<void> {
    this.jobs.clear();
  }

  /**
   * Poll and claim pending jobs
   */
  async pollAndClaim(limit?: number): Promise<PollResult> {
    const maxJobs = limit || this.config.maxConcurrency || 5;
    const now = new Date();

    // Find pending jobs
    const pendingJobs = Array.from(this.jobs.values()).filter(
      (job) =>
        job.status === JOB_STATUS.PENDING &&
        (!job.scheduledFor || job.scheduledFor <= now),
    );

    // Claim up to maxJobs
    const claimedJobs = pendingJobs.slice(0, maxJobs);
    const availableCount = pendingJobs.length - claimedJobs.length;

    // Update status to running
    claimedJobs.forEach((job) => {
      const updatedJob: JobRecord = {
        ...job,
        status: 'running' as const,
        workerStartedAt: now,
        workerExpiresAt: new Date(
          now.getTime() + (this.config.lockTimeoutMs || 5 * 60 * 1000),
        ),
        attemptCount: job.attemptCount + 1,
        updatedAt: now,
      };
      this.jobs.set(job.id, updatedJob);
    });

    return {
      claimedJobs,
      availableCount,
    };
  }

  /**
   * Add a job to in-memory storage
   */
  addJob(job: Partial<JobRecord>): string {
    const id = `job-${++this.idCounter}`;
    const now = new Date();

    const fullJob: JobRecord = {
      id,
      jobName: job.jobName || 'UnknownJob',
      params: job.params || {},
      result: job.result,
      status: job.status || JOB_STATUS.PENDING,
      progress: job.progress || 0,
      progressMessage: job.progressMessage,
      error: job.error,
      workerStartedAt: job.workerStartedAt,
      workerExpiresAt: job.workerExpiresAt,
      attemptCount: job.attemptCount || 0,
      maxAttempts: job.maxAttempts || 3,
      scheduledFor: job.scheduledFor,
      correlationId: job.correlationId,
      createdAt: job.createdAt || now,
      updatedAt: job.updatedAt || now,
      completedAt: job.completedAt,
    };

    this.jobs.set(id, fullJob);
    return id;
  }

  /**
   * Get a job by ID
   */
  getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): JobRecord[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Update a job
   */
  updateJob(id: string, updates: Partial<JobRecord>): void {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, {
        ...job,
        ...updates,
        updatedAt: new Date(),
      });
    }
  }
}
