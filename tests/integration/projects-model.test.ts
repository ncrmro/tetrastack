/**
 * Integration tests for projects model functions
 * Tests database persistence, slug generation, and tag management for projects
 */

import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '@/database';
import {
  PROJECT_PRIORITY,
  PROJECT_STATUS,
  projects,
  projectTags,
} from '@/database/schema.projects';
import {
  addProjectTags,
  deleteProjects,
  getProjects,
  getProjectWithTags,
  insertProjects,
  removeProjectTags,
  updateProjects,
} from '@/models/projects';
import { projectFactory, tagFactory, teamFactory } from '../factories';

describe('getProjects', () => {
  it('should get projects by IDs using WHERE IN', async () => {
    const project1 = await projectFactory.create();
    const project2 = await projectFactory.create();
    const project3 = await projectFactory.create();

    const result = await getProjects({ ids: [project1.id, project2.id] });

    expect(result).toHaveLength(2);
    const resultIds = result.map((p) => p.id);
    expect(resultIds).toContain(project1.id);
    expect(resultIds).toContain(project2.id);
    expect(resultIds).not.toContain(project3.id);
  });

  it('should get projects by team IDs', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();
    const project1 = await projectFactory.create({ teamId: team1.id });
    const project2 = await projectFactory.create({ teamId: team2.id });

    const result = await getProjects({ teamIds: [team1.id] });

    const resultIds = result.map((p) => p.id);
    expect(resultIds).toContain(project1.id);
    expect(resultIds).not.toContain(project2.id);
  });

  it('should get projects by status', async () => {
    await projectFactory.planning().create();
    await projectFactory.active().create();

    const result = await getProjects({ status: [PROJECT_STATUS.ACTIVE] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((project) => {
      expect(project.status).toBe(PROJECT_STATUS.ACTIVE);
    });
  });

  it('should get projects by priority', async () => {
    await projectFactory.highPriority().create();
    await projectFactory.lowPriority().create();

    const result = await getProjects({ priority: [PROJECT_PRIORITY.HIGH] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((project) => {
      expect(project.priority).toBe(PROJECT_PRIORITY.HIGH);
    });
  });

  it('should combine multiple filters', async () => {
    const team = await teamFactory.create();
    const activeHighPriority = await projectFactory
      .active()
      .highPriority()
      .create({ teamId: team.id });
    await projectFactory.planning().create({ teamId: team.id });

    const result = await getProjects({
      teamIds: [team.id],
      status: [PROJECT_STATUS.ACTIVE],
      priority: [PROJECT_PRIORITY.HIGH],
    });

    const resultIds = result.map((p) => p.id);
    expect(resultIds).toContain(activeHighPriority.id);
  });

  it('should get projects by slugs', async () => {
    const project1 = await projectFactory.create({
      title: 'Website Redesign',
    });
    const project2 = await projectFactory.create({
      title: 'Mobile App',
    });

    const result = await getProjects({ slugs: [project1.slug] });

    expect(result.some((p) => p.id === project1.id)).toBe(true);
    expect(result.some((p) => p.id === project2.id)).toBe(false);
  });
});

describe('insertProjects', () => {
  it('should create a single project with auto-generated slug', async () => {
    const team = await teamFactory.create();

    const result = await insertProjects([
      {
        title: 'Website Redesign Project',
        description: 'Complete website overhaul',
        teamId: team.id,
        status: PROJECT_STATUS.PLANNING,
        priority: PROJECT_PRIORITY.HIGH,
        createdBy: 1,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Website Redesign Project');
    expect(result[0].slug).toBe('website-redesign-project');
    expect(result[0].teamId).toBe(team.id);
  });

  it('should create multiple projects in bulk', async () => {
    const team = await teamFactory.create();

    const result = await insertProjects([
      { title: 'Project 1', teamId: team.id, createdBy: 1 },
      { title: 'Project 2', teamId: team.id, createdBy: 1 },
      { title: 'Project 3', teamId: team.id, createdBy: 1 },
    ]);

    expect(result).toHaveLength(3);
    expect(result[0].slug).toBe('project-1');
    expect(result[1].slug).toBe('project-2');
    expect(result[2].slug).toBe('project-3');
  });

  it('should generate unique slugs for duplicate titles', async () => {
    const team = await teamFactory.create();

    const result = await insertProjects([
      { title: 'Website Redesign', teamId: team.id, createdBy: 1 },
      { title: 'Website Redesign', teamId: team.id, createdBy: 1 },
      { title: 'Website Redesign', teamId: team.id, createdBy: 1 },
    ]);

    expect(result).toHaveLength(3);
    // Verify all slugs are unique and follow the pattern
    const slugs = result.map((p) => p.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(3); // All slugs are unique

    // Verify slugs start with base and have sequential numbers if needed
    expect(result[0].slug).toMatch(/^website-redesign(-\d+)?$/);
    expect(result[1].slug).toMatch(/^website-redesign-\d+$/);
    expect(result[2].slug).toMatch(/^website-redesign-\d+$/);
  });

  it('should create project using factory defaults', async () => {
    const result = await projectFactory.create();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.slug).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create project using factory traits', async () => {
    const planning = await projectFactory.planning().create();
    const active = await projectFactory.active().create();
    const completed = await projectFactory.completed().create();

    expect(planning.status).toBe(PROJECT_STATUS.PLANNING);
    expect(active.status).toBe(PROJECT_STATUS.ACTIVE);
    expect(completed.status).toBe(PROJECT_STATUS.COMPLETED);
  });
});

describe('updateProject', () => {
  it('should update project fields', async () => {
    const project = await projectFactory.create();

    const [result] = await updateProjects([eq(projects.id, project.id)], {
      description: 'Updated description',
      priority: PROJECT_PRIORITY.HIGH,
    });

    expect(result.id).toBe(project.id);
    expect(result.description).toBe('Updated description');
    expect(result.priority).toBe(PROJECT_PRIORITY.HIGH);
  });

  it('should regenerate slug when title is updated', async () => {
    const project = await projectFactory.create({
      title: 'Original Title',
    });

    const [result] = await updateProjects([eq(projects.id, project.id)], {
      title: 'New Title',
    });

    expect(result.title).toBe('New Title');
    expect(result.slug).toBe('new-title');
    expect(result.slug).not.toBe(project.slug);
  });

  it('should ensure unique slug when updating to duplicate title', async () => {
    await projectFactory.create({ title: 'Existing Project' });
    const project = await projectFactory.create({
      title: 'Other Project',
    });

    const [result] = await updateProjects([eq(projects.id, project.id)], {
      title: 'Existing Project',
    });

    expect(result.title).toBe('Existing Project');
    expect(result.slug).toBe('existing-project-2');
  });
});

describe('deleteProject', () => {
  it('should delete project from database', async () => {
    const project = await projectFactory.create();

    await deleteProjects([eq(projects.id, project.id)]);

    const found = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
    });

    expect(found).toBeUndefined();
  });

  it('should cascade delete project tags', async () => {
    const team = await teamFactory.create();
    const tag = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });
    await addProjectTags(project.id, [tag.id]);

    await deleteProjects([eq(projects.id, project.id)]);

    const tags = await db.query.projectTags.findMany({
      where: eq(projectTags.projectId, project.id),
    });

    expect(tags).toHaveLength(0);
  });
});

describe('getProjectWithTags', () => {
  it('should return project with tags relation', async () => {
    const team = await teamFactory.create();
    const tag1 = await tagFactory.create({ teamId: team.id });
    const tag2 = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });
    await addProjectTags(project.id, [tag1.id, tag2.id]);

    const result = await getProjectWithTags(project.id);

    expect(result).toBeDefined();
    expect(result?.tags).toHaveLength(2);
    expect(result?.tags[0].tag).toBeDefined();
  });

  it('should return project with empty tags array if no tags', async () => {
    const project = await projectFactory.create();

    const result = await getProjectWithTags(project.id);

    expect(result).toBeDefined();
    expect(result?.tags).toHaveLength(0);
  });

  it('should return undefined for non-existent project', async () => {
    const result = await getProjectWithTags('non-existent-id');

    expect(result).toBeUndefined();
  });
});

describe('addProjectTags', () => {
  it('should add tags to project', async () => {
    const team = await teamFactory.create();
    const tag1 = await tagFactory.create({ teamId: team.id });
    const tag2 = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });

    await addProjectTags(project.id, [tag1.id, tag2.id]);

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(2);
    const tagIds = result?.tags.map((t) => t.tagId);
    expect(tagIds).toContain(tag1.id);
    expect(tagIds).toContain(tag2.id);
  });

  it('should skip duplicate tags', async () => {
    const team = await teamFactory.create();
    const tag = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });

    await addProjectTags(project.id, [tag.id]);
    await addProjectTags(project.id, [tag.id]); // Add same tag again

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(1);
  });

  it('should handle empty tag array', async () => {
    const project = await projectFactory.create();

    await addProjectTags(project.id, []);

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(0);
  });
});

describe('removeProjectTags', () => {
  it('should remove tags from project', async () => {
    const team = await teamFactory.create();
    const tag1 = await tagFactory.create({ teamId: team.id });
    const tag2 = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });
    await addProjectTags(project.id, [tag1.id, tag2.id]);

    await removeProjectTags(project.id, [tag1.id]);

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(1);
    expect(result?.tags[0].tagId).toBe(tag2.id);
  });

  it('should handle removing non-existent tags', async () => {
    const project = await projectFactory.create();

    await removeProjectTags(project.id, ['non-existent-tag-id']);

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(0);
  });

  it('should handle empty tag array', async () => {
    const team = await teamFactory.create();
    const tag = await tagFactory.create({ teamId: team.id });
    const project = await projectFactory.create({ teamId: team.id });
    await addProjectTags(project.id, [tag.id]);

    await removeProjectTags(project.id, []);

    const result = await getProjectWithTags(project.id);

    expect(result?.tags).toHaveLength(1);
  });
});

describe('Edge cases', () => {
  it('should handle empty title validation at database level', async () => {
    await expect(
      insertProjects([{ title: '', teamId: 'team-id', createdBy: 1 }]),
    ).rejects.toThrow();
  });
});
