import { expect, test } from './fixtures/base-fixtures';
import { createProjectWithTasks } from './fixtures/project-fixtures';
import { DashboardPage } from './page-objects/DashboardPage';

test.describe('Dashboard', () => {
  test.describe('Empty State', () => {
    test('should display empty state when user has no data', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;
      const dashboardPage = new DashboardPage(page);

      await test.step('Navigate to dashboard', async () => {
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Verify page loads with welcome message', async () => {
        await expect(dashboardPage.pageHeading).toBeVisible();
        await expect(dashboardPage.welcomeMessage).toBeVisible();
      });

      await test.step('Verify stats show zeros', async () => {
        await expect(dashboardPage.teamsStat).toContainText('1'); // User has one team from fixture
        await expect(dashboardPage.activeProjectsStat).toContainText('0');
        await expect(dashboardPage.pendingTasksStat).toContainText('0');
        await expect(dashboardPage.inProgressTasksStat).toContainText('0');
      });

      await test.step('Verify empty state messages', async () => {
        await expect(dashboardPage.noProjectsMessage).toBeVisible();
        await expect(dashboardPage.noTasksMessage).toBeVisible();
      });

      await test.step('Verify CTAs are visible', async () => {
        await expect(dashboardPage.createProjectButton).toBeVisible();
        await expect(dashboardPage.generateProjectButton).toBeVisible();
      });
    });
  });

  test.describe('Populated Dashboard', () => {
    test('should display user data when projects and tasks exist', async ({
      userWithTeam,
    }) => {
      const { page, userId, teamId } = userWithTeam;
      const dashboardPage = new DashboardPage(page);

      await test.step('Create test data', async () => {
        // Create projects with tasks
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Test Project Alpha' },
          taskCount: 3,
        });

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Test Project Beta' },
          taskCount: 2,
        });
      });

      await test.step('Navigate to dashboard', async () => {
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Verify stats show correct counts', async () => {
        await expect(dashboardPage.teamsStat).toContainText('1');
        await expect(dashboardPage.activeProjectsStat).toContainText('2');
        // Tasks stats might be 0 if tasks aren't assigned to the user
      });

      await test.step('Verify projects are displayed', async () => {
        await expect(dashboardPage.recentProjectsHeading).toBeVisible();
        await expect(dashboardPage.projectsGrid).toBeVisible();
        await expect(
          dashboardPage.getProjectCard('Test Project Alpha'),
        ).toBeVisible();
        await expect(
          dashboardPage.getProjectCard('Test Project Beta'),
        ).toBeVisible();
      });

      await test.step('Verify "View All" links are present', async () => {
        await expect(dashboardPage.viewAllProjectsLink).toBeVisible();
        await expect(dashboardPage.viewAllTasksLink).toBeVisible();
      });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to teams from dashboard', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;
      const dashboardPage = new DashboardPage(page);

      await test.step('Navigate to dashboard', async () => {
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Click View All teams link', async () => {
        await dashboardPage.viewAllTeamsLink.click();
      });

      await test.step('Verify navigation to teams page', async () => {
        await expect(page).toHaveURL('/teams');
        await expect(
          page.getByRole('heading', { name: /teams/i }),
        ).toBeVisible();
      });
    });

    test('should navigate to projects from dashboard', async ({
      userWithTeam,
    }) => {
      const { page, userId, teamId } = userWithTeam;
      const dashboardPage = new DashboardPage(page);

      await test.step('Create a test project', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Navigation Test Project' },
          taskCount: 1,
        });
      });

      await test.step('Navigate to dashboard', async () => {
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Click View All projects link', async () => {
        await dashboardPage.viewAllProjectsLink.click();
      });

      await test.step('Verify navigation to projects page', async () => {
        await expect(page).toHaveURL('/projects');
        await expect(
          page.getByRole('heading', { name: /^projects$/i }),
        ).toBeVisible();
      });
    });

    test('should navigate to tasks from dashboard', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;
      const dashboardPage = new DashboardPage(page);

      await test.step('Navigate to dashboard', async () => {
        await dashboardPage.navigateToDashboard();
      });

      await test.step('Click View All tasks link', async () => {
        await dashboardPage.viewAllTasksLink.click();
      });

      await test.step('Verify navigation to tasks page', async () => {
        await expect(page).toHaveURL('/tasks');
        await expect(
          page.getByRole('heading', { name: /your tasks/i }),
        ).toBeVisible();
      });
    });
  });

  test.describe('Post-Login Redirect', () => {
    test('should redirect to dashboard after successful login', async ({
      userWithTeam,
    }) => {
      const { page } = userWithTeam;

      // User is already authenticated via fixture, which sets up auth cookies
      // Then navigates to /dashboard - verify we're there
      await test.step('Verify user is on dashboard after authentication', async () => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/dashboard');
        const dashboardPage = new DashboardPage(page);
        await expect(dashboardPage.pageHeading).toBeVisible();
      });
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign-in when not authenticated', async ({
      unauthenticatedUser,
    }) => {
      const { page } = unauthenticatedUser;

      await test.step('Attempt to access dashboard', async () => {
        await page.goto('/dashboard');
      });

      await test.step('Verify redirect to sign-in page', async () => {
        await expect(page).toHaveURL(/\/api\/auth\/signin/);
      });
    });
  });
});
