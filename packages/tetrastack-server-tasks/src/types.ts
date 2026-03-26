import type { ZodSchema } from 'zod';

/**
 * Configuration for defining a task
 */
export interface TaskConfig<TInput = unknown, TOutput = unknown> {
  /** Unique identifier used as CLI subcommand */
  name: string;
  /** Short description for help text */
  description: string;
  /** Zod schema for validating input parameters */
  inputSchema: ZodSchema<TInput>;
  /** Zod schema for validating output */
  outputSchema: ZodSchema<TOutput>;
  /** Async function that performs the task */
  execute: (input: TInput, context: TaskContext) => Promise<TOutput>;
}

/**
 * Runtime context passed to the task's execute function
 */
export interface TaskContext {
  /** Boolean indicating if verbose mode is enabled */
  verbose: boolean;
  /** Boolean indicating if running inside Docker container */
  isDocker: boolean;
  /** Update progress display (0-100) */
  progress: (percent: number, message?: string) => void;
  /** Print informational message */
  log: (message: string) => void;
  /** Print success message (green) */
  success: (message: string) => void;
  /** Print warning message (yellow) */
  warn: (message: string) => void;
  /** Print error message (red) */
  error: (message: string) => void;
}

/**
 * Result wrapper returned from task execution
 */
export interface TaskResult<T> {
  /** Boolean indicating if task completed without error */
  success: boolean;
  /** Output data (present when success is true) */
  data?: T;
  /** Error object (present when success is false) */
  error?: Error;
  /** Execution time in milliseconds */
  duration: number;
}

/**
 * Task object with validated configuration and run method
 */
export interface Task<TInput = unknown, TOutput = unknown> {
  /** Unique identifier used as CLI subcommand */
  name: string;
  /** Short description for help text */
  description: string;
  /** Zod schema for validating input parameters */
  inputSchema: ZodSchema<TInput>;
  /** Zod schema for validating output */
  outputSchema: ZodSchema<TOutput>;
  /** Run the task with validated input */
  run: (
    input: unknown,
    options?: TaskRunOptions,
  ) => Promise<TaskResult<TOutput>>;
}

/**
 * Options for running a task
 */
export interface TaskRunOptions {
  /** Enable verbose output */
  verbose?: boolean;
  /** Override Docker detection */
  isDocker?: boolean;
}

/**
 * Configuration for TaskRunner
 */
export interface TaskRunnerConfig {
  /** CLI program name */
  name: string;
  /** Optional version string */
  version?: string;
  /** Optional program description */
  description?: string;
}
