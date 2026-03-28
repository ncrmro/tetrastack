import { db } from '@/database';
import { teamMemberships, TEAM_ROLE } from '@/database/schema.teams';
import { projects } from '@/database/schema.projects';
import { tasks, comments } from '@/database/schema.tasks';
import { tags } from '@/database/schema.tags';
import { and, eq } from 'drizzle-orm';

/**
 * Verify if a user is a member of a team
 *
 * @param userId - User ID to check
 * @param teamId - Team ID to check membership for
 * @returns true if user is a team member, false otherwise
 */
export async function verifyTeamMembership(
  userId: number,
  teamId: string,
): Promise<boolean> {
  const membership = await db.query.teamMemberships.findFirst({
    where: and(
      eq(teamMemberships.userId, userId),
      eq(teamMemberships.teamId, teamId),
    ),
  });
  return !!membership;
}

/**
 * Verify if a user is an admin of a team
 *
 * @param userId - User ID to check
 * @param teamId - Team ID to check admin status for
 * @returns true if user is a team admin, false otherwise
 */
export async function verifyTeamAdmin(
  userId: number,
  teamId: string,
): Promise<boolean> {
  const membership = await db.query.teamMemberships.findFirst({
    where: and(
      eq(teamMemberships.userId, userId),
      eq(teamMemberships.teamId, teamId),
      eq(teamMemberships.role, TEAM_ROLE.ADMIN),
    ),
  });
  return !!membership;
}

/**
 * Verify if a user is a member of a project's team
 *
 * @param userId - User ID to check
 * @param projectId - Project ID to check team membership for
 * @returns true if user is a member of the project's team, false otherwise
 */
export async function verifyProjectTeamMembership(
  userId: number,
  projectId: string,
): Promise<boolean> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { teamId: true },
  });

  if (!project) {
    return false;
  }

  return verifyTeamMembership(userId, project.teamId);
}

/**
 * Verify if a user is an admin of a project's team
 *
 * @param userId - User ID to check
 * @param projectId - Project ID to check team admin status for
 * @returns true if user is an admin of the project's team, false otherwise
 */
export async function verifyProjectTeamAdmin(
  userId: number,
  projectId: string,
): Promise<boolean> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { teamId: true },
  });

  if (!project) {
    return false;
  }

  return verifyTeamAdmin(userId, project.teamId);
}

/**
 * Verify if a user is a member of a task's project's team
 *
 * @param userId - User ID to check
 * @param taskId - Task ID to check team membership for
 * @returns true if user is a member of the task's project's team, false otherwise
 */
export async function verifyTaskTeamMembership(
  userId: number,
  taskId: string,
): Promise<boolean> {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    columns: { projectId: true },
  });

  if (!task) {
    return false;
  }

  return verifyProjectTeamMembership(userId, task.projectId);
}

/**
 * Verify if a user owns a comment
 *
 * @param userId - User ID to check
 * @param commentId - Comment ID to check ownership for
 * @returns true if user owns the comment, false otherwise
 */
export async function verifyCommentOwnership(
  userId: number,
  commentId: string,
): Promise<boolean> {
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { userId: true },
  });

  if (!comment) {
    return false;
  }

  return comment.userId === userId;
}

/**
 * Verify if a user is a member of a tag's team
 *
 * @param userId - User ID to check
 * @param tagId - Tag ID to check team membership for
 * @returns true if user is a member of the tag's team, false otherwise
 */
export async function verifyTagTeamMembership(
  userId: number,
  tagId: string,
): Promise<boolean> {
  const tag = await db.query.tags.findFirst({
    where: eq(tags.id, tagId),
    columns: { teamId: true },
  });

  if (!tag) {
    return false;
  }

  return verifyTeamMembership(userId, tag.teamId);
}

/**
 * Verify user has access to multiple items by checking their team membership
 * Useful for bulk operations where items belong to different teams
 *
 * @param userId - User ID to check
 * @param items - Array of items to check access for
 * @param extractTeamId - Function to extract team ID from each item
 * @param verifyFn - Verification function to check access (e.g., verifyTeamMembership)
 * @returns true if user has access to all items, false otherwise
 *
 * @example
 * // Verify user can create multiple tasks across different projects
 * const hasAccess = await verifyBulkTeamAccess(
 *   userId,
 *   validatedTasks,
 *   (task) => task.projectId,
 *   verifyProjectTeamMembership
 * );
 */
export async function verifyBulkTeamAccess<T>(
  userId: number,
  items: T[],
  extractId: (item: T) => string,
  verifyFn: (userId: number, id: string) => Promise<boolean>,
): Promise<boolean> {
  const uniqueIds = [...new Set(items.map(extractId))];
  for (const id of uniqueIds) {
    const hasAccess = await verifyFn(userId, id);
    if (!hasAccess) {
      return false;
    }
  }
  return true;
}
