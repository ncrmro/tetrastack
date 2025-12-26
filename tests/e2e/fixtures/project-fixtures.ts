/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from './base-fixtures';
import { BasePage } from '../page-objects/BasePage';
import type { TeamContext } from './base-fixtures';
import { insertProjects } from '../../../src/models/projects';
import { insertTasks } from '../../../src/models/tasks';
import {
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  type InsertProject,
} from '../../../src/database/schema.projects';
import {
  TASK_STATUS,
  TASK_PRIORITY,
  type InsertTask,
} from '../../../src/database/schema.tasks';

// Project specific context with navigation helpers
export interface ProjectPageContext extends TeamContext {
  basePage: BasePage;
  projectId?: string;
}

// Fixture types
export type ProjectFixtures = {
  // User with team and project pre-navigated to projects page
  projectPageUser: ProjectPageContext;

  // Admin with team and project pre-navigated to projects page
  projectPageAdmin: ProjectPageContext;
};

// Extend base fixtures with project specific setup
export const test = base.extend<ProjectFixtures>({
  // User with team pre-navigated to projects page
  projectPageUser: async ({ userWithTeam }, use) => {
    const basePage = new BasePage(userWithTeam.page);

    // Navigate to projects page
    await basePage.goto('/projects');

    // Verify we're on the correct page (use h1 selector to be specific)
    await expect(
      userWithTeam.page.locator('h1').filter({ hasText: 'Projects' }),
    ).toBeVisible();

    await use({
      ...userWithTeam,
      basePage,
    });
  },

  // Admin with team pre-navigated to projects page
  projectPageAdmin: async ({ adminWithTeam }, use) => {
    const basePage = new BasePage(adminWithTeam.page);

    // Navigate to projects page
    await basePage.goto('/projects');

    // Verify we're on the correct page (use h1 selector to be specific)
    await expect(
      adminWithTeam.page.locator('h1').filter({ hasText: 'Projects' }),
    ).toBeVisible();

    await use({
      ...adminWithTeam,
      basePage,
    });
  },
});

// Helper function to create a project with tasks
export async function createProjectWithTasks(params: {
  teamId: string;
  createdBy: string;
  projectData?: Partial<InsertProject>;
  taskCount?: number;
  taskData?: Partial<InsertTask>[];
}): Promise<{ projectId: string; projectSlug: string; taskIds: string[] }> {
  const {
    teamId,
    createdBy,
    projectData = {},
    taskCount = 3,
    taskData = [],
  } = params;

  // Create the project
  const [project] = await insertProjects([
    {
      title: projectData.title || 'Test Project',
      description: projectData.description || 'A test project for E2E testing',
      status: projectData.status || PROJECT_STATUS.ACTIVE,
      priority: projectData.priority || PROJECT_PRIORITY.MEDIUM,
      teamId,
      createdBy,
      ...projectData,
    },
  ]);

  // Create tasks for the project
  const tasksToCreate: Array<{
    title: string;
    projectId: string;
    description?: string | null;
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
  }> = [];

  // If no custom task data provided, create default tasks
  if (taskData.length === 0) {
    for (let i = 0; i < taskCount; i++) {
      tasksToCreate.push({
        title: `Test Task ${i + 1}`,
        description: `Description for test task ${i + 1}`,
        status: i === 0 ? TASK_STATUS.IN_PROGRESS : TASK_STATUS.TODO,
        priority: i === 0 ? TASK_PRIORITY.HIGH : TASK_PRIORITY.MEDIUM,
        projectId: project.id,
      });
    }
  } else {
    // Map taskData to ensure required fields
    taskData.forEach((task) => {
      tasksToCreate.push({
        title: task.title || 'Untitled Task',
        projectId: project.id,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
      });
    });
  }

  // Only create tasks if there are any to create
  const createdTasks =
    tasksToCreate.length > 0 ? await insertTasks(tasksToCreate) : [];
  const taskIds = createdTasks.map((t) => t.id);

  return {
    projectId: project.id,
    projectSlug: project.slug,
    taskIds,
  };
}

// Helper function to create multiple projects for testing
export async function createMultipleProjects(params: {
  count: number;
  teamId: string;
  createdBy: string;
  withTasks?: boolean;
}): Promise<string[]> {
  const { count, teamId, createdBy, withTasks = false } = params;
  const projectIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const status =
      i % 3 === 0
        ? PROJECT_STATUS.PLANNING
        : i % 3 === 1
          ? PROJECT_STATUS.ACTIVE
          : PROJECT_STATUS.COMPLETED;

    const priority =
      i % 3 === 0
        ? PROJECT_PRIORITY.HIGH
        : i % 3 === 1
          ? PROJECT_PRIORITY.MEDIUM
          : PROJECT_PRIORITY.LOW;

    const [project] = await insertProjects([
      {
        title: `Test Project ${i + 1}`,
        description: `Test project ${i + 1} for E2E testing`,
        status,
        priority,
        teamId,
        createdBy,
      },
    ]);

    projectIds.push(project.id);

    // Optionally create tasks for each project
    if (withTasks) {
      await insertTasks([
        {
          title: `Task for Project ${i + 1}`,
          description: `A task for test project ${i + 1}`,
          status: TASK_STATUS.TODO,
          priority: TASK_PRIORITY.MEDIUM,
          projectId: project.id,
        },
      ]);
    }
  }

  return projectIds;
}

export { expect } from '@playwright/test';
