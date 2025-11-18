/**
 * Integration tests for teams model functions
 * Tests database persistence and query operations for teams and memberships
 */

import { describe, it, expect } from 'vitest';
import { db } from '@/database';
import { teams, teamMemberships } from '@/database/schema.teams';
import {
  getTeams,
  insertTeams,
  updateTeams,
  deleteTeams,
  getTeamMemberships,
  insertTeamMemberships,
  deleteTeamMemberships,
} from '@/models/teams';
import { eq } from 'drizzle-orm';
import { teamFactory, teamMembershipFactory, userFactory } from '../factories';

describe('getTeams', () => {
  it('should get teams by IDs using WHERE IN', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();
    const team3 = await teamFactory.create();

    const result = await getTeams({ ids: [team1.id, team2.id] });

    expect(result).toHaveLength(2);
    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(team1.id);
    expect(resultIds).toContain(team2.id);
    expect(resultIds).not.toContain(team3.id);
  });

  it('should get teams by user membership', async () => {
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();

    await teamMembershipFactory.create({ teamId: team1.id, userId: user1.id });
    await teamMembershipFactory.create({ teamId: team2.id, userId: user2.id });

    const result = await getTeams({ userIds: [user1.id] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const team1Result = result.find((t) => t.id === team1.id);
    expect(team1Result).toBeDefined();
  });

  it('should return empty array when no teams match', async () => {
    const result = await getTeams({ ids: ['non-existent-id'] });

    expect(result).toHaveLength(0);
  });
});

describe('insertTeams', () => {
  it('should create a new team with all fields', async () => {
    const teamData = teamFactory.build({
      name: 'Engineering Team',
      description: 'Software development team',
    });

    const [result] = await insertTeams([teamData]);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Engineering Team');
    expect(result.description).toBe('Software development team');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should create team using factory defaults', async () => {
    const result = await teamFactory.create();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBeTruthy();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create team using factory traits', async () => {
    const engineeringTeam = await teamFactory.engineering().create();
    const productTeam = await teamFactory.product().create();

    expect(engineeringTeam.name).toBe('Engineering');
    expect(productTeam.name).toBe('Product');
  });
});

describe('updateTeams', () => {
  it('should update team fields', async () => {
    const team = await teamFactory.create();

    const [result] = await updateTeams([eq(teams.id, team.id)], {
      name: 'Updated Team Name',
      description: 'Updated description',
    });

    expect(result.id).toBe(team.id);
    expect(result.name).toBe('Updated Team Name');
    expect(result.description).toBe('Updated description');
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const team = await teamFactory.create({
      name: 'Original Name',
      description: 'Original Description',
    });

    const [result] = await updateTeams([eq(teams.id, team.id)], {
      name: 'New Name',
    });

    expect(result.name).toBe('New Name');
    expect(result.description).toBe('Original Description');
  });
});

describe('deleteTeams', () => {
  it('should delete team from database', async () => {
    const team = await teamFactory.create();

    await deleteTeams([eq(teams.id, team.id)]);

    const found = await db.query.teams.findFirst({
      where: eq(teams.id, team.id),
    });

    expect(found).toBeUndefined();
  });

  it('should cascade delete team memberships', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();
    await teamMembershipFactory.create({ teamId: team.id, userId: user.id });

    await deleteTeams([eq(teams.id, team.id)]);

    const memberships = await db.query.teamMemberships.findMany({
      where: eq(teamMemberships.teamId, team.id),
    });

    expect(memberships).toHaveLength(0);
  });
});

describe('getTeamMemberships', () => {
  it('should get memberships by team IDs', async () => {
    const team1 = await teamFactory.create();
    const team2 = await teamFactory.create();
    const user = await userFactory.create();

    await teamMembershipFactory.create({ teamId: team1.id, userId: user.id });
    await teamMembershipFactory.create({ teamId: team2.id, userId: user.id });

    const result = await getTeamMemberships({ teamIds: [team1.id] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const membership = result.find((m) => m.teamId === team1.id);
    expect(membership).toBeDefined();
    expect(membership?.userId).toBe(user.id);
  });

  it('should get memberships by user IDs', async () => {
    const team = await teamFactory.create();
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();

    await teamMembershipFactory.create({ teamId: team.id, userId: user1.id });
    await teamMembershipFactory.create({ teamId: team.id, userId: user2.id });

    const result = await getTeamMemberships({ userIds: [user1.id] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const membership = result.find((m) => m.userId === user1.id);
    expect(membership).toBeDefined();
    expect(membership?.team).toBeDefined();
  });

  it('should include team and user relations', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();
    await teamMembershipFactory.create({ teamId: team.id, userId: user.id });

    const result = await getTeamMemberships({ teamIds: [team.id] });

    expect(result[0].team).toBeDefined();
    expect(result[0].user).toBeDefined();
  });
});

describe('insertTeamMemberships', () => {
  it('should add member to team with default role', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();

    const [result] = await insertTeamMemberships([
      {
        teamId: team.id,
        userId: user.id,
        role: 'member',
      },
    ]);

    expect(result).toBeDefined();
    expect(result.teamId).toBe(team.id);
    expect(result.userId).toBe(user.id);
    expect(result.role).toBe('member');
    expect(result.joinedAt).toBeInstanceOf(Date);
  });

  it('should add admin member to team', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();

    const [result] = await insertTeamMemberships([
      {
        teamId: team.id,
        userId: user.id,
        role: 'admin',
      },
    ]);

    expect(result.role).toBe('admin');
  });

  it('should add member using factory', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();

    const result = await teamMembershipFactory.admin().create({
      teamId: team.id,
      userId: user.id,
    });

    expect(result.role).toBe('admin');
  });
});

describe('deleteTeamMemberships', () => {
  it('should remove member from team', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();
    await teamMembershipFactory.create({ teamId: team.id, userId: user.id });

    await deleteTeamMemberships([
      eq(teamMemberships.teamId, team.id),
      eq(teamMemberships.userId, user.id),
    ]);

    const found = await db.query.teamMemberships.findFirst({
      where: eq(teamMemberships.teamId, team.id),
    });

    expect(found).toBeUndefined();
  });

  it('should only remove specified user from team', async () => {
    const team = await teamFactory.create();
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();

    await teamMembershipFactory.create({ teamId: team.id, userId: user1.id });
    await teamMembershipFactory.create({ teamId: team.id, userId: user2.id });

    await deleteTeamMemberships([
      eq(teamMemberships.teamId, team.id),
      eq(teamMemberships.userId, user1.id),
    ]);

    const remainingMemberships = await getTeamMemberships({
      teamIds: [team.id],
    });

    expect(remainingMemberships.some((m) => m.userId === user1.id)).toBe(false);
    expect(remainingMemberships.some((m) => m.userId === user2.id)).toBe(true);
  });
});

describe('Edge cases', () => {
  it('should handle empty team name validation at database level', async () => {
    const teamData = teamFactory.build({ name: '' });

    await expect(insertTeams([teamData])).rejects.toThrow();
  });

  it('should prevent duplicate membership', async () => {
    const team = await teamFactory.create();
    const user = await userFactory.create();

    await teamMembershipFactory.create({ teamId: team.id, userId: user.id });

    // Attempt to add same user again
    await expect(
      teamMembershipFactory.create({ teamId: team.id, userId: user.id }),
    ).rejects.toThrow();
  });
});
