/**
 * Integration tests for comments model functions
 * Tests database persistence and query operations for task comments
 */

import { describe, it, expect } from 'vitest';
import { db } from '@/database';
import { comments } from '@/database/schema.tasks';
import {
  getComments,
  insertComments,
  updateComments,
  deleteComments,
} from '@/models/comments';
import { eq } from 'drizzle-orm';
import {
  commentFactory,
  taskFactory,
  projectFactory,
  teamFactory,
  userFactory,
} from '../factories';

describe('getComments', () => {
  it('should get comments by IDs using WHERE IN', async () => {
    const comment1 = await commentFactory.create();
    const comment2 = await commentFactory.create();
    const comment3 = await commentFactory.create();

    const result = await getComments({ ids: [comment1.id, comment2.id] });

    expect(result).toHaveLength(2);
    const resultIds = result.map((c) => c.id);
    expect(resultIds).toContain(comment1.id);
    expect(resultIds).toContain(comment2.id);
    expect(resultIds).not.toContain(comment3.id);
  });

  it('should get comments by task IDs', async () => {
    const team = await teamFactory.create();
    const project = await projectFactory.create({ teamId: team.id });
    const task1 = await taskFactory.create({ projectId: project.id });
    const task2 = await taskFactory.create({ projectId: project.id });
    const user = await userFactory.create();

    const comment1 = await commentFactory.create({
      taskId: task1.id,
      userId: user.id,
    });
    const comment2 = await commentFactory.create({
      taskId: task2.id,
      userId: user.id,
    });

    const result = await getComments({ taskIds: [task1.id] });

    const resultIds = result.map((c) => c.id);
    expect(resultIds).toContain(comment1.id);
    expect(resultIds).not.toContain(comment2.id);
  });

  it('should get comments by user IDs', async () => {
    const team = await teamFactory.create();
    const project = await projectFactory.create({ teamId: team.id });
    const task = await taskFactory.create({ projectId: project.id });
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();

    const comment1 = await commentFactory.create({
      taskId: task.id,
      userId: user1.id,
    });
    const comment2 = await commentFactory.create({
      taskId: task.id,
      userId: user2.id,
    });

    const result = await getComments({ userIds: [user1.id] });

    const resultIds = result.map((c) => c.id);
    expect(resultIds).toContain(comment1.id);
    expect(resultIds).not.toContain(comment2.id);
  });

  it('should include user and task relations', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();

    await commentFactory.create({ taskId: task.id, userId: user.id });

    const result = await getComments({ taskIds: [task.id] });

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].user).toBeDefined();
    expect(result[0].task).toBeDefined();
    expect(result[0].user.id).toBe(user.id);
    expect(result[0].task.id).toBe(task.id);
  });

  it('should combine multiple filters', async () => {
    const task1 = await taskFactory.create();
    const task2 = await taskFactory.create();
    const user1 = await userFactory.create();
    const user2 = await userFactory.create();

    const targetComment = await commentFactory.create({
      taskId: task1.id,
      userId: user1.id,
    });
    await commentFactory.create({ taskId: task1.id, userId: user2.id });
    await commentFactory.create({ taskId: task2.id, userId: user1.id });

    const result = await getComments({
      taskIds: [task1.id],
      userIds: [user1.id],
    });

    expect(result.some((c) => c.id === targetComment.id)).toBe(true);
  });
});

describe('insertComments', () => {
  it('should create a comment with all fields', async () => {
    const team = await teamFactory.create();
    const project = await projectFactory.create({ teamId: team.id });
    const task = await taskFactory.create({ projectId: project.id });
    const user = await userFactory.create();

    const [result] = await insertComments([
      {
        content: 'This is a test comment',
        taskId: task.id,
        userId: user.id,
      },
    ]);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.content).toBe('This is a test comment');
    expect(result.taskId).toBe(task.id);
    expect(result.userId).toBe(user.id);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should create comment using factory defaults', async () => {
    const result = await commentFactory.create();

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create comment using factory traits', async () => {
    const shortComment = await commentFactory.short().create();
    const longComment = await commentFactory.long().create();

    expect(shortComment.content.length).toBeLessThan(100);
    expect(longComment.content.length).toBeGreaterThan(200);
  });

  it('should support multiline comments', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();

    const multilineContent = `This is line 1
This is line 2
This is line 3`;

    const [result] = await insertComments([
      {
        content: multilineContent,
        taskId: task.id,
        userId: user.id,
      },
    ]);

    expect(result.content).toBe(multilineContent);
    expect(result.content).toContain('\n');
  });
});

describe('updateComments', () => {
  it('should update comment content', async () => {
    const comment = await commentFactory.create({
      content: 'Original content',
    });

    const [result] = await updateComments([eq(comments.id, comment.id)], {
      content: 'Updated content',
    });

    expect(result.id).toBe(comment.id);
    expect(result.content).toBe('Updated content');
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
      comment.createdAt.getTime(),
    );
  });

  it('should preserve other fields when updating', async () => {
    const comment = await commentFactory.create();
    const originalTaskId = comment.taskId;
    const originalUserId = comment.userId;

    const [result] = await updateComments([eq(comments.id, comment.id)], {
      content: 'New content',
    });

    expect(result.taskId).toBe(originalTaskId);
    expect(result.userId).toBe(originalUserId);
  });
});

describe('deleteComments', () => {
  it('should delete comment from database', async () => {
    const comment = await commentFactory.create();

    await deleteComments([eq(comments.id, comment.id)]);

    const found = await db.query.comments.findFirst({
      where: eq(comments.id, comment.id),
    });

    expect(found).toBeUndefined();
  });

  it('should only delete specified comment', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();

    const comment1 = await commentFactory.create({
      taskId: task.id,
      userId: user.id,
    });
    const comment2 = await commentFactory.create({
      taskId: task.id,
      userId: user.id,
    });

    await deleteComments([eq(comments.id, comment1.id)]);

    const remainingComments = await getComments({ taskIds: [task.id] });

    expect(remainingComments.some((c) => c.id === comment1.id)).toBe(false);
    expect(remainingComments.some((c) => c.id === comment2.id)).toBe(true);
  });
});

describe('Edge cases', () => {
  it('should handle empty content validation at database level', async () => {
    const team = await teamFactory.create();
    const project = await projectFactory.create({ teamId: team.id });
    const task = await taskFactory.create({ projectId: project.id });
    const user = await userFactory.create();

    await expect(
      insertComments([{ content: '', taskId: task.id, userId: user.id }]),
    ).rejects.toThrow();
  });

  it('should handle invalid task ID', async () => {
    const user = await userFactory.create();

    await expect(
      insertComments([
        {
          content: 'Test comment',
          taskId: 'non-existent-task',
          userId: user.id,
        },
      ]),
    ).rejects.toThrow();
  });

  it('should handle invalid user ID', async () => {
    const task = await taskFactory.create();

    await expect(
      insertComments([
        {
          content: 'Test comment',
          taskId: task.id,
          userId: 99999, // Non-existent user
        },
      ]),
    ).rejects.toThrow();
  });

  it('should support very long comments', async () => {
    const task = await taskFactory.create();
    const user = await userFactory.create();
    const longContent = 'A'.repeat(1000);

    const [result] = await insertComments([
      {
        content: longContent,
        taskId: task.id,
        userId: user.id,
      },
    ]);

    expect(result.content.length).toBe(1000);
  });
});
