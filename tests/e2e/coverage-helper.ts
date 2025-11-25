import { Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Directory to store coverage data
const coverageDir = join(process.cwd(), '.nyc_output');

/**
 * Initialize coverage collection for a page
 * Should be called before navigating to the app
 */
export async function startCoverage(page: Page) {
  // Coverage is only available when E2E_COVERAGE=1
  if (process.env.E2E_COVERAGE !== '1') {
    return;
  }

  await page.coverage.startJSCoverage({
    resetOnNavigation: false,
  });
}

/**
 * Save coverage data collected from a page
 * Should be called at the end of each test
 */
export async function saveCoverage(page: Page, testName: string) {
  // Coverage is only available when E2E_COVERAGE=1
  if (process.env.E2E_COVERAGE !== '1') {
    return;
  }

  const coverage = await page.coverage.stopJSCoverage();

  // Ensure coverage directory exists
  mkdirSync(coverageDir, { recursive: true });

  // Save coverage data
  const coverageFile = join(
    coverageDir,
    `playwright-${testName.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.json`,
  );

  writeFileSync(coverageFile, JSON.stringify(coverage, null, 2));
}
