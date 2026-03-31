import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * TeamsPage - Page Object Model for teams pages
 *
 * Handles locators for the teams list page, team detail page, and team settings.
 * This POM contains only locators - assertions should be in test files.
 */
export class TeamsPage extends BasePage {
  // Teams List Page (/teams)
  readonly pageHeading: Locator;
  readonly pageSubheading: Locator;
  readonly createTeamButton: Locator;
  readonly teamsGrid: Locator;
  readonly emptyStateHeading: Locator;
  readonly emptyStateMessage: Locator;
  readonly createFirstTeamButton: Locator;

  // Team Detail Page (/teams/[id])
  readonly backToTeamsLink: Locator;
  readonly teamName: Locator;
  readonly teamDescription: Locator;
  readonly settingsButton: Locator;

  // Team Stats
  readonly membersStat: Locator;
  readonly projectsStat: Locator;
  readonly activeProjectsStat: Locator;

  // Team Members Section
  readonly membersHeading: Locator;
  readonly membersContainer: Locator;

  // Team Projects Section
  readonly projectsHeading: Locator;
  readonly projectsGrid: Locator;

  // Team Form (New/Edit)
  readonly teamNameInput: Locator;
  readonly teamDescriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Team Settings
  readonly settingsPageHeading: Locator;
  readonly editInfoSection: Locator;
  readonly manageMembersSection: Locator;
  readonly addMemberButton: Locator;
  readonly memberEmailInput: Locator;

  constructor(page: Page) {
    super(page);

    // Teams List Page
    this.pageHeading = page.getByRole('heading', { name: /^teams$/i });
    this.pageSubheading = page.getByText(
      /manage your teams and collaborations/i,
    );
    this.createTeamButton = page.getByRole('link', { name: /create team/i });
    this.teamsGrid = page.locator('div.grid.gap-6');
    this.emptyStateHeading = page.getByRole('heading', {
      name: /no teams yet/i,
    });
    this.emptyStateMessage = page.getByText(
      /create a team to start collaborating/i,
    );
    this.createFirstTeamButton = page.getByRole('link', {
      name: /create your first team/i,
    });

    // Team Detail Page
    this.backToTeamsLink = page.getByRole('link', { name: /← teams/i });
    this.teamName = page.getByRole('heading', { level: 1 });
    this.teamDescription = page.locator('p.text-on-surface-variant.max-w-3xl');
    this.settingsButton = page.getByRole('link', { name: /settings/i });

    // Team Stats - use grid structure instead of bg-surface class
    // Stats are in a grid container after the header, look for text-3xl elements in cards
    this.membersStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('div')
      .filter({ hasText: /^members$/i })
      .locator('..') // parent
      .locator('div.text-3xl')
      .first();
    this.projectsStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('div')
      .filter({ hasText: /^projects$/i })
      .locator('..') // parent
      .locator('div.text-3xl')
      .first();
    this.activeProjectsStat = page
      .locator('div.grid.gap-6')
      .first()
      .locator('div')
      .filter({ hasText: /^active projects$/i })
      .locator('..') // parent
      .locator('div.text-3xl')
      .first();

    // Team Members Section
    this.membersHeading = page.getByRole('heading', { name: /team members/i });
    this.membersContainer = page
      .getByRole('heading', { name: /team members/i })
      .locator('..')
      .locator('div.bg-surface.rounded-lg.border.border-outline');

    // Team Projects Section
    this.projectsHeading = page.getByRole('heading', {
      name: /^projects$/i,
      level: 2,
    });
    this.projectsGrid = page
      .locator('div.grid')
      .filter({ has: page.locator('[data-testid="project-card"]') });

    // Team Form
    this.teamNameInput = page.getByLabel(/name/i);
    this.teamDescriptionInput = page.getByLabel(/description/i);
    this.saveButton = page.getByRole('button', { name: /save|create/i });
    this.cancelButton = page.getByRole('link', { name: /cancel/i });

    // Team Settings
    this.settingsPageHeading = page.getByRole('heading', {
      name: /team settings/i,
    });
    this.editInfoSection = page
      .locator('section')
      .filter({ has: page.getByText(/team information/i) });
    this.manageMembersSection = page
      .locator('section')
      .filter({ has: page.getByText(/team members/i) });
    this.addMemberButton = page.getByRole('button', { name: /add member/i });
    this.memberEmailInput = page.getByLabel(/email/i);
  }

  /**
   * Navigate to teams list page
   */
  async navigateToTeams() {
    await this.goto('/teams');
  }

  /**
   * Navigate to team detail page
   */
  async navigateToTeam(id: string) {
    await this.goto(`/teams/${id}`);
  }

  /**
   * Navigate to create team page
   */
  async navigateToCreateTeam() {
    await this.goto('/teams/new');
  }

  /**
   * Navigate to team settings page
   */
  async navigateToTeamSettings(id: string) {
    await this.goto(`/teams/${id}/settings`);
  }

  /**
   * Get a team card by name
   */
  getTeamCard(name: string): Locator {
    return this.page
      .locator('[data-testid="team-card"]')
      .filter({ hasText: name });
  }

  /**
   * Get a member row by name
   */
  getMemberRow(name: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: new RegExp(`^${name}`, 'i') });
  }

  /**
   * Get member role badge
   */
  getMemberRole(name: string): Locator {
    return this.getMemberRow(name).locator('span.rounded-full');
  }
}
