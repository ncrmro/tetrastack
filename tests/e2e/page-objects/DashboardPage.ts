import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - Page Object Model for the dashboard page
 *
 * Handles locators for the main dashboard overview page.
 * This POM contains only locators - assertions should be in test files.
 */
export class DashboardPage extends BasePage {
  // Page Header
  readonly pageHeading: Locator;
  readonly welcomeMessage: Locator;

  // Dashboard Stats
  readonly teamsStat: Locator;
  readonly activeProjectsStat: Locator;
  readonly pendingTasksStat: Locator;
  readonly inProgressTasksStat: Locator;

  // Your Teams Section
  readonly yourTeamsHeading: Locator;
  readonly viewAllTeamsLink: Locator;
  readonly teamsGrid: Locator;
  readonly noTeamsMessage: Locator;
  readonly createTeamButton: Locator;

  // Recent Projects Section
  readonly recentProjectsHeading: Locator;
  readonly viewAllProjectsLink: Locator;
  readonly projectsGrid: Locator;
  readonly noProjectsMessage: Locator;
  readonly createProjectButton: Locator;
  readonly generateProjectButton: Locator;

  // Recent Tasks Section
  readonly recentTasksHeading: Locator;
  readonly viewAllTasksLink: Locator;
  readonly tasksGrid: Locator;
  readonly noTasksMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Page Header
    this.pageHeading = page.getByRole('heading', { name: /^dashboard$/i });
    this.welcomeMessage = page.getByText(/welcome back,/i);

    // Dashboard Stats - use nth() to select stat cards by position in the grid
    this.teamsStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(0)
      .locator('div.mt-2');
    this.activeProjectsStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(1)
      .locator('div.mt-2');
    this.pendingTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(2)
      .locator('div.mt-2');
    this.inProgressTasksStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('> div')
      .nth(3)
      .locator('div.mt-2');

    // Your Teams Section
    this.yourTeamsHeading = page.getByRole('heading', { name: /your teams/i });
    this.viewAllTeamsLink = page
      .getByRole('link', { name: /view all →/i })
      .first();
    this.teamsGrid = page
      .locator('div.grid.gap-4')
      .filter({ has: page.locator('a[href^="/teams/"]') })
      .first();
    this.noTeamsMessage = page.getByText(/you are not part of any teams yet/i);
    this.createTeamButton = page.getByRole('link', { name: /create a team/i });

    // Recent Projects Section
    this.recentProjectsHeading = page.getByRole('heading', {
      name: /recent projects/i,
    });
    this.viewAllProjectsLink = page
      .getByRole('link', { name: /view all →/i })
      .nth(1);
    this.projectsGrid = page
      .locator('div.grid.gap-4')
      .filter({ has: page.locator('[data-testid="project-card"]') });
    this.noProjectsMessage = page.getByText(/no projects yet/i);
    this.createProjectButton = page.getByRole('link', {
      name: /create project/i,
    });
    this.generateProjectButton = page.getByRole('link', {
      name: /generate with ai/i,
    });

    // Recent Tasks Section
    this.recentTasksHeading = page.getByRole('heading', {
      name: /recent tasks/i,
    });
    this.viewAllTasksLink = page
      .getByRole('link', { name: /view all →/i })
      .last();
    this.tasksGrid = page
      .locator('div.grid.gap-4')
      .filter({ has: page.locator('[data-testid="task-card"]') });
    this.noTasksMessage = page.getByText(/no tasks assigned to you/i);
  }

  /**
   * Navigate to dashboard page
   */
  async navigateToDashboard() {
    await this.goto('/dashboard');
  }

  /**
   * Get a team card by name
   */
  getTeamCard(name: string): Locator {
    return this.page.locator('a[href^="/teams/"]').filter({ hasText: name });
  }

  /**
   * Get a project card by title
   */
  getProjectCard(title: string): Locator {
    return this.page
      .locator('[data-testid="project-card"]')
      .filter({ hasText: title });
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
   * Get the welcome message text
   */
  async getWelcomeMessage(): Promise<string | null> {
    return await this.welcomeMessage.textContent();
  }

  /**
   * Get a stat value
   */
  async getStatValue(
    statName: 'teams' | 'active-projects' | 'pending-tasks' | 'in-progress',
  ): Promise<string | null> {
    switch (statName) {
      case 'teams':
        return await this.teamsStat.textContent();
      case 'active-projects':
        return await this.activeProjectsStat.textContent();
      case 'pending-tasks':
        return await this.pendingTasksStat.textContent();
      case 'in-progress':
        return await this.inProgressTasksStat.textContent();
    }
  }
}
