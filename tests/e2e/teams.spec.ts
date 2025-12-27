import { test, expect } from './fixtures/team-fixtures';
import { TeamsPage } from './page-objects/TeamsPage';
import { createTeamWithMembers } from './fixtures/team-fixtures';
import { createProjectWithTasks } from './fixtures/project-fixtures';
import { userFactory } from '../factories';

test.describe('Teams', () => {
  test.describe('View Team Detail', () => {
    test('should display team with projects', async ({ teamPageUser }) => {
      const { page, userId, teamId } = teamPageUser;
      const teamsPage = new TeamsPage(page);

      await test.step('Create projects for the team', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Team Project Alpha' },
          taskCount: 2,
        });

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Team Project Beta' },
          taskCount: 1,
        });
      });

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId);
      });

      await test.step('Verify team name', async () => {
        await expect(teamsPage.teamName).toBeVisible();
      });

      await test.step('Verify projects section is displayed', async () => {
        await expect(teamsPage.projectsHeading).toBeVisible();
        await expect(teamsPage.projectsGrid).toBeVisible();
      });

      await test.step('Verify projects are visible', async () => {
        await expect(page.getByText('Team Project Alpha')).toBeVisible();
        await expect(page.getByText('Team Project Beta')).toBeVisible();
      });

      await test.step('Verify project count in stats', async () => {
        const projectCount = await teamsPage.projectsStat.textContent();
        expect(parseInt(projectCount || '0')).toBeGreaterThanOrEqual(2);
      });
    });

    test('should display team with multiple members', async ({
      teamPageUser,
    }) => {
      const { page, userId } = teamPageUser;
      const teamsPage = new TeamsPage(page);

      let teamId: string;

      await test.step('Create a team with multiple members', async () => {
        const member1 = await userFactory.create();
        const member2 = await userFactory.create();

        teamId = await createTeamWithMembers({
          name: 'Multi-Member Team',
          description: 'A team with multiple members',
          memberUserIds: [member1.id, member2.id],
          adminUserIds: [userId],
        });
      });

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId);
      });

      await test.step('Verify member count shows 3', async () => {
        const memberCount = await teamsPage.membersStat.textContent();
        expect(parseInt(memberCount || '0')).toBe(3);
      });

      await test.step('Verify members section shows members', async () => {
        await expect(teamsPage.membersContainer).toBeVisible();
      });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from team to project', async ({ teamPageUser }) => {
      const { page, userId, teamId } = teamPageUser;
      const teamsPage = new TeamsPage(page);

      let projectSlug: string;

      await test.step('Create a project for the team', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Navigable Project' },
          taskCount: 1,
        });
        projectSlug = result.projectSlug;
      });

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId);
      });

      await test.step('Click on project card', async () => {
        await page.getByText('Navigable Project').click();
      });

      await test.step('Verify navigation to project page', async () => {
        await expect(page).toHaveURL(`/projects/${projectSlug}`);
        await expect(
          page.getByRole('heading', { name: 'Navigable Project' }),
        ).toBeVisible();
      });
    });
  });
});
