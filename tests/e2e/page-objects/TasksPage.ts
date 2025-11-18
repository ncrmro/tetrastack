import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TasksPage - Page Object Model for tasks pages
 *
 * Handles locators for the tasks list page and task detail page.
 * This POM contains only locators - assertions should be in test files.
 */
export class TasksPage extends BasePage {
  // Tasks List Page (/tasks)
  readonly pageHeading: Locator;
  readonly pageSubheading: Locator;

  // Task Stats
  readonly totalTasksStat: Locator;
  readonly todoTasksStat: Locator;
  readonly inProgressTasksStat: Locator;
  readonly completedTasksStat: Locator;

  // Empty State
  readonly emptyStateHeading: Locator;
  readonly emptyStateMessage: Locator;
  readonly viewProjectsButton: Locator;

  // Task List
  readonly taskList: Locator;

  // Task Detail Page (/tasks/[id])
  readonly backToTasksLink: Locator;
  readonly taskTitle: Locator;
  readonly taskDescription: Locator;

  // Task Metadata
  readonly metadataContainer: Locator;
  readonly statusBadge: Locator;
  readonly priorityIndicator: Locator;
  readonly projectLink: Locator;
  readonly dueDate: Locator;
  readonly createdDate: Locator;
  readonly updatedDate: Locator;

  // Comments Section
  readonly commentsHeading: Locator;
  readonly commentsContainer: Locator;
  readonly commentInput: Locator;
  readonly addCommentButton: Locator;

  constructor(page: Page) {
    super(page);

    // Tasks List Page
    this.pageHeading = page.getByRole('heading', { name: /your tasks/i });
    this.pageSubheading = page.getByText(/manage tasks assigned to you/i);

    // Task Stats - use nth() to select stat cards by position in the grid
    this.totalTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(0)
      .locator('div.mt-2');
    this.todoTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(1)
      .locator('div.mt-2');
    this.inProgressTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(2)
      .locator('div.mt-2');
    this.completedTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(3)
      .locator('div.mt-2');

    // Empty State
    this.emptyStateHeading = page.getByRole('heading', {
      name: /no tasks assigned/i,
    });
    this.emptyStateMessage = page.getByText(
      /tasks will appear here when they are assigned/i,
    );
    this.viewProjectsButton = page.getByRole('link', {
      name: /view projects/i,
    });

    // Task List
    this.taskList = page.locator('[data-testid="task-list"]');

    // Task Detail Page
    this.backToTasksLink = page.getByRole('link', { name: /← your tasks/i });
    this.taskTitle = page.getByRole('heading', { level: 1 });
    this.taskDescription = page.locator(
      'p.text-on-surface-variant.text-lg.whitespace-pre-wrap',
    );

    // Task Metadata
    this.metadataContainer = page.locator(
      'div.bg-surface.rounded-lg.border.border-outline',
    );
    this.statusBadge = page.locator('[data-testid="status-badge"]').first();
    this.priorityIndicator = page
      .locator('[data-testid="priority-indicator"]')
      .first();
    this.projectLink = page
      .locator('a[href^="/projects/"]')
      .filter({ hasText: /.+/ });
    this.dueDate = page
      .locator('div')
      .filter({ hasText: /due date/i })
      .locator('div')
      .filter({ hasText: /\d/ })
      .first();
    this.createdDate = page
      .locator('div')
      .filter({ hasText: /created/i })
      .locator('div.text-sm.text-on-surface')
      .first();
    this.updatedDate = page
      .locator('div')
      .filter({ hasText: /last updated/i })
      .locator('div.text-sm.text-on-surface')
      .first();

    // Comments Section (use h2 to avoid matching h3 inside comment-thread)
    this.commentsHeading = page.locator('h2').filter({ hasText: /comments/i });
    this.commentsContainer = page.locator('[data-testid="comment-thread"]');
    this.commentInput = page.getByRole('textbox', { name: /add a comment/i });
    this.addCommentButton = page.getByRole('button', { name: /post comment/i });
  }

  /**
   * Navigate to tasks list page
   */
  async navigateToTasks() {
    await this.goto('/tasks');
  }

  /**
   * Navigate to task detail page
   */
  async navigateToTask(id: string) {
    await this.goto(`/tasks/${id}`);
  }

  /**
   * Get a task card by title
   */
  getTaskCard(title: string): Locator {
    return this.page
      .locator('[data-testid="task-card"]')
      .filter({ hasText: title });
  }

  /**
   * Get a comment by content
   */
  getComment(content: string): Locator {
    return this.page
      .locator('[data-testid="comment"]')
      .filter({ hasText: content });
  }

  /**
   * Get the status badge text
   */
  async getStatusText(): Promise<string | null> {
    return await this.statusBadge.textContent();
  }

  /**
   * Get the priority text
   */
  async getPriorityText(): Promise<string | null> {
    return await this.priorityIndicator.textContent();
  }
}
