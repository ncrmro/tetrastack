/**
 * Factory for creating test user data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const user = userFactory.build();
 *
 * // Build with overrides
 * const adminUser = userFactory.build({
 *   name: 'John Admin',
 *   email: 'admin@example.com',
 *   admin: true,
 * });
 *
 * // Use traits
 * const admin = userFactory.admin().build();
 * const regularUser = userFactory.regularUser().build();
 *
 * // Persist to database
 * const persistedUser = await userFactory.create();
 *
 * // Build multiple
 * const users = userFactory.buildList(5);
 * ```
 */

import type { InsertUser, SelectUser } from '@/database/schema.auth';
import { users } from '@/database/schema.auth';
import { db, Factory } from '@/lib/factories';

/**
 * User factory with trait methods for common user types.
 */
class UserFactory extends Factory<InsertUser> {
  /**
   * Create an admin user
   */
  admin() {
    return this.params({ admin: true });
  }

  /**
   * Create a regular (non-admin) user
   */
  regularUser() {
    return this.params({ admin: false });
  }

  /**
   * Create a user with onboarding completed
   */
  onboarded() {
    return this.params({ onboardingCompleted: true });
  }

  /**
   * Create and persist a user to the database.
   * Ensures email and name are always set (never null).
   */
  async create(params?: Partial<InsertUser>): Promise<SelectUser> {
    const built = this.build(params);
    // Construct DB insert object with all required fields
    const insertData = {
      name: built.name || '',
      email: built.email || '',
      emailVerified: built.emailVerified ?? null,
      image: built.image ?? null,
      admin: built.admin ?? false,
      onboardingCompleted: built.onboardingCompleted ?? false,
      onboardingData:
        (built.onboardingData as Record<string, unknown> | null) ?? null,
      data: built.data ?? null,
    };
    const [created] = await db.insert(users).values(insertData).returning();
    return created;
  }

  /**
   * Create and persist multiple users to the database.
   */
  async createList(
    count: number,
    params?: Partial<InsertUser>,
  ): Promise<SelectUser[]> {
    const userList = this.buildList(count, params).map((built) => ({
      name: built.name || '',
      email: built.email || '',
      emailVerified: built.emailVerified ?? null,
      image: built.image ?? null,
      admin: built.admin ?? false,
      onboardingCompleted: built.onboardingCompleted ?? false,
      onboardingData:
        (built.onboardingData as Record<string, unknown> | null) ?? null,
      data: built.data ?? null,
    }));
    return await db.insert(users).values(userList).returning();
  }
}

export const userFactory = UserFactory.define(() => ({
  // Don't set id - let SQLite auto-increment handle it to avoid conflicts with seeded data
  name: Factory.faker.person.fullName(),
  email: Factory.faker.internet.email(),
  emailVerified: null,
  image: null,
  admin: false,
  onboardingCompleted: false,
  onboardingData: null,
  data: null,
}));
