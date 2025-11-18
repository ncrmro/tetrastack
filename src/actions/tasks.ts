'use server';

import { auth } from '@/app/auth';
import type { ActionResult } from '@/lib/actions';
import { validateBulkInput } from '@/lib/actions';
import type { ModelResult } from '@/lib/models';
import {
  getTasks as getTasksModel,
  insertTasks,
  updateTasks,
  deleteTasks,
  getTaskWithComments,
} from '@/models/tasks';
import { eq } from 'drizzle-orm';
import { tasks } from '@/database/schema.tasks';
import {
  verifyProjectTeamMembership,
  verifyTaskTeamMembership,
  verifyBulkTeamAccess,
} from '@/lib/auth-helpers';
import type {
  InsertTask,
  SelectTask,
  TaskStatus,
  TaskPriority,
} from '@/database/schema.tasks';
import { insertTaskSchema } from '@/database/schema.tasks';

// Re-export types for React components
export type {
  InsertTask,
  SelectTask,
  TaskStatus,
  TaskPriority,
} from '@/database/schema.tasks';
// Note: TASK_STATUS and TASK_PRIORITY constants cannot be exported from 'use server' files
// Import them directly from '@/database/schema.tasks' in components instead

/**
 * Get tasks with flexible filtering
 * Requires authentication
 */
export async function getTasks(params: {
  ids?: string[];
  projectIds?: string[];
  assigneeIds?: number[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
}): ActionResult<SelectTask[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tasks = await getTasksModel(params);
    return { success: true, data: tasks };
  } catch {
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

/**
 * Create a new task
 * Requires authentication
 */
export async function createTask(data: InsertTask): ActionResult<SelectTask> {
  try {
    // Validate input data
    const validationResult = insertTaskSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid task data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyProjectTeamMembership(
      parseInt(session.user.id),
      validationResult.data.projectId,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to create task',
      };
    }

    const [task] = await insertTasks([validationResult.data]);
    return { success: true, data: task };
  } catch {
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Create multiple tasks
 * Requires authentication
 * EXAMPLE: Using validateBulkInput and verifyBulkTeamAccess helpers
 */
export async function createTasks(
  data: InsertTask[],
): ActionResult<SelectTask[]> {
  try {
    const validation = validateBulkInput(insertTaskSchema, data, 'task');
    if (!validation.success) return validation;

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const hasAccess = await verifyBulkTeamAccess(
      parseInt(session.user.id),
      validation.data,
      (task) => task.projectId,
      verifyProjectTeamMembership,
    );
    if (!hasAccess) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to create tasks',
      };
    }

    const tasksResult = await insertTasks(validation.data);
    return { success: true, data: tasksResult };
  } catch {
    return { success: false, error: 'Failed to create tasks' };
  }
}

/**
 * Update an existing task
 * Requires authentication
 */
export async function updateTask(
  id: string,
  data: Partial<InsertTask>,
): ActionResult<SelectTask> {
  try {
    // Validate input data (partial schema for updates)
    const validationResult = insertTaskSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid task data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyTaskTeamMembership(
      parseInt(session.user.id),
      id,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to update task',
      };
    }

    const [task] = await updateTasks([eq(tasks.id, id)], validationResult.data);
    return { success: true, data: task };
  } catch {
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Delete a task
 * Requires authentication
 */
export async function deleteTask(id: string): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyTaskTeamMembership(
      parseInt(session.user.id),
      id,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to delete task',
      };
    }

    await deleteTasks([eq(tasks.id, id)]);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to delete task' };
  }
}

/**
 * Get a task with its comments
 * Requires authentication
 */
export async function getTaskWithCommentsAction(
  id: string,
): ActionResult<ModelResult<typeof getTaskWithComments>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const task = await getTaskWithComments(id);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true, data: task };
  } catch {
    return { success: false, error: 'Failed to fetch task with comments' };
  }
}
