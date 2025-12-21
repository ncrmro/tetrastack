import { Command } from 'commander';
import type { Task, TaskRunnerConfig } from './types.js';
import { parseParams } from './params.js';
import * as output from './output.js';

/**
 * CLI runner that manages multiple tasks using Commander.js
 */
export class TaskRunner {
  private program: Command;
  private tasks: Map<string, Task> = new Map();

  constructor(config: TaskRunnerConfig) {
    this.program = new Command();
    this.program.name(config.name);

    if (config.version) {
      this.program.version(config.version);
    }

    if (config.description) {
      this.program.description(config.description);
    }
  }

  /**
   * Register a task as a subcommand
   */
  register<TInput, TOutput>(task: Task<TInput, TOutput>): this {
    if (this.tasks.has(task.name)) {
      throw new Error(`Task "${task.name}" is already registered`);
    }

    this.tasks.set(task.name, task);

    this.program
      .command(task.name)
      .description(task.description)
      .option('--param <key=value...>', 'Set input parameters (repeatable)')
      .option('--verbose', 'Enable verbose output', false)
      .option('--json', 'Output result as JSON', false)
      .action(async (options) => {
        await this.executeTask(task, options);
      });

    return this;
  }

  /**
   * Parse arguments and execute
   */
  async run(argv: string[] = process.argv): Promise<void> {
    await this.program.parseAsync(argv);
  }

  /**
   * Execute a task with parsed options
   */
  private async executeTask(task: Task, options: Record<string, unknown>) {
    try {
      // Parse parameters
      const paramArgs = options.param as string[] | undefined;
      const params = paramArgs ? parseParams(paramArgs) : {};

      const verbose = options.verbose as boolean;
      const jsonOutput = options.json as boolean;

      // Run task
      const result = await task.run(params, { verbose });

      // Handle result
      if (result.success) {
        if (jsonOutput) {
          console.log(JSON.stringify(result.data, null, 2));
        } else {
          console.log(output.success('Task completed successfully'));
          console.log(
            output.dim(`Duration: ${output.formatDuration(result.duration)}`),
          );
          if (result.data) {
            console.log('\nResult:');
            console.log(JSON.stringify(result.data, null, 2));
          }
        }
        process.exit(0);
      } else {
        if (jsonOutput) {
          console.error(
            JSON.stringify(
              {
                error: result.error?.message,
                duration: result.duration,
              },
              null,
              2,
            ),
          );
        } else {
          console.error(output.error('Task failed'));
          console.error(result.error?.message);
          if (verbose && result.error?.stack) {
            console.error('\nStack trace:');
            console.error(output.dim(result.error.stack));
          }
        }
        process.exit(1);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(output.error('Task execution error'));
      console.error(error.message);
      if (options.verbose && error.stack) {
        console.error('\nStack trace:');
        console.error(output.dim(error.stack));
      }
      process.exit(1);
    }
  }
}
