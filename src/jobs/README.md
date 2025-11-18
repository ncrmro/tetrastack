# Jobs System

A fluent pattern-based job system for background task execution.

## Overview

The jobs system provides a simple, type-safe way to create and execute background jobs with support for immediate execution, queuing, and batch processing.

## Quick Start

Generate project ideas with zero configuration:

```bash
# Uses admin user (ID: 1) and first team from database (typically Engineering)
bin/generate-projects

# Customize the theme
bin/generate-projects --theme="AI and ML projects" --count=5
```

All scripts default to using the admin user and first team from the seeded database fixtures, making it easy to test and use without manual setup.

## Core Concepts

### Job Class

All jobs extend the base `Job` class from `src/lib/jobs.ts`:

```typescript
import { Job } from '@/lib/jobs';

class MyJob extends Job<MyParams, MyResult> {
  protected async perform(params: MyParams): Promise<MyResult> {
    // Job logic here
    return result;
  }
}
```

### Fluent API

Jobs support three execution modes:

#### 1. Immediate Execution (`.now()`)

Execute a job immediately and wait for the result:

```typescript
const result = await MyJob.now({
  param1: 'value',
});

console.log(result.data); // Job result
console.log(result.metadata); // Job metadata (status, timing, etc.)
```

#### 2. Deferred Execution (`.later()`)

Queue a job for background execution (non-blocking):

```typescript
await MyJob.later({
  param1: 'value',
});

// Job is queued and will execute in background
// Function returns immediately
```

#### 3. Batch Execution (`.batch()`)

Execute multiple jobs with concurrency control:

```typescript
const results = await MyJob.batch(
  [{ param1: 'value1' }, { param1: 'value2' }, { param1: 'value3' }],
  {
    concurrency: 5, // Process 5 jobs at a time
    stopOnError: false, // Continue on errors
  },
);
```

## Job Metadata

Every job execution includes metadata:

```typescript
{
  jobName: string;          // Class name
  enqueuedAt: Date;         // When queued
  startedAt?: Date;         // When started
  completedAt?: Date;       // When completed
  status: JobStatus;        // 'pending' | 'running' | 'completed' | 'failed'
  error?: string;           // Error message if failed
}
```

## Example Jobs

### GenerateProjectIdeasJob

Generates project ideas using AI and saves them to the database:

```typescript
import { GenerateProjectIdeasJob } from '@/jobs/generate-project-ideas';

// Generate 10 project ideas immediately
const result = await GenerateProjectIdeasJob.now({
  teamId: 'team-123',
  theme: 'Generate web development projects focused on AI',
  count: 10,
  userId: 1,
});

console.log(`Created ${result.data.projectsCreated} projects`);
console.log(`Created ${result.data.tagsCreated} tags`);
```

### Running from Command Line

**Using the Jobs CLI** (recommended):

```bash
# Show help
bin/jobs

# List all jobs
bin/jobs list

# Show detailed job status (supports partial IDs)
bin/jobs status 019a885b

# Generate projects with parameters
bin/jobs generate-projects --param theme="AI projects" --param count=5
bin/jobs generate-projects --param teamId=team-123 --param userId=2
```

**Legacy generate-projects script** (still available):

```bash
# Use defaults (admin user + first team from database)
bin/generate-projects

# Custom theme and count
bin/generate-projects --theme="AI and ML projects" --count=5

# Specify team and user
bin/generate-projects --team-id=team-123 --user-id=2
```

### Running from Code

```typescript
// Server action example
export async function generateProjectsAction(teamId: string) {
  try {
    // Queue for background execution
    await GenerateProjectIdeasJob.later({
      teamId,
      theme: 'Generate innovative SaaS product ideas',
      count: 10,
    });

    return { success: true, message: 'Job queued' };
  } catch (error) {
    return { success: false, error: 'Failed to queue job' };
  }
}
```

## Creating New Jobs

1. Create a new file in `src/jobs/`
2. Define parameter and result types
3. Extend the `Job` class
4. Implement the `perform()` method

Example:

```typescript
import { Job } from '@/lib/jobs';

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  sentAt: Date;
}

export class SendEmailJob extends Job<SendEmailParams, SendEmailResult> {
  protected async perform(params: SendEmailParams): Promise<SendEmailResult> {
    // Send email logic
    const messageId = await sendEmail(params);

    return {
      messageId,
      sentAt: new Date(),
    };
  }
}
```

## Job Helper Function

For simple jobs, use the `createJob` helper:

```typescript
import { createJob } from '@/lib/jobs';

const SendEmailJob = createJob(
  'SendEmail',
  async (params: { to: string; subject: string }) => {
    await sendEmail(params);
    return { sent: true };
  },
);

await SendEmailJob.now({ to: 'user@example.com', subject: 'Hello' });
```

## Integration with Agents

Jobs work seamlessly with the agent system:

```typescript
export class MyAgentJob extends Job<MyParams, MyResult> {
  protected async perform(params: MyParams): Promise<MyResult> {
    // 1. Call agent to generate data
    const agent = await MyAgent.generate([
      { role: 'user', content: params.prompt },
    ]);

    const result = agent.getResult();

    // 2. Persist data via models layer
    if (result.type === 'new') {
      await createMyEntity(result.data);
    }

    return { created: true };
  }
}
```

## Database-Backed Job Queue

The job system now includes database persistence with SQLite/Turso:

### Features

- **Persistent job queue**: Jobs queued with `.later()` are stored in the database
- **Worker locking**: Distributed job processing with automatic lock expiration (default 5 minutes)
- **Progress tracking**: Update job progress (0-100%) with descriptive messages
- **Job history**: Full audit trail of all job executions with params, results, and errors
- **Manual retry**: Failed jobs can be retried from the admin dashboard
- **Cron scheduling**: Schedule recurring jobs with standard cron expressions

### Database Tables

**`jobs` table**: Tracks individual job executions

- State machine: pending → running → completed/failed
- Worker lock mechanism with expiration for distributed processing
- Progress tracking (0-100%) with messages
- Attempt count for manual retry tracking
- Full parameters, results, and error storage

**`cron_jobs` table**: Schedules recurring jobs

- Standard cron expression support (e.g., "0 \* \* \* \*")
- Enable/disable scheduling
- Track last run and next run timestamps
- Store default parameters for scheduled jobs

### Using Progress Tracking

```typescript
class MyLongRunningJob extends Job<MyParams, MyResult> {
  protected async perform(params: MyParams): Promise<MyResult> {
    // Progress updates are automatically persisted to database
    await this.updateProgress(10, 'Loading data...');

    const data = await loadData();

    await this.updateProgress(50, 'Processing items...');

    const processed = await processItems(data);

    await this.updateProgress(90, 'Saving results...');

    await saveResults(processed);

    // Job will be marked 100% complete automatically
    return { count: processed.length };
  }
}
```

### Executing Persisted Jobs

Jobs queued with `.later()` need a worker process to execute them:

```typescript
import { GenerateProjectIdeasJob } from '@/jobs/generate-project-ideas';

// Queue a job (returns job ID)
const jobId = await GenerateProjectIdeasJob.later({
  teamId: 'team-123',
  theme: 'AI projects',
  count: 10,
});

// Worker process executes the job
const result = await GenerateProjectIdeasJob.executeFromDatabase(jobId);
```

### Cron Job Scheduling

Create recurring jobs in the `cron_jobs` table:

```sql
INSERT INTO cron_jobs (job_name, cron_expression, params, enabled)
VALUES ('GenerateProjectIdeasJob', '0 0 * * *', '{"count": 5}', true);
```

A separate cron worker should poll the `cron_jobs` table and execute jobs when `nextRunAt` is reached.

### Future Enhancements

Additional features that could be added:

- **Automatic retry**: Exponential backoff for failed jobs
- **Job priorities**: Priority queue for important jobs
- **Job chains**: Sequential job execution with dependencies
- **Dead letter queue**: Automatic handling of permanently failed jobs

## Best Practices

1. **Keep jobs idempotent**: Jobs should be safe to retry
2. **Use meaningful names**: Job class names should describe what they do
3. **Log progress**: Use console.log for debugging and monitoring
4. **Handle errors**: Catch and handle errors gracefully
5. **Use batch for bulk**: Use `.batch()` for processing many items
6. **Validate parameters**: Validate job parameters in the constructor
7. **Return useful results**: Include all relevant information in the result

## Jobs CLI

The `bin/jobs` command provides a unified interface for managing and monitoring jobs:

### Commands

**`bin/jobs` or `bin/jobs help`**
Shows help with all available commands and examples.

**`bin/jobs list`**
Lists all jobs in console.table format with:

- Job ID (truncated for readability)
- Job name
- Status (color-coded: green=completed, red=failed, yellow=running, gray=pending)
- Progress percentage
- Created/completed timestamps
- Duration
- Attempt count

**`bin/jobs status <job-id>`**
Shows detailed job information including:

- Full job record with all fields
- Pretty-printed JSON parameters
- Pretty-printed JSON results
- Error messages (if failed)
- Progress tracking history
- Worker lock information

Supports partial job IDs for convenience:

```bash
# Instead of typing the full UUID:
bin/jobs status 019a885b-230f-7479-bb63-56f68f970aa1

# Just use the first few characters:
bin/jobs status 019a885b
```

**`bin/jobs generate-projects [options]`**
Create and execute a GenerateProjectIdeasJob with custom parameters:

```bash
# Basic usage (uses defaults)
bin/jobs generate-projects

# Custom parameters
bin/jobs generate-projects --param theme="AI and ML projects" --param count=5

# Nested parameters
bin/jobs generate-projects --param teamId=team-123 --param userId=2

# Multiple parameters
bin/jobs generate-projects \
  --param theme="Healthcare apps" \
  --param count=10 \
  --param teamId=team-456
```

Parameter format:

- `--param key=value` - Simple parameter
- `--param nested.key=value` - Nested object parameter
- Automatically parses numbers and booleans
- Strings with spaces need quotes: `--param theme="My Theme"`

### CLI Features

- **Color-coded output**: Easy-to-read status colors in terminal
- **Partial ID matching**: Type just a few characters of job IDs
- **Auto-detection**: Automatically runs in Docker if available, falls back to local execution
- **Flexible parameters**: Support for nested parameters with dot notation
- **Pretty formatting**: JSON output formatted for readability
- **Real-time execution**: Jobs run immediately and show progress

## Architecture

```
src/
├── database/
│   └── schema.jobs.ts       # Drizzle schema for jobs and cron_jobs tables
├── lib/
│   └── jobs/
│       └── index.ts         # Base Job class with database persistence
└── jobs/
    ├── README.md            # This file
    ├── cli.ts               # Jobs CLI implementation
    ├── generate-project-ideas.ts   # Example job
    └── run-generate-projects.ts    # Example script

bin/
├── jobs                     # Jobs CLI wrapper script
└── generate-projects        # Legacy wrapper (calls run-generate-projects.ts)

drizzle/
└── 0001_ancient_mauler.sql  # Migration creating jobs and cron_jobs tables
```
