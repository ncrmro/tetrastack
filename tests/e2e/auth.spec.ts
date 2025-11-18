import { test, expect } from './fixtures/base-fixtures';
import { generateUserCredentials } from './helpers';
import { BasePage } from './page-objects/BasePage';
import { HomePage } from './page-objects/HomePage';
import { SignInPage } from './page-objects/SignInPage';

// UI-based authentication test - works with AUTH_URL set to Docker service name
// Cookie-based auth (used by other E2E tests) is still preferred for speed
test('Authentication', async ({ unauthenticatedUser }, testInfo) => {
  const { page } = unauthenticatedUser;
  const basePage = new BasePage(page);
  const homePage = new HomePage(page);
  const signInPage = new SignInPage(page);
  const userCredentials = generateUserCredentials(testInfo, 'user');

  await test.step('should login', async () => {
    // First navigate to homepage to ensure we start in unauthenticated state
    await basePage.goto('/');
    await basePage.verifyUnauthenticated();

    // Use BasePage signInNavButton to navigate to sign-in page
    await basePage.signInNavButton.click();
    await signInPage.verifyOnSignInPage();

    // Now use SignInPage for authentication form interactions
    await signInPage.signInWithPassword(userCredentials);

    // After successful login, should be redirected to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: /dashboard/i }),
    ).toBeVisible();
  });

  await test.step('should logout', async () => {
    await basePage.signOut();

    // Verify we are redirected to home page and see unauthenticated state
    await homePage.verifyOnHomePage();
    await basePage.verifyUnauthenticated();
  });
});
