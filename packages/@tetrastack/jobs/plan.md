# @tetrastack/server-jobs Implementation Plan

## Overview

This document outlines the implementation approach for the server-jobs package, a background job processing framework with pluggable worker backends.

---

## Design Decisions

### 1. Job Definition Pattern

**Decision:** Factory function `defineJob()` returning class with static methods

**Rationale:**

- Preserves existing fluent API (`.now()`, `.later()`, `.batch()`)
- Static methods avoid instantiation ceremony
- Class enables instanceof checks for registry
- Matches existing `src/lib/jobs/index.ts` pattern

### 2. Backend Abstraction

**Decision:** Interface + abstract base class pattern

**Rationale:**

- Interface defines contract for any backend
- BaseWorkerBackend provides common implementation (execute, lock handling)
- Concrete backends extend base and implement specifics
- Clean separation enables future backends

### 3. Database Access Pattern

**Decision:** Inject database via factory/config, not global

**Rationale:**

- Enables testing with different database instances
- Supports Cloudflare Workers environment bindings
- No global state
- Explicit dependencies

### 4. Schema Location

**Decision:** Schema lives in this package, exported separately

**Rationale:**

- Jobs and cronJobs tables are package-specific
- Main app can import and include in migrations
- Clear ownership of schema
- Subpath export keeps main entry clean

### 5. Cloudflare Integration

**Decision:** Cron Triggers with database polling (not Queues)

**Rationale:**

- User specified Cloudflare Cron Triggers
- Simpler than Queues for existing database-backed design
- Works with Turso/LibSQL
- One cron trigger handles all job types

---

## Architecture

### Module Dependency Graph

```
index.ts
    ├── core/job.ts (defineJob, Job class)
    │       ├── core/types.ts
    │       └── core/context.ts
    ├── core/registry.ts (createJobRegistry)
    └── core/types.ts (all type exports)

schema/index.ts
    ├── schema/jobs.ts
    └── schema/cron-jobs.ts

backends/interface.ts (WorkerBackend interface)

backends/base.ts (BaseWorkerBackend)
    └── backends/interface.ts

backends/cloudflare/index.ts
    ├── backends/cloudflare/backend.ts
    │       └── backends/base.ts
    └── backends/cloudflare/handler.ts
            └── backends/cloudflare/backend.ts

backends/memory/index.ts
    └── backends/memory/backend.ts
            └── backends/base.ts
```

### Data Flow: Immediate Execution (.now)

1. User calls `MyJob.now(params)`
2. Validate params against paramsSchema
3. If persist: insert job record with status=pending
4. Create JobContext with jobId
5. Execute handler(params, context)
6. Validate result against resultSchema
7. If persist: update job record with result, status=completed
8. Return JobResult with data and metadata

### Data Flow: Worker Execution

1. Cron trigger fires
2. CloudflareWorkerBackend.handleCron() called
3. handleExpiredLocks() resets stale jobs
4. pollAndClaim() atomically claims jobs
5. For each claimed job:
   - Get job class from registry
   - Call Job.executeFromDatabase(jobId)
   - Job updates its own status
6. Log results

---

## Key Implementation Details

### Job Class Structure

```
Job<TParams, TResult>
├── Static: name, paramsSchema, resultSchema
├── Static: now(params, options?) → JobResult
├── Static: later(params) → jobId
├── Static: batch(paramsList, options?) → JobResult[]
├── Static: executeFromDatabase(jobId, options?) → JobResult
└── Instance: handler(params, context) → result
```

The `defineJob()` factory creates a class extending Job with:

- Provided schemas attached as static properties
- Handler stored and called during execution

### Atomic Job Claiming

Use SQL UPDATE...RETURNING for atomic claim:

```sql
UPDATE jobs
SET status = 'running',
    worker_started_at = NOW(),
    worker_expires_at = NOW() + interval,
    attempt_count = attempt_count + 1
WHERE status = 'pending'
  AND (scheduled_for IS NULL OR scheduled_for <= NOW())
LIMIT n
RETURNING *
```

This atomically:

- Finds pending jobs
- Claims them with lock
- Returns claimed rows

### Progress Updates

JobContext.updateProgress() updates database:

```sql
UPDATE jobs
SET progress = ?,
    progress_message = ?,
    updated_at = NOW()
WHERE id = ?
```

Only executes if jobId is set (persisted job).

### Lock Expiration Handling

Periodic check for expired locks:

```sql
UPDATE jobs
SET status = 'pending',
    worker_started_at = NULL,
    worker_expires_at = NULL
WHERE status = 'running'
  AND worker_expires_at < NOW()
```

Returns count of reset jobs for monitoring.

---

## File Implementations

### core/types.ts

Define all TypeScript types:

- `JobConfig<TParams, TResult>` - Configuration for defineJob
- `JobResult<T>` - Execution result wrapper
- `JobMetadata` - Job metadata
- `JobContext` - Runtime context interface
- `JobStatus` - Status union type
- `JobExecutionOptions` - Options for .now()
- `BatchExecutionOptions` - Options for .batch()

### core/context.ts

Implement JobContext:

- `createJobContext(options)` factory
- Options: jobId, database, persist flag
- `updateProgress()` - database update if persisted
- `getDatabase()` - return database client
- `log` object with info/warn/error methods

### core/job.ts

Implement Job base class and defineJob:

- Abstract Job class with static method signatures
- `defineJob(config)` factory returning concrete class
- Implement `.now()` - immediate execution
- Implement `.later()` - queue for later
- Implement `.batch()` - concurrent execution
- Implement `.executeFromDatabase()` - worker execution
- Validation at each entry point

### core/registry.ts

Implement JobRegistry:

- `createJobRegistry()` factory
- Internal Map<string, JobClass>
- `register(jobClass)` - add to registry, chainable
- `get(name)` - lookup by name
- `has(name)` - check existence
- `getNames()` - list all names

### schema/jobs.ts

Drizzle schema for jobs table:

- All columns from spec
- Indexes for querying
- Check constraint for progress
- UUIDv7 default for id

### schema/cron-jobs.ts

Drizzle schema for cronJobs table:

- All columns from spec
- Indexes for scheduling queries

### schema/index.ts

Export schemas:

- Re-export jobs, cronJobs tables
- Export JOB_STATUS constant
- Export inferred types (InsertJob, SelectJob, etc.)

### backends/interface.ts

Define WorkerBackend interface:

- All method signatures from spec
- WorkerBackendConfig type
- PollResult type
- WorkerExecutionResult type

### backends/base.ts

Implement BaseWorkerBackend:

- Abstract class implementing WorkerBackend
- Constructor accepts config
- Implement common methods: execute, releaseLock, handleExpiredLocks, healthCheck
- Abstract methods: initialize, pollAndClaim, shutdown

### backends/cloudflare/backend.ts

Implement CloudflareWorkerBackend:

- Extend BaseWorkerBackend
- Implement initialize() - verify database
- Implement pollAndClaim() - atomic SQL claim
- Implement shutdown() - no-op for stateless
- Implement handleCron() - main entry point

### backends/cloudflare/handler.ts

Implement cron handler factory:

- `createCronHandler(config)` function
- Returns object with `scheduled` method
- Wires up database, registry, backend

### backends/memory/backend.ts

Implement InMemoryBackend:

- Extend BaseWorkerBackend
- Use Map for job storage
- Synchronous execution
- No actual locking (single-threaded)

### index.ts

Export public API:

- `defineJob` from core/job
- `createJobRegistry` from core/registry
- `createJobContext` from core/context
- All types from core/types

---

## Testing Strategy

### Unit Tests

**core/job.test.ts:**

- defineJob creates valid job class
- .now() validates params
- .now() validates result
- .now() with persist=false skips database
- .later() creates pending job
- .batch() respects concurrency
- .batch() with stopOnError works
- Execution errors are caught

**core/registry.test.ts:**

- createJobRegistry returns registry
- register adds job
- register throws on duplicate
- get returns job
- get returns undefined for unknown
- getNames lists all

**core/context.test.ts:**

- updateProgress updates database
- updateProgress skips if not persisted
- getDatabase returns client
- log methods work

**schema/jobs.test.ts:**

- Schema validates correct data
- Indexes are defined
- Check constraint on progress

**backends/cloudflare.test.ts:**

- pollAndClaim claims jobs atomically
- handleCron processes jobs
- handleExpiredLocks resets stale jobs
- healthCheck verifies database

**backends/memory.test.ts:**

- Jobs execute synchronously
- No persistence across instances

### Integration Tests

- End-to-end job execution with real database
- Worker claiming and execution flow
- Progress updates during execution
- Error handling and status updates

---

## Migration from src/lib/jobs

### Compatibility Layer

After package is complete, update `src/lib/jobs/index.ts`:

```typescript
export * from '@tetrastack/server-jobs';
```

This allows gradual migration of imports.

### Schema Migration

1. Keep existing tables (same structure)
2. Update `src/database/schema.ts` to import from package
3. No data migration needed (compatible schema)

### Job Migration

Update GenerateProjectIdeasJob:

- Change import path
- Same API, should work unchanged

---

## Package Configuration

### package.json

```json
{
  "name": "@tetrastack/server-jobs",
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./schema": "./src/schema/index.ts",
    "./cloudflare": "./src/backends/cloudflare/index.ts",
    "./memory": "./src/backends/memory/index.ts",
    "./backend": "./src/backends/interface.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^4.0.0",
    "uuid": "^13.0.0"
  },
  "peerDependencies": {
    "drizzle-orm": ">=0.44.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^3.0.0",
    "@types/node": "^20.0.0",
    "@cloudflare/workers-types": "^4.0.0",
    "drizzle-orm": "^0.44.0",
    "better-sqlite3": "^11.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    "types": ["@cloudflare/workers-types"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "index.ts", "tests"],
  "exclude": ["node_modules"]
}
```

---

## Risks and Mitigations

### Risk: Database Compatibility

**Mitigation:** Test with SQLite (local) and LibSQL (Turso). Both use same SQL dialect.

### Risk: Cloudflare Worker Limits

**Mitigation:**

- Limit jobs per cron invocation
- Use `ctx.waitUntil()` for background work
- Keep individual jobs under CPU limit

### Risk: Race Conditions in Claiming

**Mitigation:**

- Use UPDATE...RETURNING for atomic claims
- Database handles concurrency
- Test with concurrent workers

### Risk: Lock Expiration Edge Cases

**Mitigation:**

- Conservative default timeout (5 min)
- Always handle expired locks before polling
- Log lock expirations for monitoring

---

## Success Metrics

1. All existing job functionality preserved
2. Jobs can be defined with Zod schemas
3. CloudflareWorkerBackend executes jobs via cron
4. InMemoryBackend enables unit testing
5. Type-safe throughout
6. Comprehensive test coverage (>90%)
7. Clean migration path from src/lib/jobs
