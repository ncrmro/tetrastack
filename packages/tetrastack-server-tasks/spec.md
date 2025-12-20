# @tetrastack/server-tasks Specification

## Overview

A CLI task framework for defining and running administrative and development tasks from the command line. Built on Commander.js with Zod schema validation.

## Purpose

Provide a structured way to create CLI tasks with:

- Type-safe input/output validation
- Rich terminal output (colors, progress bars)
- Automatic help generation
- Consistent parameter parsing

## Key Distinction: Tasks vs Jobs

| Aspect      | Tasks (this package)             | Jobs (@tetrastack/server-jobs) |
| ----------- | -------------------------------- | ------------------------------ |
| Execution   | Synchronous, interactive         | Asynchronous, background       |
| Persistence | None (ephemeral)                 | Database-stored                |
| Output      | Rich terminal (colors, progress) | Logs to database               |
| Retry       | Manual re-run                    | Worker-based with locking      |
| Use Case    | Developer tools, admin scripts   | Long-running work, queues      |

---

## Core Abstractions

### 1. Task

A unit of CLI work with validated input and output.

**Properties:**

- `name` - Unique identifier used as CLI subcommand
- `description` - Short description for help text
- `inputSchema` - Zod schema for validating input parameters
- `outputSchema` - Zod schema for validating output
- `execute` - Async function that performs the task

**Behavior:**

- Input is validated against `inputSchema` before execution
- Output is validated against `outputSchema` after execution
- Validation errors are formatted and displayed to user
- Execution errors are caught and displayed with stack trace in verbose mode

### 2. TaskContext

Runtime context passed to the task's execute function.

**Properties:**

- `verbose` - Boolean indicating if verbose mode is enabled
- `isDocker` - Boolean indicating if running inside Docker container

**Methods:**

- `progress(percent: number, message?: string)` - Update progress display (0-100)
- `log(message: string)` - Print informational message
- `success(message: string)` - Print success message (green)
- `warn(message: string)` - Print warning message (yellow)
- `error(message: string)` - Print error message (red)

**Progress Behavior:**

- Progress updates overwrite the current line (carriage return)
- Progress bar visual: `[████████░░░░░░░░░░░░] 40%`
- Message appended after percentage
- Final newline printed when task completes

### 3. TaskRunner

Commander.js-based CLI program that manages multiple tasks.

**Configuration:**

- `name` - CLI program name
- `version` - Optional version string
- `description` - Optional program description

**Methods:**

- `register(task: Task)` - Add a task as a subcommand
- `run(argv?: string[])` - Parse arguments and execute (defaults to process.argv)

**CLI Options (per task):**

- `--param <key=value>` - Set input parameters (repeatable)
- `--verbose` - Enable verbose output
- `--json` - Output result as JSON instead of formatted text

**Help Generation:**

- Auto-generates help from task description
- Extracts parameter documentation from Zod schema descriptions
- Shows required vs optional parameters
- Displays default values when defined in schema

### 4. TaskResult

Result wrapper returned from task execution.

**Properties:**

- `success` - Boolean indicating if task completed without error
- `data` - Output data (present when success is true)
- `error` - Error object (present when success is false)
- `duration` - Execution time in milliseconds

---

## Output Utilities

### Color Functions

| Function       | Color  | Use Case               |
| -------------- | ------ | ---------------------- |
| `success(msg)` | Green  | Completed operations   |
| `error(msg)`   | Red    | Failed operations      |
| `warn(msg)`    | Yellow | Warnings, cautions     |
| `info(msg)`    | Cyan   | Informational messages |
| `dim(msg)`     | Gray   | Secondary information  |
| `bold(msg)`    | Bold   | Emphasis               |

### Formatting Functions

- `formatDuration(ms)` - Human-readable duration ("1.2s", "3.5m")
- `truncate(str, maxLen)` - Truncate with ellipsis
- `table(data[])` - Print array of objects as table
- `divider(char?, width?)` - Print horizontal divider line

### Progress Bar

- `createProgressBar(percent, width?)` - Returns string like `████████░░░░`
- Default width: 20 characters
- Uses block characters for fill/empty

---

## Parameter Parsing

### Format

Parameters are passed via `--param key=value` flags.

### Rules

1. **Simple values**: `--param name=John`
2. **Nested keys**: `--param user.email=john@example.com` creates `{ user: { email: "..." } }`
3. **Multiple params**: `--param a=1 --param b=2`

### Type Coercion

Values are automatically coerced:

- `"true"` / `"false"` → boolean
- `"null"` → null
- Numeric strings → number
- Everything else → string

### Validation

- Parameters are validated against the task's `inputSchema`
- Missing required fields produce clear error messages
- Extra fields are stripped (not passed to task)

---

## Docker-Aware Execution

### Detection

Running inside Docker is detected by:

1. Presence of `/.dockerenv` file
2. `IS_DOCKER=true` environment variable
3. `DOCKER_CONTAINER=true` environment variable

### Context Flag

`TaskContext.isDocker` is set accordingly, allowing tasks to:

- Adjust file paths
- Modify output formatting
- Skip interactive prompts

---

## Package Structure

```
packages/tetrastack-server-tasks/
├── package.json
├── tsconfig.json
├── index.ts                 # Main exports
├── src/
│   ├── task.ts             # Task type and defineTask function
│   ├── runner.ts           # TaskRunner class
│   ├── context.ts          # TaskContext implementation
│   ├── output.ts           # Color and formatting utilities
│   ├── params.ts           # Parameter parsing
│   ├── progress.ts         # Progress bar utilities
│   ├── docker.ts           # Docker detection
│   └── types.ts            # Shared TypeScript types
└── tests/
    ├── task.test.ts
    ├── runner.test.ts
    ├── params.test.ts
    └── output.test.ts
```

---

## Exports

### Main Entry (`@tetrastack/server-tasks`)

- `defineTask` - Factory function to create tasks
- `TaskRunner` - CLI runner class
- `createTaskContext` - Context factory (for testing)
- Types: `Task`, `TaskContext`, `TaskResult`, `TaskConfig`

### Subpath Exports

- `@tetrastack/server-tasks/output` - Output utilities
- `@tetrastack/server-tasks/progress` - Progress bar utilities
- `@tetrastack/server-tasks/docker` - Docker detection helpers

---

## Dependencies

### Runtime

- `commander` ^12.0.0 - CLI framework
- `zod` ^4.0.0 - Schema validation

### Peer

- `typescript` >=5.0.0

---

## Error Handling

### Validation Errors

- Display field path and error message
- Example: `Error: params.count: Number must be greater than 0`

### Execution Errors

- Display error message
- In verbose mode: include full stack trace
- Set process exit code to 1

### Unknown Commands

- Commander.js default: show help and available commands
