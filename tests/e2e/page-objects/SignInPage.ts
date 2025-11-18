import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * SignInPage - Page Object Model for the authentication/signin page
 *
 * Handles interactions with the signin page including password authentication
 * and verification of signin page elements.
 */
export class SignInPage extends BasePage {
  // SignIn page specific elements
  private readonly passwordInput = this.page.getByLabel('Password');
  readonly signInFormButton = this.page.getByRole('button', {
    name: 'Sign in with Password',
  });
  private readonly signInHeading = this.page.getByRole('heading', {
    name: /sign in/i,
  });
  private readonly authProviders = this.page.locator(
    '[data-testid="auth-providers"]',
  );

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to sign in page
   */
  async navigateToSignIn() {
    await this.goto('/api/auth/signin');
  }

  /**
   * Verify we are on the sign in page
   */
  async verifyOnSignInPage() {
    await expect(this.page).toHaveURL(/.*\/api\/auth\/signin.*/);
  }

  /**
   * Verify sign in page content is displayed
   */
  async verifySignInPageContent() {
    await expect(this.signInHeading).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInFormButton).toBeVisible();
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click sign in with password button
   */
  async clickSignInWithPassword() {
    await this.signInFormButton.click();
  }

  /**
   * Complete sign in flow with password
   * Note: This method has issues in Docker environments due to NextAuth redirect handling
   */
  async signInWithPassword(password: string) {
    await this.fillPassword(password);

    // Click sign in button
    await this.clickSignInWithPassword();

    // Wait for NextAuth redirect to complete
    await this.page.waitForURL(
      (url) => !url.href.includes('/api/auth/signin'),
      {
        timeout: 15000,
      },
    );

    await this.verifyAuthenticated();
  }
}
