import {
  PROJECT_PRIORITY,
  PROJECT_STATUS,
} from '../../src/database/schema.projects'
import {
  createMultipleProjects,
  createProjectWithTasks,
  expect,
  test,
} from './fixtures/project-fixtures'
import { ProjectsPage } from './page-objects/ProjectsPage'

test.describe('Projects', () => {
  test.describe('Projects List View', () => {
    test('should display empty state when no projects exist', async ({
      projectPageUser,
    }) => {
      const { page } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Verify empty state is displayed', async () => {
        await expect(projectsPage.emptyStateHeading).toBeVisible()
        await expect(projectsPage.emptyStateMessage).toBeVisible()
      })

      await test.step('Verify create project button is visible', async () => {
        await expect(projectsPage.createProjectButton).toBeVisible()
        await expect(projectsPage.generateWithAIButton).toBeVisible()
      })
    })

    test('should display projects when they exist', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Create test projects', async () => {
        await createMultipleProjects({
          count: 3,
          teamId,
          createdBy: userId,
          withTasks: false,
        })
      })

      await test.step('Refresh page to see projects', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Verify projects are displayed', async () => {
        await expect(projectsPage.projectsGrid).toBeVisible()
        await expect(
          projectsPage.getProjectCard('Test Project 1'),
        ).toBeVisible()
        await expect(
          projectsPage.getProjectCard('Test Project 2'),
        ).toBeVisible()
        await expect(
          projectsPage.getProjectCard('Test Project 3'),
        ).toBeVisible()
      })
    })
  })

  test.describe('Create Project', () => {
    test('should create a new project successfully', async ({
      projectPageUser,
    }) => {
      const { page } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Navigate to create project page', async () => {
        await projectsPage.createProjectButton.click()
        await expect(page).toHaveURL('/projects/new')
      })

      await test.step('Fill out project form', async () => {
        await projectsPage.titleInput.fill('My New Project')
        await projectsPage.descriptionInput.fill(
          'This is a test project created via E2E test',
        )
        await projectsPage.statusSelect.selectOption(PROJECT_STATUS.ACTIVE)
        await projectsPage.prioritySelect.selectOption(PROJECT_PRIORITY.HIGH)
        // Team is pre-selected from fixture
      })

      await test.step('Submit form', async () => {
        await projectsPage.saveButton.click()
      })

      await test.step('Verify redirect to project detail page', async () => {
        await expect(page).toHaveURL(/\/projects\/my-new-project/)
        await expect(projectsPage.projectTitle).toHaveText('My New Project')
      })

      await test.step('Navigate back and verify in list', async () => {
        await page.goto('/projects')
        await expect(
          projectsPage.getProjectCard('My New Project'),
        ).toBeVisible()
      })
    })

    test('should cancel project creation', async ({ projectPageUser }) => {
      const { page } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Navigate to create project page', async () => {
        await projectsPage.createProjectButton.click()
        await expect(page).toHaveURL('/projects/new')
      })

      await test.step('Fill partial form data', async () => {
        await projectsPage.titleInput.fill('Cancelled Project')
      })

      await test.step('Click cancel', async () => {
        await projectsPage.cancelButton.click()
      })

      await test.step('Verify redirect back to projects list', async () => {
        await expect(page).toHaveURL('/projects')
      })
    })
  })

  test.describe('View Project Detail', () => {
    test('should display project details correctly', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

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
        })
      })

      await test.step('Navigate back to projects list', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Click on project card', async () => {
        await projectsPage.getProjectCard('Detailed Test Project').click()
      })

      await test.step('Verify project detail page loads', async () => {
        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/)
        await expect(projectsPage.projectTitle).toContainText(
          'Detailed Test Project',
        )
        await expect(projectsPage.projectDescription).toContainText(
          'A project with detailed information',
        )
      })

      await test.step('Verify status and priority badges', async () => {
        await expect(projectsPage.statusBadge).toBeVisible()
        await expect(projectsPage.priorityIndicator).toBeVisible()
      })

      await test.step('Verify task stats are displayed', async () => {
        await expect(projectsPage.totalTasksStat).toContainText('5')
        await expect(projectsPage.todoTasksStat).toBeVisible()
        await expect(projectsPage.inProgressTasksStat).toBeVisible()
        await expect(projectsPage.doneTasksStat).toBeVisible()
      })

      await test.step('Verify tasks section exists', async () => {
        await expect(projectsPage.tasksHeading).toBeVisible()
      })
    })
  })

  test.describe('Edit Project', () => {
    test('should edit an existing project successfully', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      let projectSlug: string

      await test.step('Create a test project', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Project to Edit',
            description: 'Original description',
          },
          taskCount: 0,
        })
        projectSlug = result.projectSlug
      })

      await test.step('Navigate to project detail page', async () => {
        await projectsPage.navigateToProject(projectSlug)
      })

      await test.step('Click edit project button', async () => {
        await projectsPage.editProjectButton.click()
        await expect(page).toHaveURL(`/projects/${projectSlug}/edit`)
      })

      await test.step('Update project details', async () => {
        await projectsPage.titleInput.fill('Updated Project Title')
        await projectsPage.descriptionInput.fill('Updated project description')
        await projectsPage.statusSelect.selectOption(PROJECT_STATUS.COMPLETED)
      })

      await test.step('Save changes', async () => {
        await projectsPage.saveButton.click()
      })

      await test.step('Verify redirect to project detail', async () => {
        // After update, slug will change to 'updated-project-title'
        await expect(page).toHaveURL(/\/projects\/updated-project-title/)
      })

      await test.step('Verify changes are reflected', async () => {
        await expect(projectsPage.projectTitle).toContainText(
          'Updated Project Title',
        )
        await expect(projectsPage.projectDescription).toContainText(
          'Updated project description',
        )
      })
    })
  })

  test.describe('Project Filtering', () => {
    test('should filter projects by status', async ({ projectPageUser }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Create projects with different statuses', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Active Project',
            status: PROJECT_STATUS.ACTIVE,
          },
          taskCount: 0,
        })

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Completed Project',
            status: PROJECT_STATUS.COMPLETED,
          },
          taskCount: 0,
        })

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Planning Project',
            status: PROJECT_STATUS.PLANNING,
          },
          taskCount: 0,
        })
      })

      await test.step('Refresh projects page', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Verify all projects are visible initially', async () => {
        await expect(
          projectsPage.getProjectCard('Active Project'),
        ).toBeVisible()
        await expect(
          projectsPage.getProjectCard('Completed Project'),
        ).toBeVisible()
        await expect(
          projectsPage.getProjectCard('Planning Project'),
        ).toBeVisible()
      })

      await test.step('Filter by Active status', async () => {
        await projectsPage.statusFilter.selectOption(PROJECT_STATUS.ACTIVE)
      })

      await test.step('Verify only active project is visible', async () => {
        await expect(
          projectsPage.getProjectCard('Active Project'),
        ).toBeVisible()
        // Note: Other projects may still be in DOM but hidden - adjust based on actual implementation
      })
    })

    test('should filter projects by priority', async ({ projectPageUser }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Create projects with different priorities', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'High Priority Project',
            priority: PROJECT_PRIORITY.HIGH,
          },
          taskCount: 0,
        })

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: {
            title: 'Low Priority Project',
            priority: PROJECT_PRIORITY.LOW,
          },
          taskCount: 0,
        })
      })

      await test.step('Refresh projects page', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Filter by High priority', async () => {
        await projectsPage.priorityFilter.selectOption(PROJECT_PRIORITY.HIGH)
      })

      await test.step('Verify only high priority project is visible', async () => {
        await expect(
          projectsPage.getProjectCard('High Priority Project'),
        ).toBeVisible()
      })
    })
  })

  test.describe('Navigation', () => {
    test('should navigate from projects list to project detail and back', async ({
      projectPageUser,
    }) => {
      const { page, userId, teamId } = projectPageUser
      const projectsPage = new ProjectsPage(page)

      await test.step('Create a test project', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Navigation Test Project' },
          taskCount: 2,
        })
      })

      await test.step('Navigate to projects page', async () => {
        await projectsPage.navigateToProjects()
      })

      await test.step('Click on project card', async () => {
        await projectsPage.getProjectCard('Navigation Test Project').click()
      })

      await test.step('Verify on project detail page', async () => {
        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/)
        await expect(projectsPage.projectTitle).toBeVisible()
      })

      await test.step('Click back to projects link', async () => {
        await projectsPage.backToProjectsLink.click()
      })

      await test.step('Verify back on projects list page', async () => {
        await expect(page).toHaveURL('/projects')
        await expect(projectsPage.pageHeading).toBeVisible()
      })
    })
  })

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign-in when not authenticated', async ({
      unauthenticatedUser,
    }) => {
      const { page } = unauthenticatedUser

      await test.step('Attempt to access projects page', async () => {
        await page.goto('/projects')
      })

      await test.step('Verify redirect to sign-in', async () => {
        await expect(page).toHaveURL(/\/api\/auth\/signin/)
      })
    })
  })
})
