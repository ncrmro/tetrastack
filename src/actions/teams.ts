'use server'

import { eq } from 'drizzle-orm'
import { auth } from '@/app/auth'
import type {
  InsertTeam,
  InsertTeamMembership,
  SelectTeam,
  SelectTeamMembership,
} from '@/database/schema.teams'
import {
  insertTeamMembershipSchema,
  insertTeamSchema,
  teamMemberships,
  teams,
} from '@/database/schema.teams'
import type { ActionResult } from '@/lib/actions'
import { verifyTeamAdmin } from '@/lib/auth-helpers'
import {
  deleteTeamMemberships,
  deleteTeams,
  getTeamMemberships as getTeamMembershipsModel,
  getTeams as getTeamsModel,
  insertTeamMemberships,
  insertTeams,
  updateTeams,
} from '@/models/teams'

// Re-export types for React components
export type {
  InsertTeam,
  InsertTeamMembership,
  SelectTeam,
  SelectTeamMembership,
  TeamRole,
} from '@/database/schema.teams'

/**
 * Get teams with flexible filtering
 * Requires authentication
 */
export async function getTeams(params: {
  ids?: string[]
  userIds?: number[]
}): ActionResult<SelectTeam[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const teams = await getTeamsModel(params)
    return { success: true, data: teams }
  } catch {
    return { success: false, error: 'Failed to fetch teams' }
  }
}

/**
 * Create a new team
 * Requires authentication
 */
export async function createTeam(data: InsertTeam): ActionResult<SelectTeam> {
  try {
    // Validate input data
    const validationResult = insertTeamSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid team data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const [team] = await insertTeams([validationResult.data])
    return { success: true, data: team }
  } catch {
    return { success: false, error: 'Failed to create team' }
  }
}

/**
 * Update an existing team
 * Requires authentication and team membership
 */
export async function updateTeam(
  id: string,
  data: Partial<InsertTeam>,
): ActionResult<SelectTeam> {
  try {
    // Validate input data (partial schema for updates)
    const validationResult = insertTeamSchema.partial().safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid team data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await verifyTeamAdmin(parseInt(session.user.id, 10), id)
    if (!isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Must be a team admin to update team',
      }
    }

    const [team] = await updateTeams([eq(teams.id, id)], validationResult.data)
    return { success: true, data: team }
  } catch {
    return { success: false, error: 'Failed to update team' }
  }
}

/**
 * Delete a team
 * Requires authentication and team admin role
 */
export async function deleteTeam(id: string): ActionResult<void> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await verifyTeamAdmin(parseInt(session.user.id, 10), id)
    if (!isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Must be a team admin to delete team',
      }
    }

    await deleteTeams([eq(teams.id, id)])
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to delete team' }
  }
}

/**
 * Get team memberships with flexible filtering
 * Requires authentication
 */
export async function getTeamMemberships(params: {
  teamIds?: string[]
  userIds?: number[]
}): ActionResult<SelectTeamMembership[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const memberships = await getTeamMembershipsModel(params)
    return { success: true, data: memberships }
  } catch {
    return { success: false, error: 'Failed to fetch team memberships' }
  }
}

/**
 * Add a member to a team
 * Requires authentication and team admin role
 */
export async function addTeamMember(
  data: InsertTeamMembership,
): ActionResult<SelectTeamMembership> {
  try {
    // Validate input data
    const validationResult = insertTeamMembershipSchema.safeParse(data)
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid team membership data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await verifyTeamAdmin(
      parseInt(session.user.id, 10),
      validationResult.data.teamId,
    )
    if (!isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Must be a team admin to add team member',
      }
    }

    const [membership] = await insertTeamMemberships([validationResult.data])
    return { success: true, data: membership }
  } catch {
    return { success: false, error: 'Failed to add team member' }
  }
}

/**
 * Remove a member from a team
 * Requires authentication and team admin role
 */
export async function removeTeamMember(
  teamId: string,
  userId: number,
): ActionResult<void> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const isAdmin = await verifyTeamAdmin(parseInt(session.user.id, 10), teamId)
    if (!isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Must be a team admin to remove team member',
      }
    }

    await deleteTeamMemberships([
      eq(teamMemberships.teamId, teamId),
      eq(teamMemberships.userId, userId),
    ])
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Failed to remove team member' }
  }
}
