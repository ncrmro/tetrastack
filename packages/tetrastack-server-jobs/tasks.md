# @tetrastack/server-jobs Implementation Tasks

## Prerequisites

- [ ] **PREREQ-1**: Add npm workspaces to root package.json
  - Add `"workspaces": ["packages/*"]` to root package.json
  - Run `npm install` to initialize workspace

---

## Phase 1: Package Setup

- [ ] **SETUP-1**: Create package.json
  - Name: `@tetrastack/server-jobs`
  - Version: `0.1.0`
  - Type: `module`
  - Main: `index.ts`
  - Exports for main and subpaths (schema, cloudflare, memory, backend)
  - Dependencies: zod, uuid
  - PeerDependencies: drizzle-orm
  - DevDependencies: typescript, vitest, @types/node, @cloudflare/workers-types, better-sqlite3

- [ ] **SETUP-2**: Create tsconfig.json
  - ESNext target and module
  - Bundler module resolution
  - Strict mode enabled
  - Include @cloudflare/workers-types
  - Path alias: `@/*` → `./src/*`
  - Include src, index.ts, tests

- [ ] **SETUP-3**: Create directory structure
  ```
  src/
    core/
    schema/
    backends/
      cloudflare/
      memory/
  tests/
  index.ts
  ```

---

## Phase 2: Core Types

- [ ] **TYPES-1**: Create src/core/types.ts
  - Define `JobStatus` type: 'pending' | 'running' | 'completed' | 'failed'
  - Define `JOB_STATUS` constant object
  - Define `JobConfig<TParams, TResult>` interface
  - Define `JobResult<T>` interface
  - Define `JobMetadata` interface
  - Define `JobContext` interface
  - Define `JobExecutionOptions` interface
  - Define `BatchExecutionOptions` interface
  - Define `JobRecord` type (database row)
  - Export all types

---

## Phase 3: Database Schema

- [ ] **SCHEMA-1**: Create src/schema/jobs.ts
  - Import from drizzle-orm/sqlite-core
  - Define `jobs` table with all columns:
    - id (TEXT, UUIDv7 default)
    - jobName (TEXT, not null)
    - params (JSON)
    - result (JSON)
    - status (TEXT, enum, default 'pending')
    - progress (INTEGER, default 0)
    - progressMessage (TEXT)
    - error (TEXT)
    - workerStartedAt (TIMESTAMP)
    - workerExpiresAt (TIMESTAMP)
    - attemptCount (INTEGER, default 0)
    - maxAttempts (INTEGER, default 3)
    - scheduledFor (TIMESTAMP)
    - correlationId (TEXT)
    - createdAt, updatedAt, completedAt (TIMESTAMP)
  - Add indexes:
    - jobs_status_scheduled_idx
    - jobs_status_expires_idx
    - jobs_name_idx
    - jobs_correlation_idx
  - Add check constraint for progress 0-100
  - Export table and inferred types

- [ ] **SCHEMA-2**: Create src/schema/cron-jobs.ts
  - Define `cronJobs` table with all columns:
    - id (TEXT, UUIDv7 default)
    - jobName (TEXT, not null)
    - cronExpression (TEXT, not null)
    - params (JSON)
    - enabled (BOOLEAN, default true)
    - lastRunAt, nextRunAt (TIMESTAMP)
    - lastJobId (TEXT)
    - createdAt, updatedAt (TIMESTAMP)
  - Add indexes:
    - cron_jobs_next_run_idx
    - cron_jobs_name_idx
  - Export table and inferred types

- [ ] **SCHEMA-3**: Create src/schema/index.ts
  - Re-export jobs table from ./jobs
  - Re-export cronJobs table from ./cron-jobs
  - Re-export JOB_STATUS from ./jobs
  - Export all inferred types

---

## Phase 4: Job Context

- [ ] **CTX-1**: Create src/core/context.ts
  - Define createJobContext options interface
  - Implement `createJobContext(options)` factory
  - Options: jobId, database, persist flag
  - Implement `updateProgress(percent, message?)`:
    - Skip if not persisted (no jobId)
    - Clamp percent to 0-100
    - Update database with progress and message
  - Implement `getDatabase()` - return database client
  - Implement `log` object:
    - `info(message, data?)` - console.log with prefix
    - `warn(message, data?)` - console.warn with prefix
    - `error(message, data?)` - console.error with prefix
  - Export `createJobContext`

---

## Phase 5: Job Registry

- [ ] **REG-1**: Create src/core/registry.ts
  - Define JobRegistry interface
  - Implement `createJobRegistry()` factory
  - Internal: `Map<string, JobClass>`
  - Implement `register(jobClass)`:
    - Get name from jobClass.name (static property)
    - Throw if already registered
    - Add to map
    - Return this for chaining
  - Implement `get(name)` - return jobClass or undefined
  - Implement `has(name)` - boolean check
  - Implement `getNames()` - Array.from(map.keys())
  - Export `createJobRegistry` and `JobRegistry` type

---

## Phase 6: Job Implementation

- [ ] **JOB-1**: Create src/core/job.ts
  - Import types, context, schema
  - Define abstract Job class with static method signatures
  - Implement `defineJob(config)` factory:
    - Validate config (name, schemas, handler)
    - Create class extending Job
    - Attach paramsSchema, resultSchema as static
    - Store handler reference
    - Return class

- [ ] **JOB-2**: Implement Job.now()
  - Accept params and options
  - Validate params against paramsSchema
  - If persist (default true):
    - Insert job record with status=pending
    - Get jobId
  - Create JobContext
  - Record startTime
  - Try:
    - Execute handler(params, context)
    - Validate result against resultSchema
    - If persist: update job with result, status=completed
    - Return JobResult with data and metadata
  - Catch:
    - If persist: update job with error, status=failed
    - Return JobResult with error

- [ ] **JOB-3**: Implement Job.later()
  - Accept params
  - Validate params against paramsSchema
  - Insert job record with status=pending
  - Return jobId

- [ ] **JOB-4**: Implement Job.batch()
  - Accept paramsList and options
  - Default concurrency=3, persist=true, stopOnError=false
  - Process in chunks of concurrency size
  - For each chunk: Promise.all(chunk.map(p => this.now(p, options)))
  - If stopOnError and any fails, stop and return
  - Collect all results
  - Return array of JobResult

- [ ] **JOB-5**: Implement Job.executeFromDatabase()
  - Accept jobId and options
  - Fetch job record from database
  - Claim job (update status=running, set worker timestamps, increment attemptCount)
  - Validate params from database
  - Create JobContext with jobId
  - Execute handler
  - Validate result
  - Update job with result and status=completed
  - Return JobResult
  - On error: update job with error, status=failed

---

## Phase 7: Backend Interface

- [ ] **BACK-1**: Create src/backends/interface.ts
  - Define `WorkerBackendConfig` interface:
    - database (factory or instance)
    - jobRegistry
    - maxConcurrency (default 5)
    - lockTimeoutMs (default 300000)
    - pollIntervalMs (default 1000)
  - Define `PollResult` interface
  - Define `WorkerExecutionResult` interface
  - Define `WorkerBackend` interface with all methods
  - Export all types

- [ ] **BACK-2**: Create src/backends/base.ts
  - Import interface, types, schema
  - Implement abstract `BaseWorkerBackend`:
    - Constructor stores config with defaults
    - Abstract: initialize(), pollAndClaim(), shutdown()
    - Implement execute(job):
      - Get JobClass from registry
      - Call JobClass.executeFromDatabase(job.id)
      - Return WorkerExecutionResult
    - Implement releaseLock(jobId):
      - Update job: status=pending, clear worker timestamps
    - Implement handleExpiredLocks():
      - Update jobs where status=running AND workerExpiresAt < now
      - Set status=pending, clear worker timestamps
      - Return count
    - Implement healthCheck():
      - Try simple select from jobs
      - Return { healthy: true/false, message? }
  - Export `BaseWorkerBackend`

---

## Phase 8: Cloudflare Backend

- [ ] **CF-1**: Create src/backends/cloudflare/backend.ts
  - Import BaseWorkerBackend, types
  - Define `CloudflareBackendConfig` extending base config
  - Implement `CloudflareWorkerBackend`:
    - Extend BaseWorkerBackend
    - name = 'cloudflare'
    - initialize(): call healthCheck(), throw if unhealthy
    - shutdown(): no-op (stateless)
    - pollAndClaim(limit?):
      - Use UPDATE...RETURNING for atomic claim
      - Set status=running, worker timestamps, increment attempts
      - WHERE status=pending AND (scheduledFor IS NULL OR scheduledFor <= now)
      - LIMIT to limit or maxConcurrency
      - Count remaining pending jobs
      - Return { claimedJobs, availableCount }
    - handleCron(event):
      - Log cron trigger
      - Call handleExpiredLocks()
      - Call pollAndClaim()
      - Execute all claimed jobs concurrently
      - Log results summary
  - Export `CloudflareWorkerBackend`

- [ ] **CF-2**: Create src/backends/cloudflare/handler.ts
  - Define `CronHandlerConfig` interface
  - Implement `createCronHandler(config)`:
    - Returns object with `scheduled(event, env, ctx)` method
    - Create database from env
    - Create CloudflareWorkerBackend
    - Call initialize()
    - Call ctx.waitUntil(backend.handleCron(event))
  - Export `createCronHandler`

- [ ] **CF-3**: Create src/backends/cloudflare/index.ts
  - Re-export CloudflareWorkerBackend from ./backend
  - Re-export createCronHandler from ./handler
  - Re-export CloudflareBackendConfig type

---

## Phase 9: Memory Backend

- [ ] **MEM-1**: Create src/backends/memory/backend.ts
  - Import BaseWorkerBackend, types
  - Implement `InMemoryBackend`:
    - Extend BaseWorkerBackend
    - name = 'memory'
    - Private: jobs Map<string, JobRecord>
    - Private: idCounter for generating IDs
    - initialize(): no-op
    - shutdown(): clear jobs map
    - pollAndClaim(limit?):
      - Find pending jobs in map
      - Update status to running
      - Return claimedJobs and availableCount
    - Override execute(): run synchronously
  - Export `InMemoryBackend`

- [ ] **MEM-2**: Create src/backends/memory/index.ts
  - Re-export InMemoryBackend from ./backend

---

## Phase 10: Main Export

- [ ] **EXPORT-1**: Create index.ts
  - Export `defineJob` from ./src/core/job
  - Export `createJobRegistry` from ./src/core/registry
  - Export `createJobContext` from ./src/core/context
  - Export all types from ./src/core/types
  - Export `JOB_STATUS` from ./src/schema

---

## Phase 11: Unit Tests

- [ ] **TEST-1**: Create tests/core/types.test.ts
  - Verify type exports work correctly
  - Test JOB_STATUS values

- [ ] **TEST-2**: Create tests/schema/jobs.test.ts
  - Test jobs table definition
  - Verify column types
  - Test with in-memory SQLite

- [ ] **TEST-3**: Create tests/core/context.test.ts
  - Test createJobContext returns valid context
  - Test updateProgress with persisted job
  - Test updateProgress skips non-persisted
  - Test getDatabase returns client
  - Test log methods

- [ ] **TEST-4**: Create tests/core/registry.test.ts
  - Test createJobRegistry returns registry
  - Test register adds job
  - Test register throws on duplicate
  - Test get returns job
  - Test get returns undefined for unknown
  - Test has returns correct boolean
  - Test getNames returns all names

- [ ] **TEST-5**: Create tests/core/job.test.ts
  - Test defineJob creates valid job class
  - Test job has correct name
  - Test job has correct schemas
  - Test .now() validates params
  - Test .now() validates result
  - Test .now() with persist=false
  - Test .later() creates pending job
  - Test .batch() with concurrency
  - Test .batch() with stopOnError
  - Test execution errors are caught
  - Test progress updates during execution

- [ ] **TEST-6**: Create tests/backends/memory.test.ts
  - Test InMemoryBackend creation
  - Test pollAndClaim claims jobs
  - Test execute runs job
  - Test shutdown clears jobs

- [ ] **TEST-7**: Create tests/backends/cloudflare.test.ts
  - Test CloudflareWorkerBackend creation
  - Test pollAndClaim with mock database
  - Test handleExpiredLocks
  - Test healthCheck
  - Test handleCron flow

---

## Phase 12: Integration Tests

- [ ] **INT-1**: Create tests/integration/job-lifecycle.test.ts
  - Test full job lifecycle with SQLite
  - Create job, queue it, execute it
  - Verify status transitions
  - Verify result storage

- [ ] **INT-2**: Create tests/integration/worker-flow.test.ts
  - Test worker claiming and execution
  - Multiple jobs queued
  - Worker processes them
  - Verify all completed

---

## Phase 13: Documentation

- [ ] **DOC-1**: Create README.md
  - Package overview
  - Installation (workspace reference)
  - Quick start with defineJob
  - Backend usage (Cloudflare, Memory)
  - API reference links to spec.md
  - Link to plan.md for architecture

---

## Verification Checklist

- [ ] All tests pass: `npm test`
- [ ] Type check passes: `npm run typecheck`
- [ ] Can define a job with Zod schemas
- [ ] Job.now() executes immediately
- [ ] Job.later() queues for later
- [ ] Job.batch() handles concurrency
- [ ] CloudflareWorkerBackend claims and executes jobs
- [ ] InMemoryBackend works for testing
- [ ] Progress updates work for persisted jobs
- [ ] Worker locking prevents double execution
- [ ] Expired locks are reset
