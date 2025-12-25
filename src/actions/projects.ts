'use server';

import { auth } from '@/app/auth';
import type { ActionResult } from '@/lib/actions';
import type { ModelResult } from '@/lib/models';
import {
  getProjects as getProjectsModel,
  insertProjects,
  updateProjects,
  deleteProjects,
  getProjectWithTags,
  addProjectTags as addProjectTagsModel,
  removeProjectTags as removeProjectTagsModel,
} from '@/models/projects';
import { eq } from 'drizzle-orm';
import { projects } from '@/database/schema.projects';
import {
  verifyProjectTeamMembership,
  verifyProjectTeamAdmin,
} from '@/lib/auth-helpers';
import type {
  InsertProject,
  SelectProject,
  ProjectStatus,
  ProjectPriority,
} from '@/database/schema.projects';
import { insertProjectSchema } from '@/database/schema.projects';

// Re-export types for React components
export type {
  InsertProject,
  SelectProject,
  ProjectStatus,
  ProjectPriority,
} from '@/database/schema.projects';
// Note: PROJECT_STATUS and PROJECT_PRIORITY constants cannot be exported from 'use server' files
// Import them directly from '@/database/schema.projects' in components instead

/**
 * Get projects with flexible filtering
 * Requires authentication
 */
export async function getProjects(params: {
  ids?: string[];
  slugs?: string[];
  teamIds?: string[];
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
}): ActionResult<SelectProject[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const projects = await getProjectsModel(params);
    return { success: true, data: projects };
  } catch {
    return { success: false, error: 'Failed to fetch projects' };
  }
}

/**
 * Create a new project
 * Automatically generates unique slug from title
 * Requires authentication
 */
export async function createProject(
  data: InsertProject,
): ActionResult<SelectProject> {
  try {
    // Validate input data
    const validationResult = insertProjectSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid project data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [project] = await insertProjects([validationResult.data]);
    return { success: true, data: project };
  } catch {
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Create multiple projects
 * Automatically generates unique slugs from titles
 * Requires authentication
 */
export async function createProjects(
  data: InsertProject[],
): ActionResult<SelectProject[]> {
  try {
    // Validate all input data
    const validationErrors: string[] = [];
    const validatedData: InsertProject[] = [];

    for (let i = 0; i < data.length; i++) {
      const validationResult = insertProjectSchema.safeParse(data[i]);
      if (!validationResult.success) {
        validationErrors.push(
          `Project ${i + 1}: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        );
      } else {
        validatedData.push(validationResult.data);
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: `Invalid project data: ${validationErrors.join('; ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const projectsResult = await insertProjects(validatedData);
    return { success: true, data: projectsResult };
  } catch {
    return { success: false, error: 'Failed to create projects' };
  }
}

/**
 * Update an existing project
 * If title is updated, slug is automatically regenerated
 * Requires authentication
 */
export async function updateProject(
  id: string,
  data: Partial<InsertProject>,
): ActionResult<SelectProject> {
  try {
    // Validate input data (partial schema for updates)
    const validationResult = insertProjectSchema.partial().safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid project data: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyProjectTeamMembership(session.user.id, id);
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to update project',
      };
    }

    const [project] = await updateProjects(
      [eq(projects.id, id)],
      validationResult.data,
    );
    return { success: true, data: project };
  } catch {
    return { success: false, error: 'Failed to update project' };
  }
}

/**
 * Delete a project
 * Requires authentication
 */
export async function deleteProject(id: string): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isAdmin = await verifyProjectTeamAdmin(session.user.id, id);
    if (!isAdmin) {
      return {
        success: false,
        error: 'Forbidden: Must be a team admin to delete project',
      };
    }

    await deleteProjects([eq(projects.id, id)]);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to delete project' };
  }
}

/**
 * Get a project with its tags
 * Requires authentication
 */
export async function getProjectWithTagsAction(
  id: string,
): ActionResult<ModelResult<typeof getProjectWithTags>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const project = await getProjectWithTags(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true, data: project };
  } catch {
    return { success: false, error: 'Failed to fetch project with tags' };
  }
}

/**
 * Add tags to a project
 * Requires authentication
 */
export async function addProjectTags(
  projectId: string,
  tagIds: string[],
): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyProjectTeamMembership(
      session.user.id,
      projectId,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to add tags to project',
      };
    }

    await addProjectTagsModel(projectId, tagIds);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to add tags to project' };
  }
}

/**
 * Remove tags from a project
 * Requires authentication
 */
export async function removeProjectTags(
  projectId: string,
  tagIds: string[],
): ActionResult<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isMember = await verifyProjectTeamMembership(
      session.user.id,
      projectId,
    );
    if (!isMember) {
      return {
        success: false,
        error: 'Forbidden: Must be a team member to remove tags from project',
      };
    }

    await removeProjectTagsModel(projectId, tagIds);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'Failed to remove tags from project' };
  }
}
