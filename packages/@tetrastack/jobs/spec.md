# @tetrastack/server-jobs Specification

## Overview

A background job processing framework with database persistence and pluggable worker backends. Designed for Cloudflare Workers with Cron Triggers, extensible to future backends like Kubernetes Jobs.

## Purpose

Provide infrastructure for:

- Defining background jobs with type-safe schemas
- Persisting job state to database
- Executing jobs via pluggable worker backends
- Tracking progress and handling retries
- Scheduling recurring jobs via cron

---

## Core Abstractions

### 1. Job

A background work unit with validated input and output.

**Properties:**

- `name` - Unique identifier for the job type
- `paramsSchema` - Zod schema for input parameters
- `resultSchema` - Zod schema for output result
- `handler` - Async function that performs the work

**Static Methods:**

- `now(params, options?)` - Execute immediately, optionally persist
- `later(params)` - Queue for later execution, returns job ID
- `batch(paramsList, options?)` - Execute multiple jobs with concurrency control
- `executeFromDatabase(jobId, options?)` - Execute a queued job (called by workers)

**Behavior:**

- Parameters validated before storage/execution
- Results validated before storage
- Progress can be updated during execution
- Errors are caught and stored

### 2. JobContext

Runtime context passed to job handler.

**Properties:**

- `jobId` - Database job ID (undefined if not persisted)

**Methods:**

- `updateProgress(percent: number, message?: string)` - Update progress (0-100)
- `getDatabase()` - Access database client
- `log.info(message, data?)` - Log informational message
- `log.warn(message, data?)` - Log warning
- `log.error(message, data?)` - Log error

**Progress Behavior:**

- Only works for persisted jobs
- Updates database with progress percentage and message
- Silently skips for non-persisted jobs

### 3. JobRegistry

Registry of job types for worker dispatch.

**Methods:**

- `register(jobClass)` - Register a job type
- `get(jobName)` - Get job class by name
- `has(jobName)` - Check if job type is registered
- `getNames()` - List all registered job names

**Behavior:**

- Throws if registering duplicate name
- Returns undefined for unknown job names

### 4. JobResult

Result wrapper from job execution.

**Properties:**

- `data` - Output data (validated against resultSchema)
- `metadata` - Job metadata (id, status, timing, attempts)

### 5. JobMetadata

Metadata about job execution.

**Properties:**

- `jobId` - Database ID
- `jobName` - Job type name
- `enqueuedAt` - When job was created
- `startedAt` - When execution started
- `completedAt` - When execution finished
- `status` - Current status
- `attemptCount` - Number of execution attempts
- `error` - Error message if failed

---

## WorkerBackend Interface

Pluggable abstraction for job execution infrastructure.

### Properties

- `name` - Backend identifier (e.g., "cloudflare", "kubernetes")
- `config` - Backend configuration

### Methods

**Lifecycle:**

- `initialize()` - Setup connections, verify configuration
- `shutdown()` - Graceful cleanup, release resources

**Job Processing:**

- `pollAndClaim(limit?)` - Atomically claim pending jobs
- `execute(job)` - Run a claimed job
- `releaseLock(jobId)` - Release job without executing

**Maintenance:**

- `handleExpiredLocks()` - Reset jobs with expired worker locks
- `healthCheck()` - Verify backend is operational

### PollResult

Returned from `pollAndClaim()`.

**Properties:**

- `claimedJobs` - Array of JobRecord objects claimed by this worker
- `availableCount` - Number of pending jobs not claimed (for scaling)

### WorkerExecutionResult

Returned from `execute()`.

**Properties:**

- `jobId` - ID of executed job
- `success` - Whether execution succeeded
- `duration` - Execution time in milliseconds
- `error` - Error message if failed

---

## CloudflareWorkerBackend

Cloudflare-specific WorkerBackend implementation.

### Behavior

- Stateless per invocation (designed for Cron Triggers)
- Uses SQL UPDATE...RETURNING for atomic job claiming
- Worker lock timeout prevents stuck jobs
- Handles multiple jobs per cron trigger invocation

### Configuration

- `database` - Database client factory
- `jobRegistry` - Registry of job types
- `maxConcurrency` - Max jobs per invocation (default: 5)
- `lockTimeoutMs` - Worker lock duration (default: 5 minutes)

### Cron Handler

Entry point for Cloudflare scheduled events.

**Method:** `handleCron(event: ScheduledEvent)`

**Behavior:**

1. Handle expired locks (reset stale jobs)
2. Poll and claim available jobs
3. Execute claimed jobs concurrently
4. Log results for monitoring

### Wrangler Configuration

Cron triggers are defined in wrangler.toml:

```toml
[triggers]
crons = ["* * * * *"]
```

---

## InMemoryBackend

Testing backend that executes jobs synchronously without database.

### Behavior

- Stores jobs in memory (Map)
- Synchronous execution
- No distributed locking
- Resets on process restart

### Use Cases

- Unit tests
- Integration tests
- Local development without database

---

## Database Schema

### jobs Table

| Column          | Type          | Description                         |
| --------------- | ------------- | ----------------------------------- |
| id              | TEXT (UUIDv7) | Primary key                         |
| jobName         | TEXT          | Job type identifier                 |
| params          | JSON          | Input parameters                    |
| result          | JSON          | Output result                       |
| status          | TEXT          | pending, running, completed, failed |
| progress        | INTEGER       | 0-100                               |
| progressMessage | TEXT          | Current step description            |
| error           | TEXT          | Error message if failed             |
| workerStartedAt | TIMESTAMP     | When worker claimed job             |
| workerExpiresAt | TIMESTAMP     | When lock expires                   |
| attemptCount    | INTEGER       | Retry count                         |
| maxAttempts     | INTEGER       | Maximum attempts (default 3)        |
| scheduledFor    | TIMESTAMP     | Deferred execution time             |
| correlationId   | TEXT          | Tracing ID                          |
| createdAt       | TIMESTAMP     | Creation time                       |
| updatedAt       | TIMESTAMP     | Last update time                    |
| completedAt     | TIMESTAMP     | Completion time                     |

**Indexes:**

- `jobs_status_scheduled_idx` on (status, scheduledFor)
- `jobs_status_expires_idx` on (status, workerExpiresAt)
- `jobs_name_idx` on (jobName)
- `jobs_correlation_idx` on (correlationId)

**Constraints:**

- progress must be 0-100

### cronJobs Table

| Column         | Type          | Description                           |
| -------------- | ------------- | ------------------------------------- |
| id             | TEXT (UUIDv7) | Primary key                           |
| jobName        | TEXT          | Job type to execute                   |
| cronExpression | TEXT          | Cron schedule (e.g., "0 \* \* \* \*") |
| params         | JSON          | Default parameters                    |
| enabled        | BOOLEAN       | Whether schedule is active            |
| lastRunAt      | TIMESTAMP     | Last execution time                   |
| nextRunAt      | TIMESTAMP     | Next scheduled time                   |
| lastJobId      | TEXT          | ID of last created job                |
| createdAt      | TIMESTAMP     | Creation time                         |
| updatedAt      | TIMESTAMP     | Last update time                      |

**Indexes:**

- `cron_jobs_next_run_idx` on (enabled, nextRunAt)
- `cron_jobs_name_idx` on (jobName)

---

## Job Lifecycle

### Status Transitions

```
[created] → pending → running → completed
                  ↓         ↓
                  └─────→ failed
```

### State Descriptions

- **pending** - Queued, waiting for worker
- **running** - Claimed by worker, executing
- **completed** - Successfully finished
- **failed** - Execution failed (may retry)

### Worker Locking

1. Worker claims job: sets `status=running`, `workerStartedAt`, `workerExpiresAt`
2. If worker completes: sets `status=completed/failed`, `completedAt`
3. If worker dies: lock expires, another worker can reclaim
4. Expired locks are reset to `pending` by maintenance routine

---

## Execution Patterns

### Immediate Execution (.now)

Execute job synchronously with optional persistence.

**Options:**

- `persist` - Save to database (default: true)
- `workerTimeoutMs` - Lock timeout if persisted

**Behavior:**

- Validate params
- If persist: create job record, execute, update record
- If not persist: execute directly, return result

### Deferred Execution (.later)

Queue job for later worker execution.

**Behavior:**

- Validate params
- Create job record with status=pending
- Return job ID immediately

### Batch Execution (.batch)

Execute multiple jobs with concurrency control.

**Options:**

- `concurrency` - Max parallel jobs (default: 3)
- `persist` - Save to database (default: true)
- `stopOnError` - Abort on first failure (default: false)

**Behavior:**

- Process jobs in batches of `concurrency` size
- Collect all results
- Return array of JobResult objects

### Worker Execution (.executeFromDatabase)

Execute a specific queued job.

**Behavior:**

- Claim job with worker lock
- Increment attemptCount
- Execute handler
- Update job with result or error
- Release lock on completion

---

## Package Structure

```
packages/tetrastack-server-jobs/
├── package.json
├── tsconfig.json
├── spec.md
├── index.ts
├── src/
│   ├── core/
│   │   ├── job.ts           # Job class and defineJob
│   │   ├── registry.ts      # JobRegistry
│   │   ├── context.ts       # JobContext
│   │   └── types.ts         # Shared types
│   ├── schema/
│   │   ├── jobs.ts          # jobs table
│   │   ├── cron-jobs.ts     # cronJobs table
│   │   └── index.ts         # Schema exports
│   └── backends/
│       ├── interface.ts     # WorkerBackend interface
│       ├── base.ts          # BaseWorkerBackend abstract class
│       ├── cloudflare/
│       │   ├── backend.ts   # CloudflareWorkerBackend
│       │   ├── handler.ts   # Cron handler factory
│       │   └── index.ts
│       └── memory/
│           ├── backend.ts   # InMemoryBackend
│           └── index.ts
└── tests/
```

---

## Exports

### Main Entry (`@tetrastack/server-jobs`)

- `defineJob` - Factory to create job classes
- `createJobRegistry` - Factory for job registry
- `createJobContext` - Context factory (for testing)
- Types: `Job`, `JobContext`, `JobResult`, `JobMetadata`, `JobStatus`

### Schema (`@tetrastack/server-jobs/schema`)

- `jobs` - Drizzle table definition
- `cronJobs` - Drizzle table definition
- `JOB_STATUS` - Status enum object
- Types: `InsertJob`, `SelectJob`, `InsertCronJob`, `SelectCronJob`

### Cloudflare (`@tetrastack/server-jobs/cloudflare`)

- `CloudflareWorkerBackend` - Backend implementation
- `createCronHandler` - Factory for scheduled handler

### Memory (`@tetrastack/server-jobs/memory`)

- `InMemoryBackend` - Testing backend

### Backend Interface (`@tetrastack/server-jobs/backend`)

- `WorkerBackend` - Interface type
- `BaseWorkerBackend` - Abstract base class
- Types: `WorkerBackendConfig`, `PollResult`, `WorkerExecutionResult`

---

## Dependencies

### Runtime

- `zod` ^4.0.0 - Schema validation
- `uuid` ^13.0.0 - UUIDv7 generation

### Peer

- `drizzle-orm` >=0.44.0 - ORM for database operations

### Dev

- `@cloudflare/workers-types` - Cloudflare type definitions
- `typescript` ^5.0.0
- `vitest` ^3.0.0

---

## Future: Kubernetes Backend

The WorkerBackend interface supports future Kubernetes implementation:

### KubernetesBackend Concept

- Poll database for pending jobs
- Create Kubernetes Job resources
- Job pod executes handler in container
- Controller monitors completion
- Update database on job finish

### Configuration (Future)

- `namespace` - Kubernetes namespace
- `jobImage` - Container image for execution
- `resources` - CPU/memory limits
- `serviceAccount` - K8s service account

This backend would be added as `@tetrastack/server-jobs/kubernetes`.
