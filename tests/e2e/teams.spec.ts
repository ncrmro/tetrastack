import { userFactory } from '../factories'
import { createProjectWithTasks } from './fixtures/project-fixtures'
import {
  createMultipleTeams,
  createTeamWithMembers,
  expect,
  test,
} from './fixtures/team-fixtures'
import { TeamsPage } from './page-objects/TeamsPage'

test.describe('Teams', () => {
  test.describe('Teams List View', () => {
    test('should display user teams', async ({ teamPageUser }) => {
      const { page } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Verify page heading and subheading', async () => {
        await expect(teamsPage.pageHeading).toBeVisible()
        await expect(teamsPage.pageSubheading).toBeVisible()
      })

      await test.step('Verify teams grid is visible', async () => {
        await expect(teamsPage.teamsGrid).toBeVisible()
      })

      await test.step('Verify user team is displayed', async () => {
        // User has a team from the fixture - verify it's visible
        const teamCards = page.locator('a[href^="/teams/"]')
        await expect(teamCards.first()).toBeVisible()
      })
    })

    test('should display multiple teams when user belongs to several', async ({
      teamPageUser,
    }) => {
      const { page, userId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Create additional teams', async () => {
        await createMultipleTeams({
          count: 2,
          baseUserId: userId,
        })
      })

      await test.step('Refresh teams page', async () => {
        await teamsPage.navigateToTeams()
      })

      await test.step('Verify multiple teams are displayed', async () => {
        const teamCards = page.locator('[data-testid="team-card"]')
        await expect(teamCards).toHaveCount(3) // 1 from fixture + 2 created
      })
    })
  })

  test.describe('View Team Detail', () => {
    test('should display team details with members and stats', async ({
      teamPageUser,
    }) => {
      const { page, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Verify team name and description', async () => {
        await expect(teamsPage.teamName).toBeVisible()
        // Description may or may not be visible depending on if it's set
      })

      await test.step('Verify team stats are displayed', async () => {
        await expect(teamsPage.membersStat).toBeVisible()
        await expect(teamsPage.projectsStat).toBeVisible()
        await expect(teamsPage.activeProjectsStat).toBeVisible()
      })

      await test.step('Verify members section is displayed', async () => {
        await expect(teamsPage.membersHeading).toBeVisible()
        await expect(teamsPage.membersContainer).toBeVisible()
      })

      await test.step('Verify member count shows at least 1', async () => {
        const memberCount = await teamsPage.membersStat.textContent()
        expect(parseInt(memberCount || '0', 10)).toBeGreaterThanOrEqual(1)
      })
    })

    test('should display team projects when they exist', async ({
      teamPageUser,
    }) => {
      const { page, userId, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Create projects for the team', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Team Project Alpha' },
          taskCount: 2,
        })

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Team Project Beta' },
          taskCount: 1,
        })
      })

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Verify projects section is displayed', async () => {
        await expect(teamsPage.projectsHeading).toBeVisible()
        await expect(teamsPage.projectsGrid).toBeVisible()
      })

      await test.step('Verify projects are visible', async () => {
        await expect(page.getByText('Team Project Alpha')).toBeVisible()
        await expect(page.getByText('Team Project Beta')).toBeVisible()
      })

      await test.step('Verify project count in stats', async () => {
        const projectCount = await teamsPage.projectsStat.textContent()
        expect(parseInt(projectCount || '0', 10)).toBeGreaterThanOrEqual(2)
      })
    })

    test('should display multiple team members with roles', async ({
      teamPageUser,
    }) => {
      const { page, userId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      let teamId: string

      await test.step('Create a team with multiple members', async () => {
        // Create additional users for the team
        const member1 = await userFactory.create()
        const member2 = await userFactory.create()

        teamId = await createTeamWithMembers({
          name: 'Multi-Member Team',
          description: 'A team with multiple members',
          memberUserIds: [member1.id, member2.id],
          adminUserIds: [userId], // Test user is admin
        })
      })

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Verify member count shows 3', async () => {
        const memberCount = await teamsPage.membersStat.textContent()
        expect(parseInt(memberCount || '0', 10)).toBe(3)
      })

      await test.step('Verify members section shows members', async () => {
        await expect(teamsPage.membersContainer).toBeVisible()
      })
    })
  })

  test.describe('Navigation', () => {
    test('should navigate from teams list to team detail and back', async ({
      teamPageUser,
    }) => {
      const { page, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Verify on teams list page', async () => {
        await expect(teamsPage.pageHeading).toBeVisible()
      })

      await test.step('Click on team card', async () => {
        // Use the test ID to find team cards (excludes "new" link)
        const teamCard = page.locator('[data-testid="team-card"]').first()
        await teamCard.click()
      })

      await test.step('Verify on team detail page', async () => {
        await expect(page).toHaveURL(`/teams/${teamId}`)
        await expect(teamsPage.teamName).toBeVisible()
      })

      await test.step('Click back to teams link', async () => {
        await teamsPage.backToTeamsLink.click()
      })

      await test.step('Verify back on teams list page', async () => {
        await expect(page).toHaveURL('/teams')
        await expect(teamsPage.pageHeading).toBeVisible()
      })
    })

    test('should navigate from team to project', async ({ teamPageUser }) => {
      const { page, userId, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      let projectSlug: string

      await test.step('Create a project for the team', async () => {
        const result = await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Navigable Project' },
          taskCount: 1,
        })
        projectSlug = result.projectSlug
      })

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Click on project card', async () => {
        await page.getByText('Navigable Project').click()
      })

      await test.step('Verify navigation to project page', async () => {
        await expect(page).toHaveURL(`/projects/${projectSlug}`)
        await expect(
          page.getByRole('heading', { name: 'Navigable Project' }),
        ).toBeVisible()
      })
    })
  })

  test.describe('Team Stats', () => {
    test('should display correct member count', async ({ teamPageUser }) => {
      const { page, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Verify member stat displays a number', async () => {
        const memberText = await teamsPage.membersStat.textContent()
        expect(memberText).toMatch(/^\d+$/)
      })
    })

    test('should display correct project count', async ({ teamPageUser }) => {
      const { page, userId, teamId } = teamPageUser
      const teamsPage = new TeamsPage(page)

      await test.step('Create projects for team', async () => {
        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Stats Test Project 1' },
          taskCount: 0,
        })

        await createProjectWithTasks({
          teamId,
          createdBy: userId,
          projectData: { title: 'Stats Test Project 2' },
          taskCount: 0,
        })
      })

      await test.step('Navigate to team detail page', async () => {
        await teamsPage.navigateToTeam(teamId)
      })

      await test.step('Verify project count is at least 2', async () => {
        const projectText = await teamsPage.projectsStat.textContent()
        const projectCount = parseInt(projectText || '0', 10)
        expect(projectCount).toBeGreaterThanOrEqual(2)
      })
    })
  })

  test.describe('Unauthenticated Access', () => {
    test('should redirect to sign-in when not authenticated', async ({
      unauthenticatedUser,
    }) => {
      const { page } = unauthenticatedUser

      await test.step('Attempt to access teams page', async () => {
        await page.goto('/teams')
      })

      await test.step('Verify redirect to sign-in', async () => {
        await expect(page).toHaveURL(/\/api\/auth\/signin/)
      })
    })
  })
})
