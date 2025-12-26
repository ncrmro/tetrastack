/**
 * Factory for creating test project data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const project = projectFactory.build();
 *
 * // Use traits
 * const activeProject = projectFactory.active().highPriority().build();
 * const completedProject = projectFactory.completed().build();
 *
 * // Persist to database (auto-creates team)
 * const persistedProject = await projectFactory.create();
 *
 * // Persist with explicit team (when multiple projects share a team)
 * const team = await teamFactory.create();
 * const project1 = await projectFactory.create({ teamId: team.id });
 * const project2 = await projectFactory.create({ teamId: team.id });
 * ```
 */

import { Factory, db } from '@/lib/factories';
import { slugify } from '@tetrastack/backend/utils';
import { generateUniqueSlug } from '@/utils/generateUniqueSlug';
import type { InsertProject } from '@/database/schema.projects';
import {
  projects,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
} from '@/database/schema.projects';

/**
 * Project factory with trait methods for common project states.
 */
class ProjectFactory extends Factory<InsertProject> {
  /**
   * Create a planning status project
   */
  planning() {
    return this.params({ status: PROJECT_STATUS.PLANNING });
  }

  /**
   * Create an active status project
   */
  active() {
    return this.params({ status: PROJECT_STATUS.ACTIVE });
  }

  /**
   * Create a completed status project
   */
  completed() {
    return this.params({ status: PROJECT_STATUS.COMPLETED });
  }

  /**
   * Create an archived status project
   */
  archived() {
    return this.params({ status: PROJECT_STATUS.ARCHIVED });
  }

  /**
   * Create a low priority project
   */
  lowPriority() {
    return this.params({ priority: PROJECT_PRIORITY.LOW });
  }

  /**
   * Create a medium priority project
   */
  mediumPriority() {
    return this.params({ priority: PROJECT_PRIORITY.MEDIUM });
  }

  /**
   * Create a high priority project
   */
  highPriority() {
    return this.params({ priority: PROJECT_PRIORITY.HIGH });
  }

  /**
   * Create and persist a project to the database.
   * Automatically generates unique slug from title.
   * Automatically creates team if not provided.
   */
  async create(params?: Partial<InsertProject>) {
    const built = this.build(params);

    // Auto-create team if not provided
    let teamId = built.teamId;
    if (!teamId) {
      const { teamFactory } = await import('./team.factory');
      const team = await teamFactory.create();
      teamId = team.id;
    }

    // Generate unique slug from title
    const title = built.title || '';
    const baseSlug = slugify(title);

    // Get existing slugs to ensure uniqueness
    const existingProjects = await db
      .select({ slug: projects.slug })
      .from(projects);
    const existingSlugs = new Set(existingProjects.map((p) => p.slug));
    const slug = generateUniqueSlug(baseSlug, existingSlugs);

    // Construct DB insert object with all required fields including slug
    const insertData = {
      title: built.title || '',
      slug,
      teamId,
      description: built.description ?? null,
      status: built.status || PROJECT_STATUS.PLANNING,
      priority: built.priority || PROJECT_PRIORITY.MEDIUM,
      createdBy: built.createdBy ?? null,
    };
    const [created] = await db.insert(projects).values(insertData).returning();
    return created;
  }

  /**
   * Create and persist multiple projects to the database.
   * Automatically generates unique slugs for each project.
   * Automatically creates team if not provided (all projects share same team).
   */
  async createList(count: number, params?: Partial<InsertProject>) {
    // Auto-create team if not provided (shared by all projects in list)
    let teamId = params?.teamId;
    if (!teamId) {
      const { teamFactory } = await import('./team.factory');
      const team = await teamFactory.create();
      teamId = team.id;
    }

    // Get existing slugs to ensure uniqueness
    const existingProjects = await db
      .select({ slug: projects.slug })
      .from(projects);
    const existingSlugs = new Set(existingProjects.map((p) => p.slug));

    const projectList = this.buildList(count, params).map((built) => {
      const title = built.title || '';
      const baseSlug = slugify(title);
      const slug = generateUniqueSlug(baseSlug, existingSlugs);
      existingSlugs.add(slug); // Track slugs being created to avoid duplicates in this batch

      return {
        title: built.title || '',
        slug,
        teamId,
        description: built.description ?? null,
        status: built.status || PROJECT_STATUS.PLANNING,
        priority: built.priority || PROJECT_PRIORITY.MEDIUM,
        createdBy: built.createdBy ?? null,
      };
    });
    return await db.insert(projects).values(projectList).returning();
  }
}

export const projectFactory = ProjectFactory.define(() => {
  const title = Factory.faker.company.buzzPhrase();
  return {
    title,
    slug: slugify(title),
    description: Factory.faker.lorem.sentence(),
    status: PROJECT_STATUS.PLANNING,
    priority: PROJECT_PRIORITY.MEDIUM,
    teamId: '', // Auto-created if not provided
    createdBy: null,
  };
});
