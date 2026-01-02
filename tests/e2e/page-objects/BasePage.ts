import { expect, type Locator, type Page } from '@playwright/test';

/**
 * BasePage - Page Object Model for common navigation and interaction patterns
 *
 * Handles navigation via navbar and account dropdown for both desktop and mobile views.
 * All e2e tests should extend or use this class for navigation consistency.
 *
 * @example
 * ```typescript
 * import { BasePage } from './page-objects/BasePage';
 * import { SignInPage } from './page-objects/SignInPage';
 *
 * test('my test', async ({ page }) => {
 *   const basePage = new BasePage(page);
 *   const signInPage = new SignInPage(page);
 *
 *   // Navigate to a page
 *   await basePage.goto('/account');
 *
 *   // Sign in with development credentials using dedicated SignInPage
 *   await signInPage.signInWithPassword('admin');
 *
 *   // Navigate via navbar (handles mobile/desktop automatically)
 *   await basePage.navigateToMealPlan();
 *
 *   // Navigate via account dropdown (handles mobile/desktop automatically)
 *   await basePage.navigateToAccount();
 *
 *   // Sign out (handles mobile/desktop automatically)
 *   await basePage.signOut();
 *
 *   // Verify page content
 *   await expect(page.getByRole('heading', { name: 'Expected Heading' })).toBeVisible();
 *   await basePage.verifyUrl('/expected-url');
 * });
 * ```
 */
export class BasePage {
  readonly page: Page;

  // Navigation elements
  readonly logoLink: Locator;
  readonly mobileMenuButton: Locator;
  readonly accountDropdownTrigger: Locator;
  readonly accountDropdownMenu: Locator;

  // Desktop navigation links (when authenticated)
  readonly mealPlanLink: Locator;
  readonly mealPrepLink: Locator;
  readonly shoppingListLink: Locator;
  readonly nutritionLink: Locator;
  readonly householdLink: Locator;
  readonly accountLink: Locator;
  readonly adminLink: Locator;

  // Auth buttons
  readonly signInNavButton: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation elements
    this.logoLink = page.locator('a:has-text("Meze")').first();
    this.mobileMenuButton = page.locator('[aria-label="Toggle mobile menu"]');
    this.accountDropdownTrigger = page.locator(
      '[data-testid="account-dropdown-trigger"]',
    );
    this.accountDropdownMenu = page.locator(
      '[data-testid="account-dropdown-menu"]',
    );

    // Desktop navigation links (in navbar when authenticated)
    this.mealPlanLink = page.locator('a[href="/meal-plan"]').first();
    this.mealPrepLink = page.locator('a[href="/meal-prep"]').first();
    this.shoppingListLink = page.locator('a[href="/shopping-list"]').first();
    this.nutritionLink = page.locator('a[href="/nutrition"]').first();
    this.householdLink = page.locator('a[href="/household"]').first();
    this.accountLink = page.locator('a[href="/account"]').first();
    this.adminLink = page.locator('a[href="/admin"]').first();

    // Auth buttons - use case-insensitive matching since button text is "Sign in" not "Sign In"
    this.signInNavButton = page
      .locator('nav')
      .getByRole('button', { name: /sign in/i });

    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }

  /**
   * Navigate to a page via URL
   */
  async goto(url: string) {
    await this.page.goto(url);
  }

  /**
   * Click the logo to go to homepage
   */
  async goHome() {
    await this.logoLink.click();
  }

  /**
   * Check if we're in mobile view (mobile menu button is visible)
   */
  async isMobileView(): Promise<boolean> {
    return await this.mobileMenuButton.isVisible();
  }

  /**
   * Open mobile menu (if in mobile view)
   */
  async openMobileMenu() {
    if (await this.isMobileView()) {
      await this.mobileMenuButton.click();
    }
  }

  /**
   * Close mobile menu (if in mobile view and menu is open)
   */
  async closeMobileMenu() {
    if (await this.isMobileView()) {
      // Click the X button or click outside
      const closeButton = this.page.locator('[aria-label="Close mobile menu"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  }

  /**
   * Open account dropdown (if in desktop view)
   *
   * IMPORTANT: Timing Issue Fix
   * The dropdown doesn't always open correctly if we try to click too fast after page load.
   * We wait for the trigger to be fully attached and interactive before clicking.
   *
   * Radix UI dropdowns render content in a portal, so we wait for the menu to appear after clicking.
   */
  async openAccountDropdown() {
    if (!(await this.isMobileView())) {
      // Ensure trigger is visible and fully attached (with pointer events enabled)
      await this.accountDropdownTrigger.waitFor({ state: 'visible' });

      // Wait for trigger to be fully interactive by checking it's enabled
      await expect(this.accountDropdownTrigger).toBeEnabled();

      // Click the dropdown trigger
      await this.accountDropdownTrigger.click();

      // The dropdown menu appears in a portal and may take a moment to render
      // Using expect().toBeVisible() which has built-in retry logic
      await expect(this.accountDropdownMenu).toBeVisible({ timeout: 10000 });
    }
  }

  /**
   * Navigate to a page via navbar links (handles both desktop and mobile)
   */
  async navigateToMealPlan() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Meal Plan').click();
    } else {
      await this.mealPlanLink.click();
    }
  }

  async navigateToMealPrep() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Meal Prep').click();
    } else {
      await this.mealPrepLink.click();
    }
  }

  async navigateToShoppingList() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Shopping List').click();
    } else {
      await this.shoppingListLink.click();
    }
  }

  async navigateToNutrition() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Nutrition').click();
    } else {
      await this.nutritionLink.click();
    }
  }

  async navigateToHousehold() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Household').click();
    } else {
      await this.householdLink.click();
    }
  }

  /**
   * Navigate to account page via dropdown (handles both desktop and mobile)
   *
   * Note: Due to Radix UI dropdown issues in headless browsers, we navigate directly
   * to /account instead of using the dropdown menu for now.
   */
  async navigateToAccount() {
    // Check if user is authenticated first (account dropdown should be visible)
    const isAuthenticated = await this.accountDropdownTrigger.isVisible();
    if (!isAuthenticated) {
      throw new Error('User is not authenticated - account dropdown not found');
    }

    // Navigate directly to account page
    // TODO: Fix Radix UI dropdown interaction in headless mode
    await this.page.goto('/account');
  }

  /**
   * Navigate to admin page via dropdown (handles both desktop and mobile)
   */
  async navigateToAdmin() {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText('Admin').click();
    } else {
      await this.openAccountDropdown();
      await this.accountDropdownMenu.locator('a:has-text("Admin")').click();
    }
  }

  /**
   * Navigate to any page via account dropdown or mobile menu
   * This is a generic method that can handle any link text
   */
  async navigateViaAccountDropdown(linkText: string) {
    if (await this.isMobileView()) {
      await this.openMobileMenu();
      await this.page.getByText(linkText).click();
    } else {
      await this.openAccountDropdown();
      await this.page.click(`[role="menu"] a:has-text("${linkText}")`);
    }
  }

  /**
   * Verify user is authenticated by checking for account dropdown
   */
  async verifyAuthenticated() {
    await this.accountDropdownTrigger.waitFor();
  }

  /**
   * Verify user is unauthenticated by checking for sign in button in navigation
   */
  async verifyUnauthenticated() {
    await expect(this.signInNavButton).toBeVisible();
  }

  /**
   * Sign out via dropdown
   */
  async signOut() {
    await this.openAccountDropdown();
    await this.signOutButton.click();
    await this.page.waitForURL('/'); // Wait for redirect to home page
  }

  /**
   * Verify that we're on a specific page by checking the URL
   */
  async verifyUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Verify that we're on a page by checking for specific text content
   */
  async verifyPageContent(text: string) {
    await expect(this.page.locator('body')).toContainText(text);
  }
}
