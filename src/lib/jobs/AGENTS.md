# Jobs Library (`src/lib/jobs`)

The Jobs library provides a type-safe, validated background job system with database persistence and fluent execution patterns.

## Architecture Overview

The Jobs library follows a **schema-first approach** where every job must define Zod schemas for both parameters and results. This ensures runtime type safety and validation at every stage of job execution.

```
┌─────────────┐
│   Job       │  Abstract base class with validation
└─────────────┘
      ↓
┌─────────────┐
│  Zod Schema │  Required for params & results
└─────────────┘
      ↓
┌─────────────┐
│  Database   │  SQLite with JSON fields
└─────────────┘
```

## Core Design Principles

### 1. **Required Zod Schemas**

Every job **must** define two required Zod schemas:

- `paramsSchema`: Validates job input parameters
- `resultSchema`: Validates job output results

This is enforced at the type level - you cannot create a job without providing both schemas.

### 2. **Runtime Validation**

Validation occurs at three critical points:

```typescript
// 1. When storing params to database
const validatedParams = this.validateParams(params, jobName);
await db.insert(jobs).values({ params: validatedParams });

// 2. When retrieving params from database
const validatedParams = this.validateParams(jobRecord.params, jobName);

// 3. When storing results to database
const validatedResult = this.validateResult(data, jobName);
await db.update(jobs).set({ result: validatedResult });
```

### 3. **Type Inference**

TypeScript types are **derived from Zod schemas**, not the other way around:

```typescript
// ✅ Good: Types inferred from schemas
export const myParamsSchema = z.object({
  userId: z.number().positive(),
  email: z.string().email(),
});

export type MyParams = z.infer<typeof myParamsSchema>;

// ❌ Bad: Schema created from types
export interface MyParams { ... }
const myParamsSchema = z.object({ ... });
```

## Creating a New Job

### Step 1: Define Zod Schemas

```typescript
import { Job } from '@/lib/jobs';
import { z } from 'zod';

// Define parameter schema
export const sendEmailParamsSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
  cc: z.array(z.string().email()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// Define result schema
export const sendEmailResultSchema = z.object({
  messageId: z.string(),
  sentAt: z.date(),
  deliveryStatus: z.enum(['sent', 'queued', 'failed']),
});

// Infer TypeScript types from schemas
export type SendEmailParams = z.input<typeof sendEmailParamsSchema>; // Use z.input for params
export type SendEmailResult = z.infer<typeof sendEmailResultSchema>;
```

**Important**: Use `z.input<>` for params (allows optional fields with defaults) and `z.infer<>` for results.

### Step 2: Create Job Class

```typescript
export class SendEmailJob extends Job<SendEmailParams, SendEmailResult> {
  // Required: Attach schemas to the class
  protected static readonly paramsSchema = sendEmailParamsSchema;
  protected static readonly resultSchema = sendEmailResultSchema;

  // Implement the perform method
  protected async perform(params: SendEmailParams): Promise<SendEmailResult> {
    // Your job logic here
    const messageId = await emailService.send({
      to: params.to,
      subject: params.subject,
      body: params.body,
      cc: params.cc,
    });

    return {
      messageId,
      sentAt: new Date(),
      deliveryStatus: 'sent',
    };
  }
}
```

### Step 3: Use the Job

```typescript
// Execute immediately (persisted to database for audit trail)
const result = await SendEmailJob.now({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
});

console.log(result.data.messageId); // Fully typed!

// Execute without persistence (faster, no audit trail)
const result = await SendEmailJob.now(
  {
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thanks for signing up',
  },
  { persist: false },
);

// Queue for later
const jobId = await SendEmailJob.later({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
});

// Batch execution (default concurrency: 3, persist: true)
await SendEmailJob.batch([
  { to: 'user1@example.com', subject: 'Hi', body: 'Hello' },
  { to: 'user2@example.com', subject: 'Hi', body: 'Hello' },
]);

// Batch with custom options
await SendEmailJob.batch(
  [
    { to: 'user1@example.com', subject: 'Hi', body: 'Hello' },
    { to: 'user2@example.com', subject: 'Hi', body: 'Hello' },
  ],
  {
    concurrency: 5, // Run 5 jobs concurrently
    persist: false, // Skip database persistence for speed
    stopOnError: true, // Stop on first failure
  },
);
```

## Schema Best Practices

### 1. Use Defaults for Optional Fields

```typescript
// ✅ Good: Provides sensible defaults
const paramsSchema = z.object({
  retryCount: z.number().int().nonnegative().default(3),
  timeout: z.number().positive().default(30000),
});

// ❌ Bad: Forces caller to provide optional values
const paramsSchema = z.object({
  retryCount: z.number().int().nonnegative().optional(),
  timeout: z.number().positive().optional(),
});
```

### 2. Add Validation Constraints

```typescript
const paramsSchema = z.object({
  email: z.string().email(), // Email format
  age: z.number().int().positive().max(120), // Positive integer ≤ 120
  name: z.string().min(1).max(100), // Non-empty, max length
  url: z.string().url(), // Valid URL
  items: z.array(z.string()).min(1), // At least one item
});
```

### 3. Use Enums for Fixed Values

```typescript
const paramsSchema = z.object({
  priority: z.enum(['low', 'normal', 'high']),
  status: z.enum(['pending', 'processing', 'completed']),
});
```

### 4. Transform Data When Needed

```typescript
const paramsSchema = z.object({
  // Parse dates from ISO strings
  scheduledFor: z
    .string()
    .datetime()
    .transform((str) => new Date(str)),

  // Normalize email to lowercase
  email: z
    .string()
    .email()
    .transform((e) => e.toLowerCase()),

  // Trim whitespace
  name: z.string().transform((s) => s.trim()),
});
```

### 5. Use Refinements for Complex Validation

```typescript
const paramsSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  });
```

## Error Handling

### Validation Errors

When validation fails, you get a clear error message:

```typescript
try {
  await SendEmailJob.now({
    to: 'invalid-email', // Invalid email format
    subject: '', // Empty subject
    body: 'Hello',
  });
} catch (error) {
  // Error: Invalid params for SendEmailJob: to: Invalid email, subject: String must contain at least 1 character(s)
}
```

### Job Execution Errors

Job failures are automatically tracked in the database:

```typescript
const result = await MyJob.now({
  /* params */
});
// If job fails, metadata will contain error info
if (result.metadata.status === 'failed') {
  console.error(result.metadata.error);
}
```

## Advanced Features

### Progress Tracking

Update job progress during long-running operations:

```typescript
protected async perform(params: MyParams): Promise<MyResult> {
  await this.updateProgress(0, 'Starting...');

  await step1();
  await this.updateProgress(25, 'Step 1 complete');

  await step2();
  await this.updateProgress(50, 'Step 2 complete');

  await step3();
  await this.updateProgress(75, 'Step 3 complete');

  const result = await step4();
  // Progress automatically set to 100% on completion

  return result;
}
```

**Note**: Progress tracking only works when the job is persisted to the database (`.now()`, `.later()`, `.executeFromDatabase()`).

### Helper Function for Simple Jobs

For simple jobs, use the `createJob` helper:

```typescript
import { createJob } from '@/lib/jobs';

const SendEmailJob = createJob(
  'SendEmail',
  sendEmailParamsSchema,
  sendEmailResultSchema,
  async (params) => {
    const messageId = await emailService.send(params);
    return {
      messageId,
      sentAt: new Date(),
      deliveryStatus: 'sent',
    };
  },
);
```

## Type Safety Guarantees

The Jobs library provides complete type safety:

### 1. **Compile-Time Type Checking**

```typescript
// ✅ TypeScript enforces correct types
await SendEmailJob.now({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Welcome',
});

// ❌ TypeScript error: Property 'subject' is missing
await SendEmailJob.now({
  to: 'user@example.com',
  body: 'Welcome',
});
```

### 2. **Runtime Validation**

```typescript
// Even if TypeScript is bypassed (e.g., data from external API),
// Zod validates at runtime
const externalData: any = { to: 'invalid-email' };
await SendEmailJob.now(externalData);
// Throws: Invalid params for SendEmailJob: to: Invalid email
```

### 3. **Type Inference**

```typescript
const result = await SendEmailJob.now({
  /* params */
});

// TypeScript knows the exact type
result.data.messageId; // string
result.data.sentAt; // Date
result.data.deliveryStatus; // 'sent' | 'queued' | 'failed'
result.metadata.status; // JobStatus
```

## Database Schema

Jobs are stored in the `jobs` table with the following structure:

```typescript
{
  id: string; // UUIDv7
  jobName: string; // Class name
  params: JSON; // Validated params
  result: JSON; // Validated result
  status: JobStatus; // pending | running | completed | failed
  progress: number; // 0-100
  progressMessage: string; // Current step
  error: string; // Error message if failed
  workerStartedAt: Date; // Worker claim timestamp
  workerExpiresAt: Date; // Worker lock expiration
  attemptCount: number; // Number of attempts
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date;
}
```

## Common Patterns

### 1. **Jobs with External API Calls**

```typescript
export const fetchUserDataParamsSchema = z.object({
  userId: z.number().positive(),
  includeOrders: z.boolean().default(false),
});

export const fetchUserDataResultSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
  }),
  orders: z
    .array(
      z.object({
        id: z.number(),
        total: z.number(),
      }),
    )
    .optional(),
});

export class FetchUserDataJob extends Job<
  z.input<typeof fetchUserDataParamsSchema>,
  z.infer<typeof fetchUserDataResultSchema>
> {
  protected static readonly paramsSchema = fetchUserDataParamsSchema;
  protected static readonly resultSchema = fetchUserDataResultSchema;

  protected async perform(params) {
    const user = await externalAPI.getUser(params.userId);
    const orders = params.includeOrders
      ? await externalAPI.getUserOrders(params.userId)
      : undefined;

    return { user, orders };
  }
}
```

### 2. **Jobs with Database Operations**

```typescript
export class GenerateReportJob extends Job<
  z.input<typeof generateReportParamsSchema>,
  z.infer<typeof generateReportResultSchema>
> {
  protected static readonly paramsSchema = generateReportParamsSchema;
  protected static readonly resultSchema = generateReportResultSchema;

  protected async perform(params) {
    await this.updateProgress(0, 'Fetching data...');
    const data = await fetchReportData(params.reportType);

    await this.updateProgress(50, 'Processing...');
    const processed = await processData(data);

    await this.updateProgress(75, 'Saving report...');
    const reportId = await saveReport(processed);

    return {
      reportId,
      rowCount: processed.length,
      generatedAt: new Date(),
    };
  }
}
```

### 3. **Jobs with AI/LLM Calls**

```typescript
export class AnalyzeTextJob extends Job<
  z.input<typeof analyzeTextParamsSchema>,
  z.infer<typeof analyzeTextResultSchema>
> {
  protected static readonly paramsSchema = analyzeTextParamsSchema;
  protected static readonly resultSchema = analyzeTextResultSchema;

  protected async perform(params) {
    const agent = await TextAnalyzerAgent.generate([
      { role: 'user', content: params.text },
    ]);

    const analysis = agent.getResult();

    // Result is validated before being stored
    return {
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      summary: analysis.summary,
    };
  }
}
```

## Migration Guide

If you have existing jobs without Zod schemas, here's how to migrate:

### Before (No Validation)

```typescript
export class MyJob extends Job<MyParams, MyResult> {
  protected async perform(params: MyParams): Promise<MyResult> {
    // No validation, types only checked at compile time
    return result;
  }
}
```

### After (With Validation)

```typescript
// 1. Create Zod schemas
export const myParamsSchema = z.object({
  // Define schema based on MyParams interface
});

export const myResultSchema = z.object({
  // Define schema based on MyResult interface
});

// 2. Replace interface types with inferred types
export type MyParams = z.input<typeof myParamsSchema>;
export type MyResult = z.infer<typeof myResultSchema>;

// 3. Add schemas to job class
export class MyJob extends Job<MyParams, MyResult> {
  protected static readonly paramsSchema = myParamsSchema;
  protected static readonly resultSchema = myResultSchema;

  protected async perform(params: MyParams): Promise<MyResult> {
    // Same logic, now with runtime validation
    return result;
  }
}
```

## Files in this Directory

- **`index.ts`**: Core Job class implementation with validation logic
- **`schema.jobs.ts`**: Drizzle schema for jobs and cron_jobs tables
- **`README.md`**: This file - library documentation

## Related Documentation

- **Application Jobs**: See `src/jobs/README.md` for application-level job documentation
- **Models Layer**: See `src/models/README.md` for database operations used within jobs
- **Agents**: See `src/agents/README.md` for AI agent integration with jobs

## Why Schema-First?

The schema-first approach provides several key benefits:

1. **Catch Errors Early**: Invalid data is rejected before it touches the database
2. **Single Source of Truth**: Schemas define both TypeScript types and runtime validation
3. **Self-Documenting**: Schemas describe expected data structure clearly
4. **Database Integrity**: No corrupt or invalid data in the jobs table
5. **Better Error Messages**: Zod provides detailed, field-level error messages
6. **Transformation**: Schemas can normalize data (trim strings, parse dates, etc.)
7. **Refactoring Safety**: Changing a schema updates both types and validation

## Examples

See `src/jobs/generate-project-ideas.ts` for a complete, real-world example of a job with:

- Complex parameter schema with defaults
- Nested result schema with arrays
- Integration with AI agents
- Database operations via models layer
- Progress tracking during execution
