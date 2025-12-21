# @tetrastack/server-tasks

A CLI task framework for defining and running administrative and development tasks from the command line. Built on Commander.js with Zod schema validation.

## Features

- 🎯 **Type-safe**: Full TypeScript support with Zod schema validation
- 🎨 **Rich output**: Colors, progress bars, and formatted terminal output
- 🔧 **Flexible**: Functional API with composable tasks
- 🐳 **Docker-aware**: Automatic detection of Docker environments
- 📝 **Auto-generated help**: Commander.js integration with schema-based documentation

## Installation

This package is part of the Tetrastack monorepo. Reference it from within the workspace:

```json
{
  "dependencies": {
    "@tetrastack/server-tasks": "workspace:*"
  }
}
```

## Quick Start

### Define a Task

```typescript
import { defineTask } from '@tetrastack/server-tasks';
import { z } from 'zod';

const greetTask = defineTask({
  name: 'greet',
  description: 'Greet a user',
  inputSchema: z.object({
    name: z.string(),
    formal: z.boolean().optional(),
  }),
  outputSchema: z.object({
    message: z.string(),
  }),
  execute: async (input, context) => {
    context.log(`Greeting ${input.name}...`);

    const greeting = input.formal
      ? `Good day, ${input.name}`
      : `Hey ${input.name}!`;

    context.success('Greeting generated');

    return { message: greeting };
  },
});
```

### Create a CLI Runner

```typescript
import { TaskRunner } from '@tetrastack/server-tasks';

const runner = new TaskRunner({
  name: 'my-cli',
  version: '1.0.0',
  description: 'My awesome CLI',
});

runner.register(greetTask).register(anotherTask).run();
```

### Run from Command Line

```bash
# Show help
my-cli --help

# Run a task
my-cli greet --param name=John

# With multiple parameters
my-cli greet --param name=John --param formal=true

# Verbose output
my-cli greet --param name=John --verbose

# JSON output
my-cli greet --param name=John --json
```

## Task Context

The `TaskContext` provides methods for rich output during task execution:

```typescript
execute: async (input, context) => {
  // Log messages
  context.log('Processing...');
  context.success('Done!');
  context.warn('Be careful...');
  context.error('Something went wrong');

  // Progress updates (0-100)
  context.progress(0, 'Starting...');
  context.progress(50, 'Halfway there...');
  context.progress(100, 'Complete!');

  // Check environment
  if (context.isDocker) {
    context.log('Running in Docker');
  }

  return {
    /* result */
  };
};
```

## Parameter Parsing

Parameters support nested keys and type coercion:

```bash
# Simple values
--param name=John --param age=30 --param active=true

# Nested keys (creates {user: {email: "..."}})
--param user.email=john@example.com --param user.role=admin

# Type coercion
--param count=42           # number
--param enabled=true       # boolean
--param value=null         # null
--param name="John Doe"    # string
```

## Output Utilities

The package provides utilities for formatting terminal output:

```typescript
import { output } from '@tetrastack/server-tasks';

console.log(output.success('Operation completed'));
console.log(output.error('Operation failed'));
console.log(output.warn('Warning message'));
console.log(output.info('Information'));
console.log(output.dim('Secondary text'));
console.log(output.bold('Important!'));

console.log(output.formatDuration(1500)); // "1.5s"
console.log(output.truncate('Long text...', 10)); // "Long te..."
console.log(output.divider()); // "═══════..."
```

## Architecture

See the [specification](./spec.md) for detailed architecture documentation and the [implementation plan](./plan.md) for design decisions.

## Key Distinction: Tasks vs Jobs

| Aspect      | Tasks (this package)             | Jobs (@tetrastack/server-jobs) |
| ----------- | -------------------------------- | ------------------------------ |
| Execution   | Synchronous, interactive         | Asynchronous, background       |
| Persistence | None (ephemeral)                 | Database-stored                |
| Output      | Rich terminal (colors, progress) | Logs to database               |
| Retry       | Manual re-run                    | Worker-based with locking      |
| Use Case    | Developer tools, admin scripts   | Long-running work, queues      |

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Type check
npm run typecheck
```

## License

MIT
