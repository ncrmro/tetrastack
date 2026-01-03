import { expect, test } from '@playwright/test';
import { generateUserCredentials } from './e2e/helpers';
import { BasePage } from './e2e/page-objects/BasePage';
import { SignInPage } from './e2e/page-objects/SignInPage';

test('Signout should redirect to home page', async ({ page }, testInfo) => {
  const basePage = new BasePage(page);

  await test.step('should sign in successfully', async () => {
    // Generate unique user credentials for this test
    const userCredentials = generateUserCredentials(testInfo, 'user');

    // Sign in via the sign in page
    const signInPage = new SignInPage(page);
    await signInPage.navigateToSignIn();
    await signInPage.signInWithPassword(userCredentials);
    // Navigate to account page to verify authentication
    await basePage.goto('/account');

    // Verify that we are authenticated and can access account page
    await expect(page.locator('h1')).toContainText('Account Settings');
  });

  await test.step('should redirect to home page after signout', async () => {
    // Sign out using the BasePage helper
    await basePage.signOut();

    // Wait for redirect to complete and verify we're on the home page
    await page.waitForURL('**/');

    // Verify we're on the home page by checking for landing page content
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Start Your Journey')).toBeVisible();

    // Verify we see sign in option (indicating we're logged out)
    await expect(page.getByText('Sign in')).toBeVisible();

    // Verify URL is exactly the home page
    expect(page.url()).toMatch(/.*\/$/);
  });
});
