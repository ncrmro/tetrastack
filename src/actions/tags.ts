'use server';

import { auth } from '@/app/auth';
import type { ActionResult } from '@/lib/actions';
import { validateActionInput, withAuth } from '@/lib/actions';
import {
  getTags as getTagsModel,
  insertTags,
  updateTags,
  deleteTags,
} from '@/models/tags';
import { eq } from 'drizzle-orm';
import { tags } from '@/database/schema.tags';
import {
  verifyTeamMembership,
  verifyTagTeamMembership,
} from '@/lib/auth-helpers';
import type { InsertTag, SelectTag } from '@/database/schema.tags';
import { insertTagSchema } from '@/database/schema.tags';

// Re-export types for React components
export type { InsertTag, SelectTag } from '@/database/schema.tags';

/**
 * Get tags with flexible filtering
 * Requires authentication
 */
export async function getTags(params: {
  ids?: string[];
  teamIds?: string[];
  names?: string[];
}): ActionResult<SelectTag[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const tags = await getTagsModel(params);
    return { success: true, data: tags };
  } catch {
    return { success: false, error: 'Failed to fetch tags' };
  }
}

/**
 * Create a new tag
 * Requires authentication
 * EXAMPLE: Using validateActionInput helper
 */
export async function createTag(data: InsertTag): ActionResult<SelectTag> {
  try {
    const validation = validateActionInput(insertTagSchema, data, 'tag');
    if (!validation.success) return validation;

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyTeamMembership(
      session.user.id,
      validation.data.teamId,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to create tag',
      };
    }

    const [tag] = await insertTags([validation.data]);
    return { success: true, data: tag };
  } catch {
    return { success: false, error: 'Failed to create tag' };
  }
}

/**
 * Update an existing tag
 * Requires authentication
 */
export async function updateTag(
  id: string,
  data: Partial<InsertTag>,
): ActionResult<SelectTag> {
  try {
    // Validate input data (partial schema for updates)
    const validationResult = insertTagSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid tag data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyTagTeamMembership(session.user.id, id);
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to update tag',
      };
    }

    const [tag] = await updateTags([eq(tags.id, id)], validationResult.data);
    return { success: true, data: tag };
  } catch {
    return { success: false, error: 'Failed to update tag' };
  }
}

/**
 * Delete a tag
 * Requires authentication
 * EXAMPLE: Using withAuth helper
 */
export async function deleteTag(id: string): ActionResult<void> {
  return withAuth(async (userId) => {
    const isMember = await verifyTagTeamMembership(userId, id);
    if (!isMember) {
      throw new Error('Forbidden: Must be a team member to delete tag');
    }

    await deleteTags([eq(tags.id, id)]);
    return undefined;
  });
}
