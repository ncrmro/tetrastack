#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Merge E2E coverage with Vitest coverage
 * This script combines coverage data from both sources into a single report
 */

const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(process.cwd(), 'coverage');
const VITEST_COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage-final.json');
const E2E_COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage-e2e.json');
const MERGED_COVERAGE_FILE = path.join(COVERAGE_DIR, 'coverage-merged.json');

async function mergeCoverage() {
  const coverageMap = createCoverageMap({});

  // Load Vitest coverage if it exists
  if (fs.existsSync(VITEST_COVERAGE_FILE)) {
    console.log('Loading Vitest coverage...');
    const vitestCoverage = JSON.parse(
      fs.readFileSync(VITEST_COVERAGE_FILE, 'utf8'),
    );
    coverageMap.merge(vitestCoverage);
    console.log('✓ Vitest coverage loaded');
  } else {
    console.log('No Vitest coverage found');
  }

  // Load E2E coverage if it exists
  if (fs.existsSync(E2E_COVERAGE_FILE)) {
    console.log('Loading E2E coverage...');
    const e2eCoverage = JSON.parse(fs.readFileSync(E2E_COVERAGE_FILE, 'utf8'));
    coverageMap.merge(e2eCoverage);
    console.log('✓ E2E coverage loaded');
  } else {
    console.log('No E2E coverage found');
  }

  // Check if we have any coverage data
  if (Object.keys(coverageMap.data).length === 0) {
    console.log('No coverage data to merge');
    process.exit(0);
  }

  // Write merged coverage
  fs.writeFileSync(
    MERGED_COVERAGE_FILE,
    JSON.stringify(coverageMap.data, null, 2),
  );
  console.log(`✓ Merged coverage written to ${MERGED_COVERAGE_FILE}`);

  // Generate reports from merged data
  const context = createContext({
    dir: COVERAGE_DIR,
    coverageMap,
  });

  const reportTypes = ['json-summary', 'lcov', 'html', 'text'];
  reportTypes.forEach((reportType) => {
    const report = reports.create(reportType, {});
    report.execute(context);
  });

  // Also update the main coverage-final.json with merged data
  fs.writeFileSync(
    VITEST_COVERAGE_FILE,
    JSON.stringify(coverageMap.data, null, 2),
  );

  console.log('✓ Coverage merge complete');
  console.log(`  Merged reports generated in ${COVERAGE_DIR}`);
}

mergeCoverage().catch((error) => {
  console.error('Error merging coverage:', error);
  process.exit(1);
});
