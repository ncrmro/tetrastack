# @tetrastack/server-tasks Implementation Tasks

## Prerequisites

- [ ] **PREREQ-1**: Add npm workspaces to root package.json
  - Add `"workspaces": ["packages/*"]` to root package.json
  - Run `npm install` to initialize workspace

---

## Phase 1: Package Setup

- [ ] **SETUP-1**: Create package.json
  - Name: `@tetrastack/server-tasks`
  - Version: `0.1.0`
  - Type: `module`
  - Main: `index.ts`
  - Exports for main and subpaths
  - Dependencies: commander, zod
  - DevDependencies: typescript, vitest, @types/node

- [ ] **SETUP-2**: Create tsconfig.json
  - ESNext target and module
  - Bundler module resolution
  - Strict mode enabled
  - Path alias: `@/*` → `./src/*`
  - Include src, index.ts, tests

- [ ] **SETUP-3**: Create directory structure
  ```
  src/
  tests/
  index.ts
  ```

---

## Phase 2: Core Types

- [ ] **TYPES-1**: Create src/types.ts
  - Define `TaskConfig<TInput, TOutput>` interface
  - Define `TaskResult<T>` interface
  - Define `TaskContext` interface
  - Define `TaskRunnerConfig` interface
  - Export all types

---

## Phase 3: Utility Modules

- [ ] **UTIL-1**: Create src/output.ts
  - Define ANSI color code constants
  - Implement `success(msg)` - green output
  - Implement `error(msg)` - red output
  - Implement `warn(msg)` - yellow output
  - Implement `info(msg)` - cyan output
  - Implement `dim(msg)` - gray output
  - Implement `bold(msg)` - bold output
  - Implement `formatDuration(ms)` - human-readable duration
  - Implement `truncate(str, maxLen)` - truncate with ellipsis
  - Implement `table(data)` - wrapper around console.table
  - Implement `divider(char, width)` - horizontal line
  - Export all functions

- [ ] **UTIL-2**: Create src/progress.ts
  - Implement `createProgressBar(percent, width?)`
  - Use block characters: █ (filled), ░ (empty)
  - Default width: 20 characters
  - Clamp percent to 0-100
  - Export function

- [ ] **UTIL-3**: Create src/docker.ts
  - Implement `isDocker()` function
  - Check for `/.dockerenv` file
  - Check `IS_DOCKER` environment variable
  - Check `DOCKER_CONTAINER` environment variable
  - Return boolean
  - Export function

- [ ] **UTIL-4**: Create src/params.ts
  - Implement `parseParams(args: string[])` function
  - Split on first `=` only
  - Implement `coerceValue(str)` helper
    - `"true"` → true
    - `"false"` → false
    - `"null"` → null
    - Numeric strings → number
    - Default → string
  - Implement nested key expansion (`a.b=x` → `{a:{b:x}}`)
  - Throw on invalid format (no `=`)
  - Export `parseParams`

---

## Phase 4: Context Implementation

- [ ] **CTX-1**: Create src/context.ts
  - Import output functions
  - Import progress utilities
  - Import isDocker
  - Implement `createTaskContext(options)` factory
  - Options: `verbose`, `isDocker` (optional, auto-detect)
  - Context methods:
    - `progress(percent, message?)` - with carriage return
    - `log(message)` - plain output
    - `success(message)` - green with checkmark
    - `warn(message)` - yellow with warning symbol
    - `error(message)` - red with X symbol
  - Track last progress percent to avoid redundant updates
  - Export `createTaskContext`

---

## Phase 5: Task Definition

- [ ] **TASK-1**: Create src/task.ts
  - Import types
  - Import createTaskContext
  - Implement `defineTask<TInput, TOutput>(config)` function
  - Validate config at definition time:
    - name is non-empty string
    - inputSchema is Zod schema
    - outputSchema is Zod schema
    - execute is function
  - Return Task object with:
    - `name`, `description`, `inputSchema`, `outputSchema` properties
    - `run(input, options?)` method
  - `run()` implementation:
    - Parse input with inputSchema
    - Create context
    - Record start time
    - Execute task
    - Parse output with outputSchema
    - Return TaskResult with data/error and duration
  - Freeze returned Task object
  - Export `defineTask`

---

## Phase 6: Task Runner

- [ ] **RUN-1**: Create src/runner.ts
  - Import Commander from commander
  - Import types
  - Import parseParams
  - Import output utilities
  - Implement `TaskRunner` class
  - Constructor accepts `TaskRunnerConfig`
  - Create Commander program with name, version, description
  - Implement `register(task)` method:
    - Create subcommand with task name
    - Set description from task
    - Add `--param <key=value>` option (variadic)
    - Add `--verbose` flag
    - Add `--json` flag
    - Add action handler
    - Add help text from Zod schema descriptions
    - Return `this` for chaining
  - Implement `run(argv?)` method:
    - Default to process.argv
    - Call program.parseAsync(argv)
  - Private action handler:
    - Parse params with parseParams
    - Call task.run() with params
    - Handle success: print result or JSON
    - Handle error: print error, exit 1
  - Export `TaskRunner`

---

## Phase 7: Main Export

- [ ] **EXPORT-1**: Create index.ts
  - Export `defineTask` from ./src/task
  - Export `TaskRunner` from ./src/runner
  - Export `createTaskContext` from ./src/context
  - Export `output` (as namespace) from ./src/output
  - Export all types from ./src/types
  - Export type-only exports for interfaces

---

## Phase 8: Unit Tests

- [ ] **TEST-1**: Create tests/params.test.ts
  - Test simple key=value parsing
  - Test nested key expansion
  - Test boolean coercion (true, false)
  - Test null coercion
  - Test number coercion
  - Test string passthrough
  - Test invalid format throws
  - Test empty value handling
  - Test values containing `=`

- [ ] **TEST-2**: Create tests/output.test.ts
  - Test color functions produce ANSI codes
  - Test formatDuration with ms, seconds, minutes
  - Test truncate with various lengths
  - Test truncate with string shorter than max

- [ ] **TEST-3**: Create tests/progress.test.ts
  - Test progress bar at 0%
  - Test progress bar at 50%
  - Test progress bar at 100%
  - Test custom width
  - Test percent clamping (negative, >100)

- [ ] **TEST-4**: Create tests/docker.test.ts
  - Test returns false by default
  - Test returns true with IS_DOCKER env var
  - Test returns true with DOCKER_CONTAINER env var

- [ ] **TEST-5**: Create tests/task.test.ts
  - Test defineTask creates valid task
  - Test task.run validates input
  - Test task.run validates output
  - Test task.run catches execution errors
  - Test task.run measures duration
  - Test invalid config throws

- [ ] **TEST-6**: Create tests/runner.test.ts
  - Test TaskRunner creation
  - Test register adds command
  - Test register is chainable
  - Test run parses --param correctly
  - Test --json outputs JSON
  - Test --verbose is passed to context

---

## Phase 9: Integration Test

- [ ] **INT-1**: Create tests/integration.test.ts
  - Test end-to-end task execution
  - Create test task with input/output schemas
  - Register with TaskRunner
  - Execute via run() with mock argv
  - Verify correct output

---

## Phase 10: Documentation

- [ ] **DOC-1**: Create README.md
  - Package overview
  - Installation (workspace reference)
  - Quick start example
  - API reference links to spec.md
  - Link to plan.md for architecture decisions

---

## Verification Checklist

- [ ] All tests pass: `npm test`
- [ ] Type check passes: `npm run typecheck`
- [ ] Can define a task with Zod schemas
- [ ] Can register task with TaskRunner
- [ ] Can run task from CLI
- [ ] --param parsing works with nested keys
- [ ] --json outputs valid JSON
- [ ] --verbose enables verbose mode
- [ ] Progress bar displays correctly
- [ ] Colors render in terminal
