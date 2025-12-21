import type { Task, TaskConfig, TaskResult, TaskRunOptions } from './types.js';
import { createTaskContext } from './context.js';

/**
 * Define a task with validated input and output schemas
 */
export function defineTask<TInput, TOutput>(
  config: TaskConfig<TInput, TOutput>,
): Task<TInput, TOutput> {
  // Validate config at definition time
  if (!config.name || typeof config.name !== 'string') {
    throw new Error('Task name must be a non-empty string');
  }

  if (!config.inputSchema) {
    throw new Error('Task inputSchema is required');
  }

  if (!config.outputSchema) {
    throw new Error('Task outputSchema is required');
  }

  if (typeof config.execute !== 'function') {
    throw new Error('Task execute must be a function');
  }

  const task: Task<TInput, TOutput> = {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,

    async run(
      input: unknown,
      options: TaskRunOptions = {},
    ): Promise<TaskResult<TOutput>> {
      const startTime = Date.now();

      try {
        // Validate input
        const parsedInput = config.inputSchema.parse(input);

        // Create context
        const context = createTaskContext({
          verbose: options.verbose ?? false,
          isDocker: options.isDocker,
        });

        // Execute task
        const output = await config.execute(parsedInput, context);

        // Validate output
        const parsedOutput = config.outputSchema.parse(output);

        const duration = Date.now() - startTime;

        return {
          success: true,
          data: parsedOutput,
          duration,
        };
      } catch (err) {
        const duration = Date.now() - startTime;
        const error = err instanceof Error ? err : new Error(String(err));

        return {
          success: false,
          error,
          duration,
        };
      }
    },
  };

  // Freeze task object to prevent modification
  return Object.freeze(task);
}
