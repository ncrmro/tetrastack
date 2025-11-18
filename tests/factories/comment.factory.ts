/**
 * Factory for creating test comment data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const comment = commentFactory.build();
 *
 * // Use traits
 * const shortComment = commentFactory.short().build();
 * const longComment = commentFactory.long().build();
 *
 * // Persist to database (auto-creates task, project, team, and user)
 * const persistedComment = await commentFactory.create();
 *
 * // Persist with explicit task/user (when multiple comments share task/user)
 * const task = await taskFactory.create();
 * const user = await userFactory.create();
 * const comment1 = await commentFactory.create({ taskId: task.id, userId: user.id });
 * const comment2 = await commentFactory.create({ taskId: task.id, userId: user.id });
 * ```
 */

import { Factory, db } from '@/lib/factories';
import type { InsertComment } from '@/database/schema.tasks';
import { comments } from '@/database/schema.tasks';

/**
 * Comment factory with trait methods for common comment types.
 */
class CommentFactory extends Factory<InsertComment> {
  /**
   * Create a short comment
   */
  short() {
    return this.params({
      content: Factory.faker.lorem.sentence(),
    });
  }

  /**
   * Create a long comment
   */
  long() {
    return this.params({
      content: Factory.faker.lorem.paragraphs(3),
    });
  }

  /**
   * Create and persist a comment to the database.
   * Automatically creates task (project, team) and user if not provided.
   */
  async create(params?: Partial<InsertComment>) {
    const built = this.build(params);

    // Auto-create task if not provided
    let taskId = built.taskId;
    if (!taskId) {
      const { taskFactory } = await import('./task.factory');
      const task = await taskFactory.create();
      taskId = task.id;
    }

    // Auto-create user if not provided
    let userId = built.userId;
    if (!userId) {
      const { userFactory } = await import('./user.factory');
      const user = await userFactory.create();
      userId = user.id;
    }

    const comment = {
      ...built,
      taskId,
      userId,
    };
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  /**
   * Create and persist multiple comments to the database.
   * Automatically creates task (project, team) and user if not provided (all comments share same task/user).
   */
  async createList(count: number, params?: Partial<InsertComment>) {
    // Auto-create task if not provided (shared by all comments in list)
    let taskId = params?.taskId;
    if (!taskId) {
      const { taskFactory } = await import('./task.factory');
      const task = await taskFactory.create();
      taskId = task.id;
    }

    // Auto-create user if not provided (shared by all comments in list)
    let userId = params?.userId;
    if (!userId) {
      const { userFactory } = await import('./user.factory');
      const user = await userFactory.create();
      userId = user.id;
    }

    const commentList = this.buildList(count, params).map((built) => ({
      ...built,
      taskId,
      userId,
    }));
    return await db.insert(comments).values(commentList).returning();
  }
}

export const commentFactory = CommentFactory.define(() => ({
  taskId: '', // Auto-created if not provided
  userId: 1, // Auto-created if not provided
  content: Factory.faker.lorem.paragraph(),
}));
