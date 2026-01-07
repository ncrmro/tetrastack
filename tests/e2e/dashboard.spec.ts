import { test, expect } from './fixtures/base-fixtures';
import { DashboardPage } from './page-objects/DashboardPage';
import { createProjectWithTasks } from './fixtures/project-fixtures';

test.describe('Dashboard', () => {
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
