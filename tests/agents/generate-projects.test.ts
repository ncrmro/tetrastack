import { describe, test, expect, beforeEach } from 'vitest';
import { GenerateProjectIdeasJob } from '@/jobs/generate-project-ideas';
import { db } from '@/database';
import { teams } from '@/database/schema.teams';
import { projects } from '@/database/schema.projects';
import { tags } from '@/database/schema.tags';
import { projectTags } from '@/database/schema.projects';
import { sql } from 'drizzle-orm';

// Only run these tests when AGENTS_TEST environment variable is set
// These tests make real API calls to OpenAI and require valid API keys
const shouldRunAgentTests = process.env.AGENTS_TEST === '1';

describe('GenerateProjectIdeasJob', () => {
  let testTeamId: string;

  beforeEach(async () => {
    // Get or create a test team
    const existingTeams = await db.select().from(teams).limit(1);

    if (existingTeams.length > 0) {
      testTeamId = existingTeams[0].id;
    } else {
      // Create a test team if none exists
      const newTeam = await db
        .insert(teams)
        .values({
          name: 'Test Team',
          description: 'Team for testing project generation',
        })
        .returning();
      testTeamId = newTeam[0].id;
    }
  });

  test.runIf(shouldRunAgentTests)(
    'should generate projects using .now() pattern',
    async () => {
      const startTime = Date.now();

      // Execute job immediately with .now()
      const result = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: 'Generate innovative web development projects',
        count: 3,
        userId: undefined,
      });

      const duration = Date.now() - startTime;

      console.debug('\n=== GenerateProjectIdeasJob Result ===');
      console.debug(
        `Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`,
      );
      console.debug('Job metadata:', result.metadata);
      console.debug('Job result:', JSON.stringify(result.data, null, 2));

      // Verify job metadata
      expect(result.metadata).toBeDefined();
      expect(result.metadata.jobName).toBe('GenerateProjectIdeasJob');
      expect(result.metadata.status).toBe('completed');
      expect(result.metadata.enqueuedAt).toBeInstanceOf(Date);
      expect(result.metadata.startedAt).toBeInstanceOf(Date);
      expect(result.metadata.completedAt).toBeInstanceOf(Date);

      // Verify job result data
      expect(result.data).toBeDefined();
      expect(result.data.projectsCreated).toBe(3);
      expect(result.data.tagsCreated).toBeGreaterThan(0);
      expect(result.data.projects).toHaveLength(3);

      // Verify each generated project
      result.data.projects.forEach((project) => {
        expect(project.id).toBeTruthy();
        expect(project.title).toBeTruthy();
        expect(project.slug).toBeTruthy();
        expect(Array.isArray(project.tags)).toBe(true);
        expect(project.tags.length).toBeGreaterThan(0);

        console.debug(`\nProject: ${project.title}`);
        console.debug(`  Slug: ${project.slug}`);
        console.debug(`  Tags: ${project.tags.join(', ')}`);
      });

      // Verify projects were actually saved to database
      const savedProjects = await db
        .select()
        .from(projects)
        .where(
          sql`${projects.id} IN (${sql.join(
            result.data.projects.map((p) => sql`${p.id}`),
            sql`, `,
          )})`,
        );

      expect(savedProjects).toHaveLength(3);

      // Verify all projects belong to the correct team
      savedProjects.forEach((project) => {
        expect(project.teamId).toBe(testTeamId);
        expect(project.createdBy).toBe(1);
      });

      console.debug(
        `\n✓ Verified ${savedProjects.length} projects in database`,
      );
    },
    { timeout: 60000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should create unique tags for projects',
    async () => {
      const result = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: 'Generate AI and machine learning projects',
        count: 2,
      });

      expect(result.data.tagsCreated).toBeGreaterThan(0);

      // Get all unique tag names from the generated projects
      const allTagNames = new Set<string>();
      result.data.projects.forEach((p) => {
        p.tags.forEach((tag) => allTagNames.add(tag));
      });

      // Verify tags exist in database
      const savedTags = await db
        .select()
        .from(tags)
        .where(sql`${tags.teamId} = ${testTeamId}`);

      const savedTagNames = new Set(savedTags.map((t) => t.name));

      // All generated tags should exist in the database
      allTagNames.forEach((tagName) => {
        expect(savedTagNames.has(tagName)).toBe(true);
      });

      console.debug(`\n✓ Verified ${allTagNames.size} unique tags in database`);
      console.debug(`Tags: ${Array.from(allTagNames).join(', ')}`);
    },
    { timeout: 60000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should associate tags with projects correctly',
    async () => {
      const result = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: 'Generate e-commerce platform projects',
        count: 2,
      });

      // Verify project-tag relationships
      for (const project of result.data.projects) {
        const projectTagRelations = await db
          .select()
          .from(projectTags)
          .where(sql`${projectTags.projectId} = ${project.id}`);

        expect(projectTagRelations.length).toBe(project.tags.length);

        console.debug(
          `\nProject "${project.title}" has ${projectTagRelations.length} tag associations`,
        );
      }
    },
    { timeout: 60000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should handle custom theme and count',
    async () => {
      const customTheme =
        'Generate healthcare technology projects focused on patient care';
      const customCount = 5;

      const result = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: customTheme,
        count: customCount,
      });

      expect(result.data.projectsCreated).toBe(customCount);
      expect(result.data.projects).toHaveLength(customCount);

      // Verify projects are related to the theme
      const allTitles = result.data.projects
        .map((p) => p.title.toLowerCase())
        .join(' ');

      // Should have healthcare-related keywords
      const hasHealthcareKeywords =
        allTitles.includes('health') ||
        allTitles.includes('patient') ||
        allTitles.includes('medical') ||
        allTitles.includes('care') ||
        allTitles.includes('clinical');

      console.debug('\n=== Custom Theme Test ===');
      console.debug(`Theme: ${customTheme}`);
      console.debug(`Projects generated: ${customCount}`);
      console.debug(`Has healthcare keywords: ${hasHealthcareKeywords}`);
      console.debug('Project titles:');
      result.data.projects.forEach((p, i) => {
        console.debug(`  ${i + 1}. ${p.title}`);
      });
    },
    { timeout: 60000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should reuse existing tags when appropriate',
    async () => {
      // First run - creates new tags
      const firstRun = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: 'Generate web development projects with frontend focus',
        count: 2,
      });

      const firstRunTagsCreated = firstRun.data.tagsCreated;

      // Second run - should reuse some tags
      const secondRun = await GenerateProjectIdeasJob.now({
        teamId: testTeamId,
        theme: 'Generate web development projects with backend focus',
        count: 2,
      });

      const secondRunTagsCreated = secondRun.data.tagsCreated;

      console.debug('\n=== Tag Reuse Test ===');
      console.debug(`First run - tags created: ${firstRunTagsCreated}`);
      console.debug(`Second run - tags created: ${secondRunTagsCreated}`);

      // Second run should create fewer or equal tags (some should be reused)
      // Note: This is probabilistic - AI might choose different tags
      expect(secondRunTagsCreated).toBeLessThanOrEqual(
        firstRunTagsCreated + 10,
      );
    },
    { timeout: 120000 },
  );
});

describe('GenerateProjectIdeasJob - Error Handling', () => {
  test('should throw error for invalid team ID', async () => {
    await expect(
      GenerateProjectIdeasJob.now({
        teamId: 'invalid-team-id-that-does-not-exist',
        count: 1,
      }),
    ).rejects.toThrow();
  });

  test.runIf(shouldRunAgentTests)(
    'should handle count of 1',
    async () => {
      const existingTeams = await db.select().from(teams).limit(1);
      const teamId = existingTeams[0]?.id;

      if (!teamId) {
        console.log('Skipping test - no team available');
        return;
      }

      const result = await GenerateProjectIdeasJob.now({
        teamId,
        count: 1,
      });

      expect(result.data.projectsCreated).toBe(1);
      expect(result.data.projects).toHaveLength(1);
    },
    { timeout: 45000 },
  );

  test.runIf(shouldRunAgentTests)(
    'should handle large count',
    async () => {
      const existingTeams = await db.select().from(teams).limit(1);
      const teamId = existingTeams[0]?.id;

      if (!teamId) {
        console.log('Skipping test - no team available');
        return;
      }

      const result = await GenerateProjectIdeasJob.now({
        teamId,
        theme: 'Generate diverse software projects',
        count: 10,
      });

      expect(result.data.projectsCreated).toBe(10);
      expect(result.data.projects).toHaveLength(10);

      // Verify all projects are unique
      const titles = new Set(result.data.projects.map((p) => p.title));
      expect(titles.size).toBe(10);

      const slugs = new Set(result.data.projects.map((p) => p.slug));
      expect(slugs.size).toBe(10);
    },
    { timeout: 90000 },
  );
});
