# @tetrastack/server-jobs

A background job processing framework with database persistence and pluggable worker backends. Designed for Cloudflare Workers with Cron Triggers, extensible to future backends like Kubernetes Jobs.

## Features

- 🎯 **Type-safe** - Full TypeScript support with Zod schema validation
- 🔌 **Pluggable** - Support for multiple worker backends (Cloudflare, in-memory, etc.)
- 💾 **Persistent** - Database-backed job storage with progress tracking
- ⚡ **Flexible execution** - Immediate, deferred, or batch execution
- 🔒 **Distributed locking** - Worker locks prevent double execution
- 📊 **Progress tracking** - Real-time progress updates during execution
- 🔄 **Retry support** - Automatic retry with attempt tracking

## Installation

This package is part of the Tetrastack monorepo workspace. Reference it in your project:

```json
{
  "dependencies": {
    "@tetrastack/server-jobs": "*"
  }
}
```

## Quick Start

### 1. Define a Job

```typescript
import { defineJob } from '@tetrastack/server-jobs';
import { z } from 'zod';

// Define schemas
const sendEmailParamsSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

const sendEmailResultSchema = z.object({
  messageId: z.string(),
  sentAt: z.date(),
});

// Create job
export const SendEmailJob = defineJob({
  name: 'SendEmail',
  paramsSchema: sendEmailParamsSchema,
  resultSchema: sendEmailResultSchema,
  async handler(params, context) {
    await context.updateProgress(0, 'Sending email...');

    const messageId = await emailService.send(params);

    await context.updateProgress(100, 'Email sent');

    return {
      messageId,
      sentAt: new Date(),
    };
  },
});
```

### 2. Execute Jobs

```typescript
// Execute immediately
const result = await SendEmailJob.now({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'World',
});

console.log(result.data.messageId); // Fully typed!

// Queue for later execution
const jobId = await SendEmailJob.later({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'World',
});

// Batch execution
const results = await SendEmailJob.batch(
  [
    { to: 'user1@example.com', subject: 'Hi', body: 'Hello' },
    { to: 'user2@example.com', subject: 'Hi', body: 'Hello' },
  ],
  {
    concurrency: 5,
    stopOnError: false,
  },
);
```

### 3. Set Up Worker Backend (Cloudflare)

```typescript
import { createCronHandler } from '@tetrastack/server-jobs/cloudflare';
import { createJobRegistry } from '@tetrastack/server-jobs';
import { createDatabaseClient } from './db';
import { SendEmailJob } from './jobs';

// Create job registry
const registry = createJobRegistry().register(SendEmailJob);

// Create cron handler
export default createCronHandler({
  database: createDatabaseClient(),
  jobRegistry: registry,
  maxConcurrency: 10,
  lockTimeoutMs: 5 * 60 * 1000, // 5 minutes
});
```

Configure in `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Every minute
```

## API Reference

### Core API

#### `defineJob(config)`

Define a new job type.

**Parameters:**

- `config.name` - Unique job identifier
- `config.paramsSchema` - Zod schema for input parameters
- `config.resultSchema` - Zod schema for output result
- `config.handler` - Async function that performs the work

**Returns:** Job class with static methods

#### Job Methods

##### `.now(params, options?)`

Execute job immediately.

**Options:**

- `persist` - Whether to save to database (default: true)
- `workerTimeoutMs` - Worker lock timeout (default: 5 minutes)

**Returns:** `Promise<JobResult<TResult>>`

##### `.later(params)`

Queue job for later execution.

**Returns:** `Promise<string>` - Job ID

##### `.batch(paramsList, options?)`

Execute multiple jobs with concurrency control.

**Options:**

- `concurrency` - Max parallel jobs (default: 3)
- `persist` - Save to database (default: true)
- `stopOnError` - Abort on first failure (default: false)

**Returns:** `Promise<JobResult<TResult>[]>`

##### `.executeFromDatabase(jobId, options?)`

Execute a queued job (called by workers).

**Returns:** `Promise<JobResult<TResult>>`

### Job Context

The context object passed to job handlers:

```typescript
interface JobContext {
  jobId?: string;
  updateProgress(percent: number, message?: string): Promise<void>;
  getDatabase(): unknown;
  log: {
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
  };
}
```

### Job Registry

```typescript
const registry = createJobRegistry()
  .register(SendEmailJob)
  .register(ProcessDataJob);

registry.has('SendEmail'); // true
registry.get('SendEmail'); // SendEmailJob class
registry.getNames(); // ['SendEmail', 'ProcessDataJob']
```

## Worker Backends

### Cloudflare Worker Backend

Designed for Cloudflare Workers with Cron Triggers.

**Features:**

- Stateless per invocation
- Atomic job claiming with SQL
- Worker lock timeout handling
- Concurrent job processing

**Usage:** See Quick Start above

### In-Memory Backend

For testing and local development.

```typescript
import { InMemoryBackend } from '@tetrastack/server-jobs/memory';

const backend = new InMemoryBackend({
  database: mockDb,
  jobRegistry: registry,
});

await backend.initialize();
const { claimedJobs } = await backend.pollAndClaim();
await backend.execute(claimedJobs[0]);
```

## Database Schema

### Jobs Table

Stores individual job executions with status tracking:

- `id` - UUIDv7 primary key
- `jobName` - Job type identifier
- `params` - JSON-encoded parameters
- `result` - JSON-encoded result
- `status` - pending | running | completed | failed
- `progress` - 0-100 percentage
- `progressMessage` - Current step description
- `error` - Error message if failed
- `workerStartedAt` - When worker claimed job
- `workerExpiresAt` - Worker lock expiration
- `attemptCount` - Number of execution attempts
- `maxAttempts` - Maximum retry attempts
- `scheduledFor` - Deferred execution time
- `correlationId` - Tracing ID
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

### Cron Jobs Table

Schedules recurring jobs:

- `id` - UUIDv7 primary key
- `jobName` - Job type to execute
- `cronExpression` - Cron schedule (e.g., "0 \* \* \* \*")
- `params` - Default parameters
- `enabled` - Whether schedule is active
- `lastRunAt` - Last execution time
- `nextRunAt` - Next scheduled time
- `lastJobId` - ID of last created job
- Timestamps: `createdAt`, `updatedAt`

## Exports

### Main Entry (`@tetrastack/server-jobs`)

```typescript
import {
  defineJob,
  createJobRegistry,
  createJobContext,
  JOB_STATUS,
  type JobResult,
  type JobMetadata,
  type JobContext,
} from '@tetrastack/server-jobs';
```

### Schema (`@tetrastack/server-jobs/schema`)

```typescript
import {
  jobs,
  cronJobs,
  JOB_STATUS,
  type InsertJob,
  type SelectJob,
  type InsertCronJob,
  type SelectCronJob,
} from '@tetrastack/server-jobs/schema';
```

### Cloudflare (`@tetrastack/server-jobs/cloudflare`)

```typescript
import {
  CloudflareWorkerBackend,
  createCronHandler,
} from '@tetrastack/server-jobs/cloudflare';
```

### Memory (`@tetrastack/server-jobs/memory`)

```typescript
import { InMemoryBackend } from '@tetrastack/server-jobs/memory';
```

### Backend Interface (`@tetrastack/server-jobs/backend`)

```typescript
import type {
  WorkerBackend,
  WorkerBackendConfig,
  PollResult,
  WorkerExecutionResult,
} from '@tetrastack/server-jobs/backend';
```

## Local Development & Testing

### Quick Verification

To quickly verify that jobs are working locally, follow these steps:

#### 1. Set Up Database

Ensure your database is running with the jobs tables:

```bash
# Start services (if using Docker)
make up

# Or run migrations directly
npm run db:migrate
```

#### 2. Create a Test Job

Create a simple test job in `src/jobs/test-job.ts`:

```typescript
import { defineJob } from '@tetrastack/server-jobs';
import { z } from 'zod';

export const TestJob = defineJob({
  name: 'TestJob',
  paramsSchema: z.object({
    message: z.string(),
  }),
  resultSchema: z.object({
    processedMessage: z.string(),
    timestamp: z.date(),
  }),
  async handler(params, context) {
    context.log.info('Starting test job', params);

    await context.updateProgress(50, 'Processing...');

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await context.updateProgress(100, 'Complete');

    return {
      processedMessage: `Processed: ${params.message}`,
      timestamp: new Date(),
    };
  },
});
```

#### 3. Test Immediate Execution

Create a test script `src/jobs/test-runner.ts`:

```typescript
import { TestJob } from './test-job';
import { db } from '@/database';

// Configure job with database
TestJob.setDatabase(db);

async function testJobs() {
  console.log('Testing immediate execution...');

  // Test with persistence
  const result1 = await TestJob.now(
    { message: 'Hello, World!' },
    { persist: true },
  );
  console.log('✓ Job completed:', result1.data);
  console.log('  Job ID:', result1.metadata.jobId);
  console.log('  Status:', result1.metadata.status);

  // Test without persistence (faster)
  const result2 = await TestJob.now(
    { message: 'Quick test' },
    { persist: false },
  );
  console.log('✓ Non-persisted job:', result2.data);

  // Test batch execution
  console.log('\nTesting batch execution...');
  const results = await TestJob.batch(
    [{ message: 'Batch 1' }, { message: 'Batch 2' }, { message: 'Batch 3' }],
    { concurrency: 2 },
  );
  console.log(`✓ Batch completed: ${results.length} jobs`);

  // Test queuing for later
  console.log('\nTesting deferred execution...');
  const jobId = await TestJob.later({ message: 'Queued job' });
  console.log('✓ Job queued with ID:', jobId);
}

testJobs()
  .then(() => console.log('\n✓ All tests passed!'))
  .catch(console.error);
```

Run the test:

```bash
npx tsx src/jobs/test-runner.ts
```

#### 4. Verify in Database

Check that jobs were persisted:

```bash
# Using Turso CLI (if using Turso)
turso db shell <your-database> "SELECT id, jobName, status, progress FROM jobs ORDER BY createdAt DESC LIMIT 5;"

# Or using SQLite directly (local development)
sqlite3 data/libsql/local.db "SELECT id, jobName, status, progress FROM jobs ORDER BY createdAt DESC LIMIT 5;"
```

### Testing with InMemoryBackend

For unit tests, use the in-memory backend:

```typescript
import { defineJob, createJobRegistry } from '@tetrastack/server-jobs';
import { InMemoryBackend } from '@tetrastack/server-jobs/memory';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Job System', () => {
  it('should execute jobs successfully', async () => {
    const TestJob = defineJob({
      name: 'TestJob',
      paramsSchema: z.object({ input: z.string() }),
      resultSchema: z.object({ output: z.string() }),
      async handler(params) {
        return { output: params.input.toUpperCase() };
      },
    });

    const registry = createJobRegistry().register(TestJob);
    const backend = new InMemoryBackend({
      database: {}, // Mock DB
      jobRegistry: registry,
    });

    await backend.initialize();

    // Add and execute a job
    const jobId = backend.addJob({
      jobName: 'TestJob',
      params: { input: 'hello' },
    });

    const { claimedJobs } = await backend.pollAndClaim();
    expect(claimedJobs).toHaveLength(1);

    const result = await backend.execute(claimedJobs[0]);
    expect(result.success).toBe(true);
  });
});
```

### Local Development Workflow

1. **Start development server** with database:

   ```bash
   make up
   ```

2. **Create your job** in `src/jobs/`

3. **Test immediately** using `.now()` in a script or API route

4. **Check logs** for progress updates

5. **Inspect database** to verify persistence

## Deployment

### Cloudflare Workers Deployment

#### Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed: `npm install -g wrangler`
- Turso database (or compatible LibSQL) set up

#### 1. Configure Database

Set up your Turso database and get credentials:

```bash
# Create database
turso db create tetrastack-production

# Get connection string
turso db show tetrastack-production --url

# Create auth token
turso db tokens create tetrastack-production
```

#### 2. Set Environment Variables

Add to `wrangler.toml`:

```toml
[vars]
TURSO_DATABASE_URL = "libsql://your-database.turso.io"

# Secrets (set via CLI - never commit these)
# Run: wrangler secret put TURSO_AUTH_TOKEN
# Run: wrangler secret put AUTH_SECRET
```

Set secrets:

```bash
# Database authentication
wrangler secret put TURSO_AUTH_TOKEN
# Paste your Turso token when prompted

# Other required secrets
wrangler secret put AUTH_SECRET
wrangler secret put OPENAI_API_KEY  # If using AI features
```

#### 3. Configure Cron Triggers

Add job processing schedule to `wrangler.toml`:

```toml
[triggers]
crons = ["* * * * *"]  # Run every minute
```

For production, consider less frequent polling:

```toml
[triggers]
crons = ["*/5 * * * *"]  # Every 5 minutes
```

#### 4. Create Worker Entry Point

Create `worker/jobs.ts` for your job worker:

```typescript
import { createCronHandler } from '@tetrastack/server-jobs/cloudflare';
import { createJobRegistry } from '@tetrastack/server-jobs';
import { createDatabaseClient } from '@/database';
import { GenerateProjectIdeasJob } from '@/jobs/generate-project-ideas';
import { SendEmailJob } from '@/jobs/send-email';

// Register all your jobs
const registry = createJobRegistry()
  .register(GenerateProjectIdeasJob)
  .register(SendEmailJob);

// Create and export the scheduled handler
export default createCronHandler({
  database: createDatabaseClient(),
  jobRegistry: registry,
  maxConcurrency: 10, // Adjust based on Worker limits
  lockTimeoutMs: 5 * 60 * 1000, // 5 minutes
});
```

#### 5. Deploy

Deploy your worker to Cloudflare:

```bash
# Preview deployment
npm run preview

# Deploy to production
npm run deploy
```

#### 6. Verify Deployment

Check that jobs are being processed:

```bash
# View worker logs
wrangler tail

# Check database for job executions
turso db shell tetrastack-production "SELECT jobName, status, COUNT(*) FROM jobs GROUP BY jobName, status;"
```

### Monitoring & Debugging

#### View Logs

```bash
# Real-time logs
wrangler tail

# Filter by job name
wrangler tail --search "TestJob"
```

#### Check Job Status

Query the database to monitor job execution:

```sql
-- Recent jobs
SELECT
  jobName,
  status,
  progress,
  createdAt,
  completedAt,
  error
FROM jobs
ORDER BY createdAt DESC
LIMIT 20;

-- Job statistics
SELECT
  jobName,
  status,
  COUNT(*) as count,
  AVG(CAST((julianday(completedAt) - julianday(createdAt)) * 86400000 AS INTEGER)) as avg_duration_ms
FROM jobs
WHERE completedAt IS NOT NULL
GROUP BY jobName, status;

-- Failed jobs
SELECT * FROM jobs
WHERE status = 'failed'
ORDER BY createdAt DESC
LIMIT 10;
```

#### Troubleshooting

**Jobs not processing:**

- Check cron trigger is configured in `wrangler.toml`
- Verify worker is deployed: `wrangler deployments list`
- Check worker logs: `wrangler tail`
- Ensure jobs are registered in the worker's registry

**Jobs timing out:**

- Increase `lockTimeoutMs` in worker configuration
- Reduce job workload or split into smaller jobs
- Check Cloudflare Worker CPU time limits

**Database connection issues:**

- Verify `TURSO_AUTH_TOKEN` secret is set
- Check `TURSO_DATABASE_URL` is correct
- Ensure database is accessible from Cloudflare Workers

### Production Best Practices

1. **Set appropriate cron frequency**: Don't poll too frequently if jobs are infrequent

   ```toml
   # Low volume: every 5 minutes
   crons = ["*/5 * * * *"]

   # High volume: every minute
   crons = ["* * * * *"]
   ```

2. **Configure worker limits**: Adjust based on your workload

   ```typescript
   createCronHandler({
     maxConcurrency: 5, // Process up to 5 jobs per cron trigger
     lockTimeoutMs: 5 * 60 * 1000, // 5 minute timeout
   });
   ```

3. **Monitor job health**: Set up alerts for failed jobs

   ```sql
   -- Check for high failure rate
   SELECT
     COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*) as failure_rate
   FROM jobs
   WHERE createdAt > datetime('now', '-1 hour');
   ```

4. **Use correlation IDs**: Track related jobs

   ```typescript
   await MyJob.later({
     data: 'test',
     correlationId: requestId, // Track through logs
   });
   ```

5. **Implement retry logic**: Configure max attempts per job type
   ```typescript
   // In job record insertion
   {
     maxAttempts: 3,  // Will retry up to 3 times
   }
   ```

## Architecture

See [spec.md](./spec.md) for detailed specification and [plan.md](./plan.md) for implementation details.

## License

MIT
