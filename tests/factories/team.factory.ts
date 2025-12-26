/**
 * Factory for creating test team data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const team = teamFactory.build();
 *
 * // Use traits
 * const engineeringTeam = teamFactory.engineering().build();
 *
 * // Persist to database
 * const persistedTeam = await teamFactory.create();
 * ```
 */

import { Factory, db } from '@/lib/factories';
import type { InsertTeam, InsertTeamMembership } from '@/database/schema.teams';
import { teams, teamMemberships, TEAM_ROLE } from '@/database/schema.teams';

/**
 * Team factory with trait methods for common team types.
 */
class TeamFactory extends Factory<InsertTeam> {
  /**
   * Create an engineering team
   */
  engineering() {
    return this.params({
      name: 'Engineering',
      description: 'Software development and technical infrastructure',
    });
  }

  /**
   * Create a product team
   */
  product() {
    return this.params({
      name: 'Product',
      description: 'Product management and design',
    });
  }

  /**
   * Create an operations team
   */
  operations() {
    return this.params({
      name: 'Operations',
      description: 'Business operations and customer success',
    });
  }

  /**
   * Create and persist a team to the database.
   */
  async create(params?: Partial<InsertTeam>) {
    const team = this.build(params);
    const [created] = await db.insert(teams).values(team).returning();
    return created;
  }

  /**
   * Create and persist multiple teams to the database.
   */
  async createList(count: number, params?: Partial<InsertTeam>) {
    const teamList = this.buildList(count, params);
    return await db.insert(teams).values(teamList).returning();
  }
}

export const teamFactory = TeamFactory.define(() => ({
  name: Factory.faker.company.name(),
  description: Factory.faker.company.catchPhrase(),
}));

/**
 * Team membership factory for creating user-team relationships.
 */
class TeamMembershipFactory extends Factory<InsertTeamMembership> {
  /**
   * Create an admin membership
   */
  admin() {
    return this.params({ role: TEAM_ROLE.ADMIN });
  }

  /**
   * Create a member (non-admin) membership
   */
  member() {
    return this.params({ role: TEAM_ROLE.MEMBER });
  }

  /**
   * Create and persist a team membership to the database.
   */
  async create(params?: Partial<InsertTeamMembership>) {
    const membership = this.build(params);
    const [created] = await db
      .insert(teamMemberships)
      .values(membership)
      .returning();
    return created;
  }
}

export const teamMembershipFactory = TeamMembershipFactory.define(() => ({
  teamId: '', // Must be provided
  userId: '', // Must be provided
  role: TEAM_ROLE.MEMBER,
}));
