# @tetrastack/server-tasks Implementation Plan

## Overview

This document outlines the implementation approach for the server-tasks package, a CLI task framework built on Commander.js with Zod validation.

---

## Design Decisions

### 1. Functional vs Class-Based API

**Decision:** Functional API with `defineTask()` factory function

**Rationale:**

- Simpler type inference with generics
- No inheritance complexity
- Matches existing project patterns (e.g., `createModelFactory`)
- Easier to test in isolation

### 2. Commander.js Integration

**Decision:** Wrap Commander.js rather than extend it

**Rationale:**

- Keeps Commander.js as implementation detail
- Allows swapping CLI framework in future if needed
- Simplifies task registration API
- Handles option parsing uniformly

### 3. Parameter Parsing Strategy

**Decision:** Custom `--param key=value` parsing (preserve existing pattern)

**Rationale:**

- Matches current `src/jobs/cli.ts` behavior
- Supports nested keys (`user.email=x`)
- Type coercion for common types
- Familiar to existing users

### 4. Output Strategy

**Decision:** Direct console output with ANSI codes (no external library)

**Rationale:**

- Zero dependencies for output
- Full control over formatting
- Matches existing CLI output patterns
- Works in all terminal environments

---

## Architecture

### Module Dependency Graph

```
index.ts
    ├── task.ts (defineTask, Task type)
    │       └── types.ts (TaskConfig, TaskResult)
    ├── runner.ts (TaskRunner)
    │       ├── task.ts
    │       ├── params.ts (parseParams)
    │       └── context.ts (createTaskContext)
    ├── context.ts (TaskContext, createTaskContext)
    │       ├── output.ts (color functions)
    │       ├── progress.ts (progress bar)
    │       └── docker.ts (isDocker)
    └── output.ts (standalone utilities)
```

### Data Flow

1. User invokes CLI: `my-cli task-name --param key=value`
2. Commander.js parses to options object
3. `parseParams()` converts `--param` array to typed object
4. Task's `inputSchema` validates parameters
5. `createTaskContext()` builds context with output methods
6. Task's `execute()` runs with validated input and context
7. Task's `outputSchema` validates result
8. Result displayed (JSON mode or formatted)

---

## Key Implementation Details

### Task Definition

```
defineTask(config) → Task object
```

The factory validates that:

- `name` is non-empty string
- `inputSchema` and `outputSchema` are Zod schemas
- `execute` is async function

Returns frozen Task object with `run()` method.

### TaskRunner Registration

```
runner.register(task) → this (chainable)
```

Creates Commander.js subcommand with:

- Task name as command
- Task description as help text
- Standard options: `--param`, `--verbose`, `--json`
- Action handler that orchestrates execution

### Context Creation

```
createTaskContext(options) → TaskContext
```

Creates context with:

- Bound output methods (log, success, warn, error)
- Progress function that manages carriage returns
- Flags from options (verbose, isDocker)

### Parameter Parsing

```
parseParams(paramArray) → Record<string, unknown>
```

Handles:

- Split on first `=` only (values can contain `=`)
- Nested key expansion (`a.b.c=x` → `{a:{b:{c:x}}}`)
- Type coercion (boolean, null, number, string)

---

## File Implementations

### types.ts

Define all TypeScript types and interfaces:

- `TaskConfig<TInput, TOutput>` - Configuration for defineTask
- `TaskResult<T>` - Execution result wrapper
- `TaskContext` - Runtime context interface
- `TaskRunnerConfig` - Runner configuration

### task.ts

Implement `defineTask()` factory:

- Generic type parameters for input/output
- Validation of config at definition time
- Return Task object with `run()` method
- `run()` handles validation, execution, result wrapping

### context.ts

Implement context creation:

- `createTaskContext(options)` factory
- Progress tracking state (last percentage)
- Output method implementations
- Docker detection integration

### output.ts

Implement output utilities:

- ANSI color code constants
- `success()`, `error()`, `warn()`, `info()`, `dim()`, `bold()`
- `formatDuration(ms)` - smart formatting
- `truncate(str, len)` - with ellipsis
- `table(data)` - uses `console.table`
- `divider(char, width)` - horizontal line

### progress.ts

Implement progress display:

- `createProgressBar(percent, width)` - returns bar string
- Block characters: `█` (filled), `░` (empty)
- Percent clamping (0-100)

### params.ts

Implement parameter parsing:

- `parseParams(args: string[])` - main function
- `coerceValue(str)` - type coercion
- `setNestedValue(obj, path, value)` - dot notation expansion

### docker.ts

Implement Docker detection:

- `isDocker()` - check environment
- Check `/.dockerenv` file existence
- Check environment variables

### runner.ts

Implement TaskRunner class:

- Constructor with config
- `register(task)` method
- `run(argv?)` method
- Private: command creation, action handler, help text generation

### index.ts

Export public API:

- `defineTask` from task.ts
- `TaskRunner` from runner.ts
- `createTaskContext` from context.ts
- `output` object from output.ts
- All types from types.ts

---

## Testing Strategy

### Unit Tests

**task.test.ts:**

- defineTask creates valid task
- Task.run() validates input
- Task.run() validates output
- Execution errors are caught
- Duration is measured

**params.test.ts:**

- Simple key=value parsing
- Nested key expansion
- Type coercion (all types)
- Invalid format handling
- Edge cases (empty value, special chars)

**output.test.ts:**

- Color functions produce correct ANSI codes
- formatDuration handles all ranges
- truncate works correctly
- (Use snapshot testing for output)

**context.test.ts:**

- Progress updates state correctly
- Output methods call correct functions
- Docker flag set from options

**runner.test.ts:**

- Task registration creates command
- Multiple tasks can be registered
- Run parses arguments correctly
- Help includes task descriptions

### Integration Tests

- End-to-end CLI execution
- Multiple tasks in single runner
- Error handling flows
- JSON output mode

---

## Migration Notes

### From src/jobs/cli.ts

The existing CLI patterns to preserve:

- Color scheme (green success, red error, yellow warning, gray dim)
- Duration formatting (ms, s, m)
- Truncation with "..."
- `--param key=value` syntax
- Docker-aware execution wrapper

### Compatibility

Tasks can call Jobs:

```
// In a task's execute function
import { SomeJob } from '@tetrastack/server-jobs';
await SomeJob.now(params);
```

This allows CLI tasks to orchestrate background jobs.

---

## Package Configuration

### package.json

```json
{
  "name": "@tetrastack/server-tasks",
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./output": "./src/output.ts",
    "./progress": "./src/progress.ts",
    "./docker": "./src/docker.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^3.0.0",
    "@types/node": "^20.0.0"
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

### Risk: Commander.js API Changes

**Mitigation:** Pin to major version, wrap rather than extend

### Risk: Terminal Compatibility

**Mitigation:** ANSI codes work on all modern terminals; degrade gracefully if not supported

### Risk: Type Inference Complexity

**Mitigation:** Extensive type tests, explicit generic constraints

---

## Success Metrics

1. All existing CLI functionality can be replicated
2. Type-safe task definitions with full inference
3. Zero runtime errors from type mismatches
4. Comprehensive test coverage (>90%)
5. Clean migration path from src/jobs/cli.ts
