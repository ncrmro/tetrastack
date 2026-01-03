/**
 * Integration tests for tasks model functions
 * Tests database persistence and query operations for tasks
 */

import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '@/database';
import { TASK_PRIORITY, TASK_STATUS, tasks } from '@/database/schema.tasks';
import {
  deleteTasks,
  getTasks,
  getTaskWithComments,
  insertTasks,
  updateTasks,
} from '@/models/tasks';
import {
  commentFactory,
  projectFactory,
  taskFactory,
  teamFactory,
  userFactory,
} from '../factories';

describe('getTasks', () => {
  it('should get tasks by IDs using WHERE IN', async () => {
    const task1 = await taskFactory.create();
    const task2 = await taskFactory.create();
    const task3 = await taskFactory.create();

    const result = await getTasks({ ids: [task1.id, task2.id] });

    expect(result).toHaveLength(2);
    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(task1.id);
    expect(resultIds).toContain(task2.id);
    expect(resultIds).not.toContain(task3.id);
  });

  it('should get tasks by project IDs', async () => {
    const team = await teamFactory.create();
    const project1 = await projectFactory.create({ teamId: team.id });
    const project2 = await projectFactory.create({ teamId: team.id });
    const task1 = await taskFactory.create({ projectId: project1.id });
    const task2 = await taskFactory.create({ projectId: project2.id });

    const result = await getTasks({ projectIds: [project1.id] });

    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(task1.id);
    expect(resultIds).not.toContain(task2.id);
  });

  it('should get tasks by assignee IDs', async () => {
    const team = await teamFactory.create();
    const project = await projectFactory.create({ teamId: team.id });
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();
    const task1 = await taskFactory.create({
      projectId: project.id,
      assigneeId: user1.id,
    });
    const task2 = await taskFactory.create({
      projectId: project.id,
      assigneeId: user2.id,
    });

    const result = await getTasks({ assigneeIds: [user1.id] });

    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(task1.id);
    expect(resultIds).not.toContain(task2.id);
  });

  it('should get tasks by status', async () => {
    await taskFactory.todo().create();
    await taskFactory.inProgress().create();

    const result = await getTasks({ status: [TASK_STATUS.TODO] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((task) => {
      expect(task.status).toBe(TASK_STATUS.TODO);
    });
  });

  it('should get tasks by priority', async () => {
    await taskFactory.highPriority().create();
    await taskFactory.lowPriority().create();

    const result = await getTasks({ priority: [TASK_PRIORITY.HIGH] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach((task) => {
      expect(task.priority).toBe(TASK_PRIORITY.HIGH);
    });
  });

  it('should combine multiple filters', async () => {
    const project = await projectFactory.create();
    const user = await userFactory.create();
    const targetTask = await taskFactory
      .inProgress()
      .highPriority()
      .create({ projectId: project.id, assigneeId: user.id });

    await taskFactory.todo().create({ projectId: project.id });

    const result = await getTasks({
      projectIds: [project.id],
      status: [TASK_STATUS.IN_PROGRESS],
      priority: [TASK_PRIORITY.HIGH],
    });

    const resultIds = result.map((t) => t.id);
    expect(resultIds).toContain(targetTask.id);
  });
});

describe('insertTasks', () => {
  it('should create a single task', async () => {
    const project = await projectFactory.create();
    const user = await userFactory.create();

    const result = await insertTasks([
      {
        title: 'Implement login feature',
        description: 'Add user authentication',
        projectId: project.id,
        assigneeId: user.id,
        status: TASK_STATUS.TODO,
        priority: TASK_PRIORITY.HIGH,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Implement login feature');
    expect(result[0].projectId).toBe(project.id);
    expect(result[0].assigneeId).toBe(user.id);
  });

  it('should create multiple tasks in bulk', async () => {
    const project = await projectFactory.create();

    const result = await insertTasks([
      { title: 'Task 1', projectId: project.id },
      { title: 'Task 2', projectId: project.id },
      { title: 'Task 3', projectId: project.id },
    ]);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Task 1');
    expect(result[1].title).toBe('Task 2');
    expect(result[2].title).toBe('Task 3');
  });

  it('should create task using factory defaults', async () => {
    const result = await taskFactory.create();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create task using factory traits', async () => {
    const todo = await taskFactory.todo().create();
    const inProgress = await taskFactory.inProgress().create();
    const done = await taskFactory.done().create();

    expect(todo.status).toBe(TASK_STATUS.TODO);
    expect(inProgress.status).toBe(TASK_STATUS.IN_PROGRESS);
    expect(done.status).toBe(TASK_STATUS.DONE);
  });
});

describe('updateTask', () => {
  it('should update task fields', async () => {
    const task = await taskFactory.create();

    const [result] = await updateTasks([eq(tasks.id, task.id)], {
      title: 'Updated Task Title',
      status: TASK_STATUS.IN_PROGRESS,
      priority: TASK_PRIORITY.HIGH,
    });

    expect(result.id).toBe(task.id);
    expect(result.title).toBe('Updated Task Title');
    expect(result.status).toBe(TASK_STATUS.IN_PROGRESS);
    expect(result.priority).toBe(TASK_PRIORITY.HIGH);
  });

  it('should update only specified fields', async () => {
    const task = await taskFactory.create({
      title: 'Original Title',
      description: 'Original Description',
    });

    const [result] = await updateTasks([eq(tasks.id, task.id)], {
      title: 'New Title',
    });

    expect(result.title).toBe('New Title');
    expect(result.description).toBe('Original Description');
  });

  it('should update task assignee', async () => {
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();
    const task = await taskFactory.create({
      assigneeId: user1.id,
    });

    const [result] = await updateTasks([eq(tasks.id, task.id)], {
      assigneeId: user2.id,
    });

    expect(result.assigneeId).toBe(user2.id);
  });

  it('should update task due date', async () => {
    const task = await taskFactory.create();
    const newDueDate = new Date('2025-12-31');

    const [result] = await updateTasks([eq(tasks.id, task.id)], {
      dueDate: newDueDate,
    });

    expect(result.dueDate).toBeInstanceOf(Date);
    expect(result.dueDate?.toISOString()).toBe(newDueDate.toISOString());
  });
});

describe('deleteTask', () => {
  it('should delete task from database', async () => {
    const task = await taskFactory.create();

    await deleteTasks([eq(tasks.id, task.id)]);

    const found = await db.query.tasks.findFirst({
      where: eq(tasks.id, task.id),
    });

    expect(found).toBeUndefined();
  });

  it('should cascade delete task comments', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();
    await commentFactory.create({ taskId: task.id, userId: user.id });

    await deleteTasks([eq(tasks.id, task.id)]);

    const taskWithComments = await getTaskWithComments(task.id);

    expect(taskWithComments).toBeUndefined();
  });
});

describe('getTaskWithComments', () => {
  it('should return task with comments relation', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();
    await commentFactory.create({ taskId: task.id, userId: user.id });
    await commentFactory.create({ taskId: task.id, userId: user.id });

    const result = await getTaskWithComments(task.id);

    expect(result).toBeDefined();
    expect(result?.comments).toHaveLength(2);
    expect(result?.comments[0].user).toBeDefined();
  });

  it('should return task with empty comments array if no comments', async () => {
    const task = await taskFactory.create();

    const result = await getTaskWithComments(task.id);

    expect(result).toBeDefined();
    expect(result?.comments).toHaveLength(0);
  });

  it('should return undefined for non-existent task', async () => {
    const result = await getTaskWithComments('non-existent-id');

    expect(result).toBeUndefined();
  });
});

describe('Edge cases', () => {
  it('should handle empty title validation at database level', async () => {
    const project = await projectFactory.create();

    await expect(
      insertTasks([{ title: '', projectId: project.id }]),
    ).rejects.toThrow();
  });

  it('should allow null assignee for unassigned tasks', async () => {
    const project = await projectFactory.create();

    const result = await insertTasks([
      {
        title: 'Unassigned Task',
        projectId: project.id,
        assigneeId: null,
      },
    ]);

    expect(result[0].assigneeId).toBeNull();
  });

  it('should allow null due date for tasks without deadlines', async () => {
    const project = await projectFactory.create();

    const result = await insertTasks([
      {
        title: 'No Deadline Task',
        projectId: project.id,
        dueDate: null,
      },
    ]);

    expect(result[0].dueDate).toBeNull();
  });
});
