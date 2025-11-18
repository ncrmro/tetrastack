/**
 * Factory for creating test task data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const task = taskFactory.build();
 *
 * // Use traits
 * const todoTask = taskFactory.todo().highPriority().build();
 * const doneTask = taskFactory.done().build();
 *
 * // Persist to database (auto-creates project and team)
 * const persistedTask = await taskFactory.create();
 *
 * // Persist with explicit project (when multiple tasks share a project)
 * const project = await projectFactory.create();
 * const task1 = await taskFactory.create({ projectId: project.id });
 * const task2 = await taskFactory.create({ projectId: project.id });
 * ```
 */

import { Factory, db } from '@/lib/factories';
import type { InsertTask } from '@/database/schema.tasks';
import { tasks, TASK_STATUS, TASK_PRIORITY } from '@/database/schema.tasks';

/**
 * Task factory with trait methods for common task states.
 */
class TaskFactory extends Factory<InsertTask> {
  /**
   * Create a todo status task
   */
  todo() {
    return this.params({ status: TASK_STATUS.TODO });
  }

  /**
   * Create an in-progress status task
   */
  inProgress() {
    return this.params({ status: TASK_STATUS.IN_PROGRESS });
  }

  /**
   * Create a done status task
   */
  done() {
    return this.params({ status: TASK_STATUS.DONE });
  }

  /**
   * Create a low priority task
   */
  lowPriority() {
    return this.params({ priority: TASK_PRIORITY.LOW });
  }

  /**
   * Create a medium priority task
   */
  mediumPriority() {
    return this.params({ priority: TASK_PRIORITY.MEDIUM });
  }

  /**
   * Create a high priority task
   */
  highPriority() {
    return this.params({ priority: TASK_PRIORITY.HIGH });
  }

  /**
   * Create a task with a due date
   */
  withDueDate(daysFromNow: number = 7) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    return this.params({ dueDate });
  }

  /**
   * Create an assigned task
   */
  assigned(userId: number) {
    return this.params({ assigneeId: userId });
  }

  /**
   * Create an unassigned task
   */
  unassigned() {
    return this.params({ assigneeId: null });
  }

  /**
   * Create and persist a task to the database.
   * Automatically creates project (and team) if not provided.
   */
  async create(params?: Partial<InsertTask>) {
    const built = this.build(params);

    // Auto-create project if not provided
    let projectId = built.projectId;
    if (!projectId) {
      const { projectFactory } = await import('./project.factory');
      const project = await projectFactory.create();
      projectId = project.id;
    }

    const task = {
      ...built,
      projectId,
    };
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  /**
   * Create and persist multiple tasks to the database.
   * Automatically creates project (and team) if not provided (all tasks share same project).
   */
  async createList(count: number, params?: Partial<InsertTask>) {
    // Auto-create project if not provided (shared by all tasks in list)
    let projectId = params?.projectId;
    if (!projectId) {
      const { projectFactory } = await import('./project.factory');
      const project = await projectFactory.create();
      projectId = project.id;
    }

    const taskList = this.buildList(count, params).map((built) => ({
      ...built,
      projectId,
    }));
    return await db.insert(tasks).values(taskList).returning();
  }
}

export const taskFactory = TaskFactory.define(() => ({
  title: Factory.faker.lorem.sentence(),
  description: Factory.faker.lorem.paragraph(),
  status: TASK_STATUS.TODO,
  priority: TASK_PRIORITY.MEDIUM,
  projectId: '', // Auto-created if not provided
  assigneeId: null,
  dueDate: null,
}));
