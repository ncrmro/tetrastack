import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { TaskRunner } from '../src/runner.js';
import { defineTask } from '../src/task.js';

describe('TaskRunner', () => {
  let originalExit: typeof process.exit;

  beforeEach(() => {
    // Mock process.exit
    originalExit = process.exit;
    process.exit = vi.fn() as never;
  });

  afterEach(() => {
    // Restore process.exit
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  it('should create runner with config', () => {
    const runner = new TaskRunner({
      name: 'test-cli',
      version: '1.0.0',
      description: 'Test CLI',
    });

    expect(runner).toBeDefined();
  });

  it('should register a task', () => {
    const runner = new TaskRunner({ name: 'test-cli' });
    const task = defineTask({
      name: 'hello',
      description: 'Say hello',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(() => runner.register(task)).not.toThrow();
  });

  it('should throw when registering duplicate task name', () => {
    const runner = new TaskRunner({ name: 'test-cli' });
    const task1 = defineTask({
      name: 'duplicate',
      description: 'First',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });
    const task2 = defineTask({
      name: 'duplicate',
      description: 'Second',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    runner.register(task1);
    expect(() => runner.register(task2)).toThrow('already registered');
  });

  it('should be chainable', () => {
    const runner = new TaskRunner({ name: 'test-cli' });
    const task1 = defineTask({
      name: 'task1',
      description: 'Task 1',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });
    const task2 = defineTask({
      name: 'task2',
      description: 'Task 2',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(() => runner.register(task1).register(task2)).not.toThrow();
  });

  it('should run task with params', async () => {
    const runner = new TaskRunner({ name: 'test-cli' });
    const executeMock = vi.fn(async (input: { name: string }) => ({
      message: `Hello ${input.name}`,
    }));

    const task = defineTask({
      name: 'greet',
      description: 'Greet user',
      inputSchema: z.object({ name: z.string() }),
      outputSchema: z.object({ message: z.string() }),
      execute: executeMock,
    });

    runner.register(task);

    // Mock console.log to capture output
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'greet', '--param', 'name=John']);

    expect(executeMock).toHaveBeenCalledWith(
      { name: 'John' },
      expect.objectContaining({
        verbose: expect.any(Boolean),
        isDocker: expect.any(Boolean),
      }),
    );

    logSpy.mockRestore();
  });

  it('should handle --verbose flag', async () => {
    const runner = new TaskRunner({ name: 'test-cli' });
    let receivedVerbose = false;

    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async (_, context) => {
        receivedVerbose = context.verbose;
        return {};
      },
    });

    runner.register(task);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'test', '--verbose']);

    expect(receivedVerbose).toBe(true);

    logSpy.mockRestore();
  });

  it('should handle --json flag', async () => {
    const runner = new TaskRunner({ name: 'test-cli' });

    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({ result: z.string() }),
      execute: async () => ({ result: 'success' }),
    });

    runner.register(task);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'test', '--json']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();

    logSpy.mockRestore();
  });

  it('should exit with 0 on success', async () => {
    const runner = new TaskRunner({ name: 'test-cli' });

    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    runner.register(task);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'test']);

    expect(process.exit).toHaveBeenCalledWith(0);

    logSpy.mockRestore();
  });

  it('should exit with 1 on failure', async () => {
    const runner = new TaskRunner({ name: 'test-cli' });

    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => {
        throw new Error('Task failed');
      },
    });

    runner.register(task);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await runner.run(['node', 'cli', 'test']);

    expect(process.exit).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
  });
});
