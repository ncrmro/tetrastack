'use server';

import { auth } from '@/app/auth';
import type { ActionResult } from '@/lib/actions';
import {
  getComments as getCommentsModel,
  insertComments,
  updateComments,
  deleteComments,
} from '@/models/comments';
import { verifyCommentOwnership } from '@/lib/nextjs-admin';
import type { InsertComment, SelectComment } from '@/database/schema.tasks';
import { insertCommentSchema, comments } from '@/database/schema.tasks';
import { eq } from 'drizzle-orm';

// Re-export types for React components
export type { InsertComment, SelectComment } from '@/database/schema.tasks';

/**
 * Get comments with flexible filtering
 * Requires authentication
 */
export async function getComments(params: {
  ids?: string[];
  taskIds?: string[];
  userIds?: number[];
}): ActionResult<SelectComment[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const comments = await getCommentsModel(params);
    return { success: true, data: comments };
  } catch {
    return { success: false, error: 'Failed to fetch comments' };
  }
}

/**
 * Create a new comment
 * Requires authentication
 */
export async function createComment(
  data: InsertComment,
): ActionResult<SelectComment> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Ensure the comment is created by the authenticated user
    const commentData = { ...data, userId: parseInt(session.user.id) };

    // Validate input data
    const validationResult = insertCommentSchema.safeParse(commentData);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid comment data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const [comment] = await insertComments([validationResult.data]);
    return { success: true, data: comment };
  } catch {
    return { success: false, error: 'Failed to create comment' };
  }
}

/**
 * Update an existing comment
 * Requires authentication and ownership
 */
export async function updateComment(
  id: string,
  data: Partial<InsertComment>,
): ActionResult<SelectComment> {
  try {
    // Validate input data (partial schema for updates)
    const validationResult = insertCommentSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid comment data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isOwner = await verifyCommentOwnership(parseInt(session.user.id), id);
    if (!isOwner) {
      return {
        success: false,
        error: 'Forbidden: Must be the comment owner to update comment',
      };
    }

    const [comment] = await updateComments(
      [eq(comments.id, id)],
      validationResult.data,
    );
    return { success: true, data: comment };
  } catch {
    return { success: false, error: 'Failed to update comment' };
  }
}

/**
 * Delete a comment
 * Requires authentication and ownership
 */
export async function deleteComment(id: string): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isOwner = await verifyCommentOwnership(parseInt(session.user.id), id);
    if (!isOwner) {
      return {
        success: false,
        error: 'Forbidden: Must be the comment owner to delete comment',
      };
    }

    await deleteComments([eq(comments.id, id)]);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to delete comment' };
  }
}
