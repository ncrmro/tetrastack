/**
 * Schema exports for @tetrastack/server-jobs
 *
 * Usage in main app:
 * ```typescript
 * import { jobs, cronJobs } from '@tetrastack/server-jobs/schema';
 * import * as jobsSchema from '@tetrastack/server-jobs/schema';
 *
 * // Use in Drizzle config
 * export default defineConfig({
 *   schema: jobsSchema,
 *   // ...
 * });
 * ```
 */

// Jobs table
export {
  jobs,
  JOB_STATUS,
  type JobStatus,
  type InsertJob,
  type SelectJob,
} from './jobs';

// Cron jobs table
export { cronJobs, type InsertCronJob, type SelectCronJob } from './cron-jobs';

// UUID generator (for custom use)
export { generateUuidV7 } from './uuid';

/**
 * Combined schema object for Drizzle migrations
 *
 * Use this when configuring drizzle-kit:
 * ```typescript
 * import { schema } from '@tetrastack/server-jobs/schema';
 *
 * export default defineConfig({
 *   schema: schema,
 *   out: './drizzle',
 *   dialect: 'sqlite',
 * });
 * ```
 */
import { jobs } from './jobs';
import { cronJobs } from './cron-jobs';

export const schema = {
  jobs,
  cronJobs,
};
