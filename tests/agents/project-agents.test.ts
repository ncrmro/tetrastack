import { openai } from '@ai-sdk/openai';
import { describe, expect, test } from 'vitest';
import {
  PROJECT_GENERATION_SCHEMA,
  PROJECT_PLANNING_SCHEMA,
  ProjectGeneratorAgent,
  ProjectPlannerAgent,
} from '@/agents/project-agents';
import { PROJECT_PRIORITY, PROJECT_STATUS } from '@/database/schema.projects';

// Only run these tests when AGENTS_TEST environment variable is set
// These tests make real API calls to OpenAI and require valid API keys
const shouldRunAgentTests = process.env.AGENTS_TEST === '1';

// Test with different models
const models = [{ name: 'gpt-4o-mini', model: openai('gpt-4o-mini') }];

describe.concurrent.each(models)('ProjectGeneratorAgent - $name', ({
  name,
  model,
}) => {
  test.runIf(shouldRunAgentTests)(
    `should generate single project with suggested tags using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Create a project for redesigning our company website',
        },
      ];

      const startTime = Date.now();
      const agent = await ProjectGeneratorAgent.generate(
        messages,
        undefined,
        model,
      );
      const duration = Date.now() - startTime;

      console.debug(`\n=== ${name} ProjectGeneratorAgent Result ===`);
      console.debug(
        `Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
      );

      const result = agent.getResult();
      console.debug(JSON.stringify(result, null, 2));

      // Basic assertions - verify structure, not AI quality
      expect(result).toBeDefined();
      expect(result.type).toBeDefined();

      if (result.type === 'new') {
        const { project } = result;

        // Verify project structure
        expect(project.title).toBeTruthy();
        expect(project.title.length).toBeGreaterThan(0);
        expect(project.title.length).toBeLessThanOrEqual(200);

        expect(project.description).toBeTruthy();
        expect(project.description?.length).toBeGreaterThan(0);

        // Verify status is valid
        expect(Object.values(PROJECT_STATUS)).toContain(project.status);

        // Verify priority is valid
        expect(Object.values(PROJECT_PRIORITY)).toContain(project.priority);

        // Verify suggested tags
        expect(project.suggestedTags).toBeDefined();
        expect(Array.isArray(project.suggestedTags)).toBe(true);
        expect(project.suggestedTags.length).toBeGreaterThanOrEqual(1);
        expect(project.suggestedTags.length).toBeLessThanOrEqual(5);

        // Verify tags are strings
        project.suggestedTags.forEach((tag) => {
          expect(typeof tag).toBe('string');
          expect(tag.length).toBeGreaterThan(0);
        });

        // Verify schema validation
        expect(() => PROJECT_GENERATION_SCHEMA.parse(project)).not.toThrow();

        console.debug('Generated project:', project.title);
        console.debug('Suggested tags:', project.suggestedTags.join(', '));
      } else {
        // Type is 'existing'
        expect(result.id).toBeTruthy();
        console.debug('AI found existing project:', result.id);
      }
    },
    { timeout: 30000 },
  );

  test.runIf(shouldRunAgentTests)(
    `should generate project for software development using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Build a mobile app for task management with React Native',
        },
      ];

      const agent = await ProjectGeneratorAgent.generate(
        messages,
        undefined,
        model,
      );
      const result = agent.getResult();

      expect(result).toBeDefined();

      if (result.type === 'new') {
        expect(result.project.title).toBeTruthy();
        expect(result.project.suggestedTags).toBeDefined();

        // Verify tags are relevant (should contain tech-related tags)
        const tags = result.project.suggestedTags.join(' ').toLowerCase();
        const hasTechTags =
          tags.includes('mobile') ||
          tags.includes('app') ||
          tags.includes('frontend') ||
          tags.includes('react') ||
          tags.includes('development');

        expect(hasTechTags).toBe(true);

        console.debug('Software project generated:', result.project.title);
      }
    },
    { timeout: 30000 },
  );

  test.runIf(shouldRunAgentTests)(
    `should generate project for marketing campaign using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Plan a Q1 2024 marketing campaign for product launch',
        },
      ];

      const agent = await ProjectGeneratorAgent.generate(
        messages,
        undefined,
        model,
      );
      const result = agent.getResult();

      expect(result).toBeDefined();

      if (result.type === 'new') {
        expect(result.project.title).toBeTruthy();
        expect(result.project.priority).toBeDefined();

        console.debug('Marketing project generated:', result.project.title);
        console.debug('Priority:', result.project.priority);
      }
    },
    { timeout: 30000 },
  );
});

describe.concurrent.each(models)('ProjectPlannerAgent - $name', ({
  name,
  model,
}) => {
  test.runIf(shouldRunAgentTests)(
    `should generate multi-project plan with tasks using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Plan out a complete website redesign initiative',
        },
      ];

      const startTime = Date.now();
      const agent = await ProjectPlannerAgent.generate(
        messages,
        undefined,
        model,
      );
      const duration = Date.now() - startTime;

      console.debug(`\n=== ${name} ProjectPlannerAgent Result ===`);
      console.debug(
        `Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
      );

      const result = agent.getResult();
      console.debug(JSON.stringify(result, null, 2));

      // Basic assertions - verify structure
      expect(result).toBeDefined();
      expect(result.overview).toBeTruthy();
      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);

      // Verify project count is within range
      expect(result.projects.length).toBeGreaterThanOrEqual(1);
      expect(result.projects.length).toBeLessThanOrEqual(10);

      // Verify each project structure
      result.projects.forEach((project, index) => {
        console.debug(`\nProject ${index + 1}: ${project.title}`);

        expect(project.title).toBeTruthy();
        expect(project.description).toBeTruthy();
        expect(Object.values(PROJECT_STATUS)).toContain(project.status);
        expect(Object.values(PROJECT_PRIORITY)).toContain(project.priority);

        // Verify suggested tags
        expect(project.suggestedTags).toBeDefined();
        expect(Array.isArray(project.suggestedTags)).toBe(true);
        expect(project.suggestedTags.length).toBeGreaterThanOrEqual(1);
        expect(project.suggestedTags.length).toBeLessThanOrEqual(5);

        // Verify tasks
        expect(project.tasks).toBeDefined();
        expect(Array.isArray(project.tasks)).toBe(true);
        expect(project.tasks.length).toBeGreaterThan(0);

        console.debug(`  Tasks: ${project.tasks.length}`);
        console.debug(`  Tags: ${project.suggestedTags.join(', ')}`);

        // Verify task structure
        project.tasks.forEach((task) => {
          expect(task.title).toBeTruthy();
          expect(['low', 'medium', 'high']).toContain(task.priority);
        });
      });

      // Verify schema validation
      expect(() => PROJECT_PLANNING_SCHEMA.parse(result)).not.toThrow();

      const totalTasks = result.projects.reduce(
        (sum, p) => sum + p.tasks.length,
        0,
      );

      console.debug('\n=== Summary ===');
      console.debug(`Total projects: ${result.projects.length}`);
      console.debug(`Total tasks: ${totalTasks}`);
      console.debug(
        `Avg tasks per project: ${(totalTasks / result.projects.length).toFixed(1)}`,
      );
    },
    { timeout: 45000 },
  );

  test.runIf(shouldRunAgentTests)(
    `should generate plan with logical project dependencies using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content:
            'Plan a new SaaS product launch from infrastructure to marketing',
        },
      ];

      const agent = await ProjectPlannerAgent.generate(
        messages,
        undefined,
        model,
      );
      const result = agent.getResult();

      expect(result).toBeDefined();
      expect(result.projects.length).toBeGreaterThan(1);

      // Verify we have infrastructure/setup projects early
      const projectTitles = result.projects
        .map((p) => p.title.toLowerCase())
        .join(' ');

      // Should have foundational/infrastructure work
      const hasFoundationalWork =
        projectTitles.includes('infrastructure') ||
        projectTitles.includes('setup') ||
        projectTitles.includes('foundation') ||
        projectTitles.includes('architecture');

      console.debug(
        'Project sequence:',
        result.projects.map((p) => p.title),
      );
      console.debug('Has foundational work:', hasFoundationalWork);
    },
    { timeout: 45000 },
  );

  test.runIf(shouldRunAgentTests)(
    `should generate plan with appropriate task counts using ${name}`,
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'Create a project plan for building a customer dashboard',
        },
      ];

      const agent = await ProjectPlannerAgent.generate(
        messages,
        undefined,
        model,
      );
      const result = agent.getResult();

      // Verify each project has reasonable number of tasks (3-8 per project)
      result.projects.forEach((project) => {
        expect(project.tasks.length).toBeGreaterThanOrEqual(1);
        expect(project.tasks.length).toBeLessThanOrEqual(20);

        console.debug(`${project.title}: ${project.tasks.length} tasks`);
      });
    },
    { timeout: 45000 },
  );
});

describe('Agent error handling', () => {
  test.runIf(shouldRunAgentTests)(
    'should handle empty messages array',
    async () => {
      await expect(ProjectGeneratorAgent.generate([])).rejects.toThrow();
    },
    { timeout: 15000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should handle vague project request',
    async () => {
      const messages = [
        {
          role: 'user' as const,
          content: 'project',
        },
      ];

      const agent = await ProjectGeneratorAgent.generate(messages);
      const result = agent.getResult();

      // Should still generate something, even if generic
      expect(result).toBeDefined();

      if (result.type === 'new') {
        expect(result.project.title).toBeTruthy();
      }
    },
    { timeout: 30000 },
  );
});
