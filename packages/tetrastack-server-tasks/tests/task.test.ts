import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { defineTask } from '../src/task.js';

describe('defineTask', () => {
  it('should create a valid task', () => {
    const task = defineTask({
      name: 'test-task',
      description: 'A test task',
      inputSchema: z.object({ name: z.string() }),
      outputSchema: z.object({ result: z.string() }),
      execute: async (input) => ({ result: `Hello ${input.name}` }),
    });

    expect(task.name).toBe('test-task');
    expect(task.description).toBe('A test task');
    expect(task.inputSchema).toBeDefined();
    expect(task.outputSchema).toBeDefined();
  });

  it('should throw if name is missing', () => {
    expect(() =>
      defineTask({
        name: '',
        description: 'Test',
        inputSchema: z.object({}),
        outputSchema: z.object({}),
        execute: async () => ({}),
      }),
    ).toThrow('Task name must be a non-empty string');
  });

  it('should throw if inputSchema is missing', () => {
    expect(() =>
      defineTask({
        name: 'test',
        description: 'Test',
        inputSchema: null as never,
        outputSchema: z.object({}),
        execute: async () => ({}),
      }),
    ).toThrow('Task inputSchema is required');
  });

  it('should throw if outputSchema is missing', () => {
    expect(() =>
      defineTask({
        name: 'test',
        description: 'Test',
        inputSchema: z.object({}),
        outputSchema: null as never,
        execute: async () => ({}),
      }),
    ).toThrow('Task outputSchema is required');
  });

  it('should throw if execute is not a function', () => {
    expect(() =>
      defineTask({
        name: 'test',
        description: 'Test',
        inputSchema: z.object({}),
        outputSchema: z.object({}),
        execute: null as never,
      }),
    ).toThrow('Task execute must be a function');
  });

  it('should validate and execute successfully', async () => {
    const task = defineTask({
      name: 'greet',
      description: 'Greet user',
      inputSchema: z.object({ name: z.string() }),
      outputSchema: z.object({ message: z.string() }),
      execute: async (input) => ({ message: `Hello ${input.name}` }),
    });

    const result = await task.run({ name: 'John' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ message: 'Hello John' });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should return error on invalid input', async () => {
    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({ age: z.number() }),
      outputSchema: z.object({ result: z.string() }),
      execute: async (input) => ({ result: `Age: ${input.age}` }),
    });

    const result = await task.run({ age: 'invalid' });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Expected number');
  });

  it('should return error on invalid output', async () => {
    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({ count: z.number() }),
      execute: async () => ({ count: 'not a number' }) as never,
    });

    const result = await task.run({});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should catch execution errors', async () => {
    const task = defineTask({
      name: 'fail',
      description: 'Failing task',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => {
        throw new Error('Task failed');
      },
    });

    const result = await task.run({});

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Task failed');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should measure execution duration', async () => {
    const task = defineTask({
      name: 'sleep',
      description: 'Sleep task',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {};
      },
    });

    const result = await task.run({});

    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(50);
  });

  it('should pass context to execute function', async () => {
    let contextReceived = false;

    const task = defineTask({
      name: 'context-test',
      description: 'Test context',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async (_, context) => {
        contextReceived = true;
        expect(context.verbose).toBeDefined();
        expect(context.isDocker).toBeDefined();
        expect(context.progress).toBeTypeOf('function');
        expect(context.log).toBeTypeOf('function');
        return {};
      },
    });

    await task.run({}, { verbose: true });
    expect(contextReceived).toBe(true);
  });

  it('should be frozen after creation', () => {
    const task = defineTask({
      name: 'test',
      description: 'Test',
      inputSchema: z.object({}),
      outputSchema: z.object({}),
      execute: async () => ({}),
    });

    expect(Object.isFrozen(task)).toBe(true);
  });
});
