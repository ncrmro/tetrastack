/* eslint-disable react-hooks/rules-of-hooks */

import { TEAM_ROLE } from '../../../src/database/schema.teams'
import { insertTeamMemberships, insertTeams } from '../../../src/models/teams'
import { BasePage } from '../page-objects/BasePage'
import type { TeamContext } from './base-fixtures'
import { test as base, expect } from './base-fixtures'

// Team specific context with navigation helpers
export interface TeamPageContext extends TeamContext {
  basePage: BasePage
}

// Fixture types
export type TeamFixtures = {
  // User with team pre-navigated to teams page
  teamPageUser: TeamPageContext

  // Admin with team pre-navigated to teams page
  teamPageAdmin: TeamPageContext
}

// Extend base fixtures with team specific setup
export const test = base.extend<TeamFixtures>({
  // User with team pre-navigated to teams page
  teamPageUser: async ({ userWithTeam }, use) => {
    const basePage = new BasePage(userWithTeam.page)

    // Navigate to teams page
    await basePage.goto('/teams')

    // Verify we're on the correct page
    await expect(
      userWithTeam.page.getByRole('heading', { name: 'Teams' }),
    ).toBeVisible()

    await use({
      ...userWithTeam,
      basePage,
    })
  },

  // Admin with team pre-navigated to teams page
  teamPageAdmin: async ({ adminWithTeam }, use) => {
    const basePage = new BasePage(adminWithTeam.page)

    // Navigate to teams page
    await basePage.goto('/teams')

    // Verify we're on the correct page
    await expect(
      adminWithTeam.page.getByRole('heading', { name: 'Teams' }),
    ).toBeVisible()

    await use({
      ...adminWithTeam,
      basePage,
    })
  },
})

// Helper function to create a team with multiple members
export async function createTeamWithMembers(params: {
  name: string
  description?: string
  memberUserIds: number[]
  adminUserIds?: number[]
}): Promise<string> {
  const { name, description, memberUserIds, adminUserIds = [] } = params

  // Create the team
  const [team] = await insertTeams([
    {
      name,
      description,
    },
  ])

  // Prepare all memberships
  const memberships = []

  // Add admin members
  for (const userId of adminUserIds) {
    memberships.push({
      teamId: team.id,
      userId,
      role: TEAM_ROLE.ADMIN,
    })
  }

  // Add regular members
  for (const userId of memberUserIds) {
    if (!adminUserIds.includes(userId)) {
      memberships.push({
        teamId: team.id,
        userId,
        role: TEAM_ROLE.MEMBER,
      })
    }
  }

  // Insert all memberships at once
  if (memberships.length > 0) {
    await insertTeamMemberships(memberships)
  }

  return team.id
}

// Helper function to create multiple teams for testing
export async function createMultipleTeams(params: {
  count: number
  baseUserId: number
}): Promise<string[]> {
  const { count, baseUserId } = params

  // Create all teams at once
  const teamsData = Array.from({ length: count }, (_, i) => ({
    name: `Test Team ${i + 1}`,
    description: `Test team ${i + 1} for E2E testing`,
  }))

  const teams = await insertTeams(teamsData)

  // Create memberships for all teams
  const memberships = teams.map((team) => ({
    teamId: team.id,
    userId: baseUserId,
    role: TEAM_ROLE.ADMIN,
  }))

  await insertTeamMemberships(memberships)

  return teams.map((t) => t.id)
}

export { expect } from '@playwright/test'
