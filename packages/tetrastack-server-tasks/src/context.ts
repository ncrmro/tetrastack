import type { TaskContext } from './types.js';
import { isDocker } from './docker.js';
import { createProgressBar } from './progress.js';
import * as output from './output.js';

/**
 * Options for creating task context
 */
export interface CreateTaskContextOptions {
  verbose?: boolean;
  isDocker?: boolean;
}

/**
 * Create a TaskContext with output methods and progress tracking
 */
export function createTaskContext(
  options: CreateTaskContextOptions = {},
): TaskContext {
  const verbose = options.verbose ?? false;
  const dockerEnv = options.isDocker ?? isDocker();

  let lastProgress = -1;

  const context: TaskContext = {
    verbose,
    isDocker: dockerEnv,

    progress(percent: number, message?: string) {
      // Avoid redundant updates
      if (percent === lastProgress && !message) {
        return;
      }
      lastProgress = percent;

      const bar = createProgressBar(percent);
      const text = `[${bar}] ${percent}%`;
      const fullMessage = message ? `${text} ${message}` : text;

      // Use carriage return to overwrite current line
      process.stdout.write(`\r${fullMessage}`);

      // Add newline when complete
      if (percent === 100) {
        process.stdout.write('\n');
      }
    },

    log(message: string) {
      console.log(message);
    },

    success(message: string) {
      console.log(output.success(`✓ ${message}`));
    },

    warn(message: string) {
      console.log(output.warn(`⚠ ${message}`));
    },

    error(message: string) {
      console.log(output.error(`✗ ${message}`));
    },
  };

  return context;
}
