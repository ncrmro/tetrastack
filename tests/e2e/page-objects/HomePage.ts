import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage - Page Object Model for the landing page
 *
 * Handles navigation and element locators for the Next.js boilerplate landing page.
 * This POM contains only locators - assertions should be in test files.
 */
export class HomePage extends BasePage {
  // Hero section elements
  readonly heroHeading = this.page.getByRole('heading', {
    name: /next\.js boilerplate/i,
  });
  readonly heroSubheading = this.page.getByRole('heading', {
    name: /architectural patterns done right/i,
  });
  readonly viewDashboardLink = this.page.getByRole('link', {
    name: /view dashboard/i,
  });
  readonly exploreProjectsLink = this.page.getByRole('link', {
    name: /explore projects/i,
  });

  // Features section
  readonly featuresHeading = this.page.getByRole('heading', {
    name: /built-in features/i,
  });
  readonly multiTenantFeature = this.page.getByRole('heading', {
    name: /multi-tenant teams/i,
  });
  readonly aiIntegrationFeature = this.page.getByRole('heading', {
    name: /ai integration/i,
  });
  readonly taskManagementFeature = this.page.getByRole('heading', {
    name: /task management/i,
  });
  readonly testingFeature = this.page.getByRole('heading', {
    name: /comprehensive testing/i,
  });

  // Architecture section
  readonly architectureHeading = this.page.getByRole('heading', {
    name: /modern architecture/i,
  });
  readonly databaseLayerCard = this.page.getByRole('heading', {
    name: /database layer/i,
  });
  readonly modelsLayerCard = this.page.getByRole('heading', {
    name: /models layer/i,
  });

  // Tech stack section
  readonly techStackHeading = this.page.getByRole('heading', {
    name: /tech stack/i,
  });

  /**
   * Navigate to home page
   */
  async navigateToHome() {
    await this.goto('/');
  }

  /**
   * Verify we are on the home page
   */
  async verifyOnHomePage() {
    await expect(this.page).toHaveURL('/');
  }
}
