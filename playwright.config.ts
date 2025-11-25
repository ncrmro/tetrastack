import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env', quiet: true });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'dot',
  /* Global setup to seed database once before all tests */
  globalSetup: './tests/e2e/global-setup.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      `http://localhost:${process.env.WEB_PORT || 3000}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.E2E_COVERAGE
    ? undefined
    : {
        command: `node_modules/.bin/next dev --port ${process.env.WEB_PORT || 3000}`,
        url:
          process.env.PLAYWRIGHT_BASE_URL ||
          `http://localhost:${process.env.WEB_PORT || 3000}`,
        reuseExistingServer: !process.env.CI,
      },
});
