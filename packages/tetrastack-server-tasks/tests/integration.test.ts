import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { defineTask, TaskRunner } from '../index.js';

describe('Integration Tests', () => {
  let originalExit: typeof process.exit;

  beforeEach(() => {
    originalExit = process.exit;
    process.exit = vi.fn() as never;
  });

  afterEach(() => {
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  it('should execute end-to-end task flow', async () => {
    // Define a task
    const addTask = defineTask({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      outputSchema: z.object({
        sum: z.number(),
      }),
      execute: async (input) => {
        return { sum: input.a + input.b };
      },
    });

    // Create runner
    const runner = new TaskRunner({
      name: 'math-cli',
      version: '1.0.0',
      description: 'Math operations CLI',
    });

    // Register task
    runner.register(addTask);

    // Mock console output
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Execute task
    await runner.run([
      'node',
      'cli',
      'add',
      '--param',
      'a=5',
      '--param',
      'b=3',
    ]);

    // Verify execution
    expect(process.exit).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('should handle nested parameters', async () => {
    const configTask = defineTask({
      name: 'config',
      description: 'Configure settings',
      inputSchema: z.object({
        database: z.object({
          host: z.string(),
          port: z.number(),
        }),
      }),
      outputSchema: z.object({
        configured: z.boolean(),
      }),
      execute: async (input) => {
        expect(input.database.host).toBe('localhost');
        expect(input.database.port).toBe(5432);
        return { configured: true };
      },
    });

    const runner = new TaskRunner({ name: 'test-cli' });
    runner.register(configTask);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run([
      'node',
      'cli',
      'config',
      '--param',
      'database.host=localhost',
      '--param',
      'database.port=5432',
    ]);

    expect(process.exit).toHaveBeenCalledWith(0);

    logSpy.mockRestore();
  });

  it('should handle task with progress updates', async () => {
    const longTask = defineTask({
      name: 'process',
      description: 'Long running process',
      inputSchema: z.object({}),
      outputSchema: z.object({ done: z.boolean() }),
      execute: async (_, context) => {
        context.progress(0, 'Starting...');
        await new Promise((resolve) => setTimeout(resolve, 10));
        context.progress(50, 'Halfway...');
        await new Promise((resolve) => setTimeout(resolve, 10));
        context.progress(100, 'Done!');
        return { done: true };
      },
    });

    const runner = new TaskRunner({ name: 'test-cli' });
    runner.register(longTask);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const stdoutSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await runner.run(['node', 'cli', 'process']);

    expect(process.exit).toHaveBeenCalledWith(0);
    expect(stdoutSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    stdoutSpy.mockRestore();
  });

  it('should register and run multiple tasks', async () => {
    const task1 = defineTask({
      name: 'task1',
      description: 'First task',
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      execute: async () => ({ result: 'task1' }),
    });

    const task2 = defineTask({
      name: 'task2',
      description: 'Second task',
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      execute: async () => ({ result: 'task2' }),
    });

    const runner = new TaskRunner({ name: 'test-cli' });
    runner.register(task1).register(task2);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Run first task
    await runner.run(['node', 'cli', 'task1']);
    expect(process.exit).toHaveBeenCalledWith(0);

    // Reset mocks
    vi.clearAllMocks();

    // Run second task
    await runner.run(['node', 'cli', 'task2']);
    expect(process.exit).toHaveBeenCalledWith(0);

    logSpy.mockRestore();
  });

  it('should output JSON when --json flag is used', async () => {
    const task = defineTask({
      name: 'json-test',
      description: 'JSON output test',
      inputSchema: z.object({}),
      outputSchema: z.object({
        message: z.string(),
        count: z.number(),
      }),
      execute: async () => ({
        message: 'Hello',
        count: 42,
      }),
    });

    const runner = new TaskRunner({ name: 'test-cli' });
    runner.register(task);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'json-test', '--json']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({
      message: 'Hello',
      count: 42,
    });

    logSpy.mockRestore();
  });

  it('should show error on validation failure', async () => {
    const task = defineTask({
      name: 'strict',
      description: 'Strict validation',
      inputSchema: z.object({
        email: z.string().email(),
      }),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    const runner = new TaskRunner({ name: 'test-cli' });
    runner.register(task);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'strict', '--param', 'email=invalid']);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
