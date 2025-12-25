import { db } from '@/database';
import {
  projects,
  projectTags,
  insertProjectSchema,
} from '@/database/schema.projects';
import type {
  InsertProject,
  ProjectStatus,
  ProjectPriority,
} from '@/database/schema.projects';
import { and, eq, inArray } from 'drizzle-orm';
import { slugify } from '@tetrastack/backend/utils';
import { generateUniqueSlug } from '@/utils/generateUniqueSlug';
import { createModelFactory } from '@/lib/models';

// Get base CRUD functions from factory
const {
  select: selectProjects,
  delete: deleteProjects,
  buildConditions,
  takeFirst: takeFirstProject,
} = createModelFactory('projects', projects, projects.id, insertProjectSchema);

// Re-export base factory functions (will be augmented with custom functions below)
export { selectProjects, deleteProjects, buildConditions, takeFirstProject };

/**
 * Custom insert with slug generation
 * Overrides the base insert function to add unique slug generation
 */
export async function insertProjects(data: InsertProject[]) {
  // Validate input data first
  const validated = data.map((item) => insertProjectSchema.parse(item));

  // Get all existing slugs to ensure uniqueness
  const existingProjects = await db
    .select({ slug: projects.slug })
    .from(projects);
  const existingSlugs = new Set(existingProjects.map((p) => p.slug));

  // Generate slugs for each project
  const itemsWithSlugs = validated.map((item) => {
    const baseSlug = slugify(item.title);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    existingSlugs.add(uniqueSlug); // Add to set to prevent duplicates within this batch
    return { ...item, slug: uniqueSlug };
  });

  // Insert directly without using baseInsert to preserve slugs
  return db.insert(projects).values(itemsWithSlugs).returning();
}

/**
 * Custom update with slug regeneration
 * Overrides the base update function to regenerate slug when title is updated
 */
export async function updateProjects(
  conditions: Parameters<typeof and>,
  data: Partial<InsertProject>,
) {
  let updateData: Partial<InsertProject> & { slug?: string } = { ...data };

  // If title is being updated, regenerate slug
  if (data.title) {
    // Get all existing slugs to ensure uniqueness
    const allProjects = await db.select({ slug: projects.slug }).from(projects);
    const existingSlugs = new Set(allProjects.map((p) => p.slug));

    const baseSlug = slugify(data.title);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
    updateData = { ...updateData, slug: uniqueSlug };
  }

  return db
    .update(projects)
    .set(updateData)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .returning();
}

/**
 * Get projects with flexible filtering using WHERE IN clauses
 * All parameters are optional arrays for bulk operations
 *
 * @example
 * // Get by IDs
 * await getProjects({ ids: ['proj-uuid-1', 'proj-uuid-2'] })
 *
 * @example
 * // Get by team and status
 * await getProjects({ teamIds: ['team-1'], status: ['active', 'planning'] })
 */
export async function getProjects(params: {
  ids?: string[];
  slugs?: string[];
  teamIds?: string[];
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
}) {
  const conditions = [];

  if (params.ids) {
    conditions.push(inArray(projects.id, params.ids));
  }

  if (params.slugs) {
    conditions.push(inArray(projects.slug, params.slugs));
  }

  if (params.teamIds) {
    conditions.push(inArray(projects.teamId, params.teamIds));
  }

  if (params.status) {
    conditions.push(inArray(projects.status, params.status));
  }

  if (params.priority) {
    conditions.push(inArray(projects.priority, params.priority));
  }

  return await db.query.projects.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
}

/**
 * Get a project with its tags
 * Uses Drizzle relations for efficient querying
 *
 * @param id - Project ID
 * @returns Project with tags or undefined if not found
 */
export async function getProjectWithTags(id: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });
}

/**
 * Add tags to a project
 * Skips tags that are already associated
 *
 * @param projectId - Project ID
 * @param tagIds - Array of tag IDs to add
 */
export async function addProjectTags(projectId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;

  // Get existing tags to avoid duplicates
  const existing = await db
    .select({ tagId: projectTags.tagId })
    .from(projectTags)
    .where(eq(projectTags.projectId, projectId));

  const existingTagIds = new Set(existing.map((t) => t.tagId));
  const newTagIds = tagIds.filter((id) => !existingTagIds.has(id));

  if (newTagIds.length === 0) return;

  const values = newTagIds.map((tagId) => ({ projectId, tagId }));
  await db.insert(projectTags).values(values);
}

/**
 * Remove tags from a project
 *
 * @param projectId - Project ID
 * @param tagIds - Array of tag IDs to remove
 */
export async function removeProjectTags(projectId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;

  await db
    .delete(projectTags)
    .where(
      and(
        eq(projectTags.projectId, projectId),
        inArray(projectTags.tagId, tagIds),
      ),
    );
}
