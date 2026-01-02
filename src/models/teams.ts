import { and, inArray } from 'drizzle-orm';
import { db } from '@/database';
import {
  insertTeamMembershipSchema,
  insertTeamSchema,
  TEAM_ROLE,
  teamMemberships,
  teams,
} from '@/database/schema.teams';
import { createModelFactory } from '@/lib/models';

/**
 * CRUD operations for teams using many-first design pattern
 * All operations work with arrays by default
 */
export const {
  insert: insertTeams,
  select: selectTeams,
  update: updateTeams,
  delete: deleteTeams,
  buildConditions: buildTeamConditions,
  takeFirst: takeFirstTeam,
} = createModelFactory('teams', teams, teams.id, insertTeamSchema);

/**
 * CRUD operations for team memberships using many-first design pattern
 * All operations work with arrays by default
 */
export const {
  insert: insertTeamMemberships,
  select: selectTeamMemberships,
  delete: deleteTeamMemberships,
  buildConditions: buildMembershipConditions,
  takeFirst: takeFirstMembership,
} = createModelFactory(
  'teamMemberships',
  teamMemberships,
  teamMemberships.teamId,
  insertTeamMembershipSchema,
);

/**
 * Get teams with flexible filtering using WHERE IN clauses
 * All parameters are optional arrays for bulk operations
 * Uses relations for efficient querying with membership data
 *
 * @example
 * // Get by IDs
 * await getTeams({ ids: ['team-uuid-1', 'team-uuid-2'] })
 *
 * @example
 * // Get teams by user membership
 * await getTeams({ userIds: [1, 2] })
 */
export async function getTeams(params: { ids?: string[]; userIds?: number[] }) {
  const conditions = [];

  if (params.ids) {
    conditions.push(inArray(teams.id, params.ids));
  }

  // If filtering by users, we need to join with memberships
  if (params.userIds) {
    return await db.query.teams.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        memberships: {
          where: inArray(teamMemberships.userId, params.userIds),
        },
      },
    });
  }

  return await db.query.teams.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
}

/**
 * Get team memberships with flexible filtering using WHERE IN clauses
 * Uses relations for efficient querying with team and user data
 *
 * @example
 * // Get all members of teams
 * await getTeamMemberships({ teamIds: ['team-1', 'team-2'] })
 *
 * @example
 * // Get all teams a user belongs to
 * await getTeamMemberships({ userIds: [1] })
 */
export async function getTeamMemberships(params: {
  teamIds?: string[];
  userIds?: number[];
}) {
  const conditions = [];

  if (params.teamIds) {
    conditions.push(inArray(teamMemberships.teamId, params.teamIds));
  }

  if (params.userIds) {
    conditions.push(inArray(teamMemberships.userId, params.userIds));
  }

  return await db.query.teamMemberships.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      team: true,
      user: true,
    },
  });
}

/**
 * Creates a default team for a new user
 * Uses existing insertTeams and insertTeamMemberships functions
 *
 * @param userId - The user ID to create the team for
 * @param userName - Optional user name for team naming
 * @returns The created team
 */
export async function createDefaultTeam(
  userId: number,
  userName?: string | null,
) {
  const teamName = userName ? `${userName}'s Team` : 'My Team';

  // Create the team
  const [team] = await insertTeams([
    {
      name: teamName,
      description: 'Default team created on signup',
    },
  ]);

  // Add user as admin of their default team
  await insertTeamMemberships([
    {
      teamId: team.id,
      userId: userId,
      role: TEAM_ROLE.ADMIN,
    },
  ]);

  return team;
}
