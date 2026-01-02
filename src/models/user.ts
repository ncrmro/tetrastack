import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/database';
import { users } from '@/database/schema.auth';
import { teamMemberships, teams } from '@/database/schema.teams';
import { createDefaultTeam } from './teams';

/**
 * Internal query function to get users with all relations
 * Used for type inference and by User.select()
 */
async function getUsers(where?: { ids?: number[] }) {
  const conditions = [];

  if (where?.ids) {
    conditions.push(inArray(users.id, where.ids));
  }

  return await db.query.users.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
}

/**
 * Type representing the full user record with all eagerly loaded relations
 * Inferred from the getUsers query result
 */
export type UserRecord = Awaited<ReturnType<typeof getUsers>>[number];

/**
 * User class wrapping a database record
 * Provides static query methods and instance methods for business logic
 */
export class User {
  constructor(public record: UserRecord) {}

  /**
   * Select users with flexible where conditions
   * Eagerly loads all related data
   * All conditions use arrays for consistency and bulk operations
   *
   * @example
   * // Find by ID
   * await User.select({ where: { id: [1] } })
   *
   * @example
   * // Multiple IDs
   * await User.select({ where: { id: [1, 2, 3] } })
   */
  static async select(params: {
    where: Partial<{
      id: number[];
    }>;
  }): Promise<User[]> {
    const records = await getUsers({
      ids: params.where.id,
    });

    return records.map((record) => new User(record));
  }

  /**
   * Get user's teams with membership details
   * Returns all teams the user belongs to along with their membership info
   * Returns empty array if user is not part of any teams
   * Pure database operation with no auth context
   *
   * @param userId - The user ID to get teams for
   * @returns Promise with array of team and membership details
   */
  static async getUserTeams(userId: number): Promise<
    Array<{
      team: {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      role: 'member' | 'admin';
      joinedAt: Date;
    }>
  > {
    try {
      const memberships = await db
        .select({
          team: {
            id: teams.id,
            name: teams.name,
            description: teams.description,
            createdAt: teams.createdAt,
            updatedAt: teams.updatedAt,
          },
          role: teamMemberships.role,
          joinedAt: teamMemberships.joinedAt,
        })
        .from(teamMemberships)
        .innerJoin(teams, eq(teamMemberships.teamId, teams.id))
        .where(eq(teamMemberships.userId, userId));

      return memberships as Array<{
        team: {
          id: string;
          name: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
        role: 'member' | 'admin';
        joinedAt: Date;
      }>;
    } catch (error) {
      console.error('Error getting user teams:', error);
      throw new Error('Failed to get user teams');
    }
  }

  /**
   * Creates a new user from OAuth sign-in
   * Handles all NextAuth.js user creation logic and post-creation side effects
   *
   * @param data - OAuth user data (email, name, image)
   * @returns The created user record
   */
  static async createOAuthUser(data: {
    email: string;
    name?: string | null;
    image?: string | null;
  }) {
    // Insert the user
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name ?? null,
        image: data.image ?? null,
        admin: false,
        onboardingCompleted: true,
        onboardingData: null,
      })
      .returning();

    // After commit: Create default team for the new user
    await createDefaultTeam(newUser.id, newUser.name);

    return newUser;
  }

  /**
   * Get user's teams (instance method)
   * Returns all teams this user belongs to along with membership info
   *
   * @returns Promise with array of team and membership details
   */
  async getUserTeams() {
    return User.getUserTeams(this.record.id);
  }
}
