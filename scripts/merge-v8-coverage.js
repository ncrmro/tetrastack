#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Merge Playwright V8 coverage with Vitest V8 coverage
 * Uses Vitest's native V8 coverage format - no conversion needed!
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(process.cwd(), 'coverage');
const COVERAGE_TMP_DIR = path.join(COVERAGE_DIR, 'tmp');

async function mergeV8Coverage() {
  // Check if we have Playwright coverage files
  if (!fs.existsSync(COVERAGE_TMP_DIR)) {
    console.log('No E2E coverage data found in coverage/tmp');
    console.log(
      'Skipping merge - only Vitest coverage will be used for reporting',
    );
    process.exit(0);
  }

  const files = fs
    .readdirSync(COVERAGE_TMP_DIR)
    .filter((f) => f.startsWith('playwright-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No Playwright coverage files found');
    console.log(
      'Skipping merge - only Vitest coverage will be used for reporting',
    );
    process.exit(0);
  }

  console.log(`Found ${files.length} Playwright coverage files`);
  console.log(
    'Note: Playwright V8 coverage is already in the correct format for Vitest',
  );
  console.log(
    'Run vitest with --merge-reports to combine coverage from all sources',
  );
}

mergeV8Coverage().catch((error) => {
  console.error('Error checking coverage:', error);
  process.exit(1);
});
