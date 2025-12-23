/**
 * Main package exports
 */

// Core exports
export { defineJob, Job } from './src/core/job';
export { createJobRegistry } from './src/core/registry';
export { createJobContext } from './src/core/context';

// Type exports
export type {
  JobConfig,
  JobResult,
  JobMetadata,
  JobContext,
  JobStatus,
  JobExecutionOptions,
  BatchExecutionOptions,
  JobRecord,
} from './src/core/types';

export type { JobRegistry } from './src/core/registry';

// Schema exports
export { JOB_STATUS } from './src/schema';
