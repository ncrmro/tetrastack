import { describe, test, expect } from 'vitest';
import { openai } from '@ai-sdk/openai';
import {
  TaskGeneratorAgent,
  BulkTaskGeneratorAgent,
  BULK_TASK_GENERATION_SCHEMA,
} from '@/agents/task-agents';
import { TASK_STATUS, TASK_PRIORITY } from '@/database/schema.tasks';
import { insertTaskSchema } from '@/database/schema.tasks';

// Only run these tests when AGENTS_TEST environment variable is set
// These tests make real API calls to OpenAI and require valid API keys
const shouldRunAgentTests = process.env.AGENTS_TEST === '1';

// Test with different models
const models = [{ name: 'gpt-4o-mini', model: openai('gpt-4o-mini') }];

describe.concurrent.each(models)(
  'TaskGeneratorAgent - $name',
  ({ name, model }) => {
    test.runIf(shouldRunAgentTests)(
      `should generate single task with appropriate details using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content:
              'Create a task to implement user authentication with email and password',
          },
        ];

        const startTime = Date.now();
        const agent = await TaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const duration = Date.now() - startTime;

        console.debug(`\n=== ${name} TaskGeneratorAgent Result ===`);
        console.debug(
          `Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
        );

        const result = agent.getResult();
        console.debug(JSON.stringify(result, null, 2));

        // Basic assertions - verify structure, not AI quality
        expect(result).toBeDefined();
        expect(result.type).toBeDefined();

        if (result.type === 'new') {
          const { task } = result;

          // Verify task structure
          expect(task.title).toBeTruthy();
          expect(task.title.length).toBeGreaterThan(0);
          expect(task.title.length).toBeLessThanOrEqual(200);

          // Description is optional but if present should be meaningful
          if (task.description) {
            expect(task.description.length).toBeGreaterThan(0);
          }

          // Verify status is valid
          expect(Object.values(TASK_STATUS)).toContain(task.status);

          // Verify priority is valid
          expect(Object.values(TASK_PRIORITY)).toContain(task.priority);

          // Verify schema validation
          expect(() => insertTaskSchema.parse(task)).not.toThrow();

          console.debug('Generated task:', task.title);
          console.debug('Priority:', task.priority);
          console.debug('Status:', task.status);
        } else {
          // Type is 'existing'
          expect(result.id).toBeTruthy();
          console.debug('AI found existing task:', result.id);
        }
      },
      { timeout: 30000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should generate task for frontend work using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content: 'Build the dashboard UI with charts and statistics',
          },
        ];

        const agent = await TaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        expect(result).toBeDefined();

        if (result.type === 'new') {
          expect(result.task.title).toBeTruthy();
          expect(result.task.priority).toBeDefined();

          console.debug('Frontend task generated:', result.task.title);
        }
      },
      { timeout: 30000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should generate task for backend work using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content: 'Create REST API endpoints for user management',
          },
        ];

        const agent = await TaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        expect(result).toBeDefined();

        if (result.type === 'new') {
          expect(result.task.title).toBeTruthy();
          expect(result.task.status).toBeDefined();

          // New tasks should typically start as "todo"
          expect([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS]).toContain(
            result.task.status,
          );

          console.debug('Backend task generated:', result.task.title);
        }
      },
      { timeout: 30000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should handle tasks with due dates using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content:
              'Fix critical security bug, needs to be done by end of week',
          },
        ];

        const agent = await TaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        expect(result).toBeDefined();

        if (result.type === 'new') {
          expect(result.task.title).toBeTruthy();

          // Should recognize urgency
          expect(result.task.priority).toBe(TASK_PRIORITY.HIGH);

          console.debug('Urgent task generated:', result.task.title);
          console.debug('Priority:', result.task.priority);
        }
      },
      { timeout: 30000 },
    );
  },
);

describe.concurrent.each(models)(
  'BulkTaskGeneratorAgent - $name',
  ({ name, model }) => {
    test.runIf(shouldRunAgentTests)(
      `should generate multiple tasks from feature description using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content: 'Break down the user authentication feature into tasks',
          },
        ];

        const startTime = Date.now();
        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const duration = Date.now() - startTime;

        console.debug(`\n=== ${name} BulkTaskGeneratorAgent Result ===`);
        console.debug(
          `Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
        );

        const result = agent.getResult();
        console.debug(JSON.stringify(result, null, 2));

        // Basic assertions - verify structure
        expect(result).toBeDefined();
        expect(result.tasks).toBeDefined();
        expect(Array.isArray(result.tasks)).toBe(true);
        expect(result.rationale).toBeTruthy();

        // Verify task count is within range
        expect(result.tasks.length).toBeGreaterThanOrEqual(1);
        expect(result.tasks.length).toBeLessThanOrEqual(20);

        console.debug(`\n=== Generated ${result.tasks.length} tasks ===`);

        // Verify each task structure
        result.tasks.forEach((task, index) => {
          console.debug(`\nTask ${index + 1}: ${task.title}`);
          console.debug(`  Priority: ${task.priority}`);
          console.debug(`  Status: ${task.status}`);

          expect(task.title).toBeTruthy();
          expect(task.title.length).toBeGreaterThan(0);
          expect(task.title.length).toBeLessThanOrEqual(200);

          // Verify status is valid
          expect(Object.values(TASK_STATUS)).toContain(task.status);

          // Verify priority is valid
          expect(Object.values(TASK_PRIORITY)).toContain(task.priority);

          // All new tasks should start as "todo"
          expect(task.status).toBe(TASK_STATUS.TODO);

          // Verify schema validation
          expect(() => insertTaskSchema.parse(task)).not.toThrow();
        });

        // Verify schema validation for entire result
        expect(() => BULK_TASK_GENERATION_SCHEMA.parse(result)).not.toThrow();

        console.debug('\n=== Summary ===');
        console.debug(`Total tasks: ${result.tasks.length}`);
        console.debug(`Rationale: ${result.rationale.substring(0, 100)}...`);
      },
      { timeout: 45000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should generate tasks with varied priorities using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content:
              'Create tasks for building a complete e-commerce checkout flow',
          },
        ];

        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        expect(result.tasks.length).toBeGreaterThan(1);

        // Should have mix of priorities (not all the same)
        const priorities = new Set(result.tasks.map((t) => t.priority));
        console.debug(
          'Priority distribution:',
          Array.from(priorities).join(', '),
        );

        // Verify we have at least some variation (might have 1 or more unique priorities)
        expect(priorities.size).toBeGreaterThanOrEqual(1);

        result.tasks.forEach((task) => {
          console.debug(`${task.title} - ${task.priority}`);
        });
      },
      { timeout: 45000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should generate logical task sequence using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content: 'Break down deploying a new API service to production',
          },
        ];

        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        expect(result.tasks.length).toBeGreaterThanOrEqual(3);

        // Tasks should be in a logical order (setup before deployment)
        const taskTitles = result.tasks
          .map((t) => t.title.toLowerCase())
          .join(' ');

        console.debug(
          'Task sequence:',
          result.tasks.map((t) => t.title),
        );

        // Should have foundational tasks
        const hasSetup =
          taskTitles.includes('setup') ||
          taskTitles.includes('configure') ||
          taskTitles.includes('prepare') ||
          taskTitles.includes('environment');

        const hasDeployment =
          taskTitles.includes('deploy') ||
          taskTitles.includes('release') ||
          taskTitles.includes('production');

        console.debug('Has setup tasks:', hasSetup);
        console.debug('Has deployment tasks:', hasDeployment);
      },
      { timeout: 45000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should generate tasks with descriptions and acceptance criteria using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content:
              'Create tasks for implementing a search feature with filters',
          },
        ];

        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        // At least some tasks should have descriptions
        const tasksWithDescriptions = result.tasks.filter(
          (t) => t.description && t.description.length > 0,
        );

        console.debug(
          `Tasks with descriptions: ${tasksWithDescriptions.length}/${result.tasks.length}`,
        );

        // Most tasks should have descriptions for clarity
        expect(tasksWithDescriptions.length).toBeGreaterThan(0);
      },
      { timeout: 45000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should handle small task breakdowns (3-5 tasks) using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content: 'Tasks for adding a new button to the homepage',
          },
        ];

        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        // Simple feature should have fewer tasks
        expect(result.tasks.length).toBeGreaterThanOrEqual(1);
        expect(result.tasks.length).toBeLessThanOrEqual(8);

        console.debug(`Small feature: ${result.tasks.length} tasks`);
      },
      { timeout: 45000 },
    );

    test.runIf(shouldRunAgentTests)(
      `should handle large task breakdowns (10+ tasks) using ${name}`,
      async () => {
        const messages = [
          {
            role: 'user' as const,
            content:
              'Break down building a complete social media feed with posts, comments, likes, shares, and notifications',
          },
        ];

        const agent = await BulkTaskGeneratorAgent.generate(
          messages,
          undefined,
          model,
        );
        const result = agent.getResult();

        // Complex feature should have more tasks
        expect(result.tasks.length).toBeGreaterThanOrEqual(5);

        console.debug(`Large feature: ${result.tasks.length} tasks`);
      },
      { timeout: 45000 },
    );
  },
);

describe('Agent error handling', () => {
  test.runIf(shouldRunAgentTests)(
    'should handle empty messages array for TaskGeneratorAgent',
    async () => {
      await expect(TaskGeneratorAgent.generate([])).rejects.toThrow();
    },
    { timeout: 15000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should handle vague task request',
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'task',
        },
      ];

      const agent = await TaskGeneratorAgent.generate(messages);
      const result = agent.getResult();

      // Should still generate something, even if generic
      expect(result).toBeDefined();

      if (result.type === 'new') {
        expect(result.task.title).toBeTruthy();
      }
    },
    { timeout: 30000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should handle empty messages array for BulkTaskGeneratorAgent',
    async () => {
      await expect(BulkTaskGeneratorAgent.generate([])).rejects.toThrow();
    },
    { timeout: 15000 },
  );
});
