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

## Architecture

See [spec.md](./spec.md) for detailed specification and [plan.md](./plan.md) for implementation details.

## License

MIT
