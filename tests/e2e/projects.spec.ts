import { test, expect } from './fixtures/project-fixtures';
import { ProjectsPage } from './page-objects/ProjectsPage';
import { createProjectWithTasks } from './fixtures/project-fixtures';
import {
  PROJECT_STATUS,
  PROJECT_PRIORITY,
} from '../../src/database/schema.projects';

test.describe('Projects', () => {
  test.describe('Create Project', () => {
    test('should create a new project successfully', async ({
      projectPageUser,
    }) => {
      const { page } = projectPageUser;
      const projectsPage = new ProjectsPage(page);

      await test.step('Navigate to create project page', async () => {
        await projectsPage.createProjectButton.click();
        await expect(page).toHaveURL('/projects/new');
      });

      await test.step('Fill out project form', async () => {
        await projectsPage.titleInput.fill('My New Project');
        await projectsPage.descriptionInput.fill(
          'This is a test project created via E2E test',
        );
        await projectsPage.statusSelect.selectOption(PROJECT_STATUS.ACTIVE);
        await projectsPage.prioritySelect.selectOption(PROJECT_PRIORITY.HIGH);
      });

      await test.step('Submit form', async () => {
        await projectsPage.saveButton.click();
      });

      await test.step('Verify redirect to project detail page', async () => {
        await expect(page).toHaveURL(/\/projects\/my-new-project/);
        await expect(projectsPage.projectTitle).toHaveText('My New Project');
      });

      await test.step('Navigate back and verify in list', async () => {
        await page.goto('/projects');
        await expect(
          projectsPage.getProjectCard('My New Project'),
        ).toBeVisible();
      });
    });
  });

  test.describe('View Project Detail', () => {
    test('should display project details correctly', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser;
      const projectsPage = new ProjectsPage(page);

      await test.step('Create a test project with tasks', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Detailed Test Project',
            description: 'A project with detailed information',
            status: PROJECT_STATUS.ACTIVE,
            priority: PROJECT_PRIORITY.HIGH,
          },
          taskCount: 5,
        });
      });

      await test.step('Navigate back to projects list', async () => {
        await projectsPage.navigateToProjects();
      });

      await test.step('Click on project card', async () => {
        await projectsPage.getProjectCard('Detailed Test Project').click();
      });

      await test.step('Verify project detail page loads', async () => {
        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/);
        await expect(projectsPage.projectTitle).toContainText(
          'Detailed Test Project',
        );
        await expect(projectsPage.projectDescription).toContainText(
          'A project with detailed information',
        );
      });

      await test.step('Verify task stats are displayed', async () => {
        await expect(projectsPage.totalTasksStat).toContainText('5');
      });
    });
  });

  test.describe('Edit Project', () => {
    test('should edit an existing project successfully', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser;
      const projectsPage = new ProjectsPage(page);

      let projectSlug: string;

      await test.step('Create a test project', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Project to Edit',
            description: 'Original description',
          },
          taskCount: 0,
        });
        projectSlug = result.projectSlug;
      });

      await test.step('Navigate to project detail page', async () => {
        await projectsPage.navigateToProject(projectSlug);
      });

      await test.step('Click edit project button', async () => {
        await projectsPage.editProjectButton.click();
        await expect(page).toHaveURL(`/projects/${projectSlug}/edit`);
      });

      await test.step('Update project details', async () => {
        await projectsPage.titleInput.fill('Updated Project Title');
        await projectsPage.descriptionInput.fill('Updated project description');
        await projectsPage.statusSelect.selectOption(PROJECT_STATUS.COMPLETED);
      });

      await test.step('Save changes', async () => {
        await projectsPage.saveButton.click();
      });

      await test.step('Verify redirect to project detail', async () => {
        await expect(page).toHaveURL(/\/projects\/updated-project-title/);
      });

      await test.step('Verify changes are reflected', async () => {
        await expect(projectsPage.projectTitle).toContainText(
          'Updated Project Title',
        );
        await expect(projectsPage.projectDescription).toContainText(
          'Updated project description',
        );
      });
    });
  });
});
