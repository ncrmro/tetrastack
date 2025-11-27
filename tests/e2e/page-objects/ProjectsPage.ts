import type { Locator, Page } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * ProjectsPage - Page Object Model for projects pages
 *
 * Handles locators for the projects list page, project detail page, and project creation/edit forms.
 * This POM contains only locators - assertions should be in test files.
 */
export class ProjectsPage extends BasePage {
  // Projects List Page (/projects)
  readonly pageHeading: Locator
  readonly createProjectButton: Locator
  readonly generateWithAIButton: Locator
  readonly statusFilter: Locator
  readonly priorityFilter: Locator
  readonly teamFilter: Locator
  readonly projectsGrid: Locator
  readonly emptyStateHeading: Locator
  readonly emptyStateMessage: Locator

  // Project Detail Page (/projects/[id])
  readonly backToProjectsLink: Locator
  readonly projectTitle: Locator
  readonly projectDescription: Locator
  readonly editProjectButton: Locator
  readonly statusBadge: Locator
  readonly priorityIndicator: Locator
  readonly tagsContainer: Locator

  // Project Stats
  readonly totalTasksStat: Locator
  readonly todoTasksStat: Locator
  readonly inProgressTasksStat: Locator
  readonly doneTasksStat: Locator

  // Project Tasks Section
  readonly tasksHeading: Locator
  readonly addTaskButton: Locator

  // Project Form (New/Edit)
  readonly titleInput: Locator
  readonly descriptionInput: Locator
  readonly statusSelect: Locator
  readonly prioritySelect: Locator
  readonly teamSelect: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    super(page)

    // Projects List Page
    this.pageHeading = page.getByRole('heading', {
      name: 'Projects',
      exact: true,
      level: 1,
    })
    this.createProjectButton = page
      .getByRole('link', {
        name: /create project/i,
      })
      .first()
    this.generateWithAIButton = page
      .getByRole('link', {
        name: /generate with ai/i,
      })
      .first()
    this.statusFilter = page
      .locator('select')
      .filter({ hasText: /all statuses/i })
    this.priorityFilter = page
      .locator('select')
      .filter({ hasText: /all priorities/i })
    this.teamFilter = page.locator('select').filter({ hasText: /all teams/i })
    this.projectsGrid = page
      .locator('div.grid')
      .filter({ has: page.locator('[data-testid="project-card"]') })
    this.emptyStateHeading = page.getByRole('heading', {
      name: /no projects found/i,
    })
    this.emptyStateMessage = page.getByText(
      /get started by creating your first project/i,
    )

    // Project Detail Page
    this.backToProjectsLink = page.getByRole('link', { name: /← projects/i })
    this.projectTitle = page.getByRole('heading', { level: 1 })
    this.projectDescription = page.locator('p.text-on-surface-variant.text-lg')
    this.editProjectButton = page.getByRole('link', { name: /edit project/i })
    this.statusBadge = page.locator('[data-testid="status-badge"]').first()
    this.priorityIndicator = page
      .locator('[data-testid="priority-indicator"]')
      .first()
    this.tagsContainer = page
      .locator('div')
      .filter({ has: page.locator('span[style*="backgroundColor"]') })

    // Project Stats - use nth() to select stat cards by position
    // Note: On project detail page, stats grid is the first grid (before tasks section)
    this.totalTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(0)
      .locator('div.mt-2')
    this.todoTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(1)
      .locator('div.mt-2')
    this.inProgressTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(2)
      .locator('div.mt-2')
    this.doneTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(3)
      .locator('div.mt-2')

    // Project Tasks Section
    this.tasksHeading = page.getByRole('heading', { name: /tasks/i })
    this.addTaskButton = page.getByRole('link', { name: /add task/i })

    // Project Form
    this.titleInput = page.getByLabel(/title/i)
    this.descriptionInput = page.getByLabel(/description/i)
    this.statusSelect = page.getByLabel(/status/i)
    this.prioritySelect = page.getByLabel(/priority/i)
    this.teamSelect = page.getByLabel(/team/i)
    this.saveButton = page.getByRole('button', { name: /save|create/i })
    this.cancelButton = page.getByRole('link', { name: /cancel/i })
  }

  /**
   * Navigate to projects list page
   */
  async navigateToProjects() {
    await this.goto('/projects')
  }

  /**
   * Navigate to project detail page
   */
  async navigateToProject(idOrSlug: string) {
    await this.goto(`/projects/${idOrSlug}`)
  }

  /**
   * Navigate to create project page
   */
  async navigateToCreateProject() {
    await this.goto('/projects/new')
  }

  /**
   * Navigate to edit project page
   */
  async navigateToEditProject(idOrSlug: string) {
    await this.goto(`/projects/${idOrSlug}/edit`)
  }

  /**
   * Navigate to AI project generation page
   */
  async navigateToGenerateProject() {
    await this.goto('/projects/generate')
  }

  /**
   * Get a project card by title
   */
  getProjectCard(title: string): Locator {
    return this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: title })
  }

  /**
   * Get a tag by name
   */
  getTag(tagName: string): Locator {
    return this.page
      .locator('span')
      .filter({ hasText: new RegExp(`^${tagName}$`, 'i') })
  }
}
