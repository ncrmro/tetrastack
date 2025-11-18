/**
 * Factory for creating test tag data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const tag = tagFactory.build();
 *
 * // Use traits
 * const frontendTag = tagFactory.frontend().build();
 * const urgentTag = tagFactory.urgent().build();
 *
 * // Persist to database (auto-creates team)
 * const persistedTag = await tagFactory.create();
 *
 * // Persist with explicit team (when multiple tags share a team)
 * const team = await teamFactory.create();
 * const tag1 = await tagFactory.frontend().create({ teamId: team.id });
 * const tag2 = await tagFactory.backend().create({ teamId: team.id });
 * ```
 */

import { Factory, db } from '@/lib/factories';
import type { InsertTag } from '@/database/schema.tags';
import { tags } from '@/database/schema.tags';

/**
 * Tag factory with trait methods for common tag types.
 */
class TagFactory extends Factory<InsertTag> {
  /**
   * Create a frontend tag
   */
  frontend() {
    return this.params({
      name: 'frontend',
      color: '#3b82f6', // blue
    });
  }

  /**
   * Create a backend tag
   */
  backend() {
    return this.params({
      name: 'backend',
      color: '#10b981', // green
    });
  }

  /**
   * Create an infrastructure tag
   */
  infrastructure() {
    return this.params({
      name: 'infrastructure',
      color: '#f59e0b', // amber
    });
  }

  /**
   * Create a UX tag
   */
  ux() {
    return this.params({
      name: 'ux',
      color: '#ec4899', // pink
    });
  }

  /**
   * Create an urgent tag
   */
  urgent() {
    return this.params({
      name: 'urgent',
      color: '#ef4444', // red
    });
  }

  /**
   * Create and persist a tag to the database.
   * Automatically creates team if not provided.
   */
  async create(params?: Partial<InsertTag>) {
    const built = this.build(params);

    // Auto-create team if not provided
    let teamId = built.teamId;
    if (!teamId) {
      const { teamFactory } = await import('./team.factory');
      const team = await teamFactory.create();
      teamId = team.id;
    }

    const tag = {
      ...built,
      teamId,
    };
    const [created] = await db.insert(tags).values(tag).returning();
    return created;
  }

  /**
   * Create and persist multiple tags to the database.
   * Automatically creates team if not provided (all tags share same team).
   */
  async createList(count: number, params?: Partial<InsertTag>) {
    // Auto-create team if not provided (shared by all tags in list)
    let teamId = params?.teamId;
    if (!teamId) {
      const { teamFactory } = await import('./team.factory');
      const team = await teamFactory.create();
      teamId = team.id;
    }

    const tagList = this.buildList(count, params).map((built) => ({
      ...built,
      teamId,
    }));
    return await db.insert(tags).values(tagList).returning();
  }
}

export const tagFactory = TagFactory.define(() => ({
  name: Factory.faker.word.noun(),
  color: Factory.faker.color.rgb({ format: 'hex' }),
  teamId: '', // Auto-created if not provided
}));
