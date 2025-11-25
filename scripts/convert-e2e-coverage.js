#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Convert Playwright V8 coverage to Istanbul/NYC format
 * This script reads V8 coverage files from .nyc_output and converts them to Istanbul format
 */

const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const reports = require('istanbul-reports');
const v8toIstanbul = require('v8-to-istanbul');
const fs = require('fs');
const path = require('path');

const NYC_OUTPUT_DIR = path.join(process.cwd(), '.nyc_output');
const COVERAGE_DIR = path.join(process.cwd(), 'coverage');

async function convertV8ToIstanbul() {
  // Read all V8 coverage files from .nyc_output
  if (!fs.existsSync(NYC_OUTPUT_DIR)) {
    console.log('No coverage data found in .nyc_output');
    return;
  }

  const files = fs
    .readdirSync(NYC_OUTPUT_DIR)
    .filter((f) => f.startsWith('playwright-') && f.endsWith('.json'));

  if (files.length === 0) {
    console.log('No Playwright coverage files found');
    return;
  }

  console.log(`Converting ${files.length} coverage files...`);

  const coverageMap = createCoverageMap({});

  for (const file of files) {
    const filePath = path.join(NYC_OUTPUT_DIR, file);
    const coverageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const entry of coverageData) {
      // Skip coverage for files that are not in our src directory
      if (!entry.url.includes('/src/')) {
        continue;
      }

      // Skip node_modules and other irrelevant files
      if (
        entry.url.includes('node_modules') ||
        entry.url.includes('/.next/') ||
        entry.url.includes('/coverage/') ||
        entry.url.includes('/tests/')
      ) {
        continue;
      }

      try {
        // Extract file path from URL
        // Handle both localhost and docker URLs
        const urlPath = entry.url.replace(/^.*?\/src\//, '/src/');
        const absolutePath = path.join(process.cwd(), urlPath);

        // Only process files that exist in the filesystem
        if (!fs.existsSync(absolutePath)) {
          continue;
        }

        // Convert V8 coverage to Istanbul format
        const converter = v8toIstanbul(absolutePath, 0, {
          source: fs.readFileSync(absolutePath, 'utf8'),
        });
        await converter.load();
        converter.applyCoverage(entry.functions);

        // Merge into coverage map
        const istanbulCoverage = converter.toIstanbul();
        Object.keys(istanbulCoverage).forEach((key) => {
          coverageMap.addFileCoverage(istanbulCoverage[key]);
        });
      } catch (error) {
        console.warn(`Failed to convert ${entry.url}:`, error.message);
      }
    }
  }

  // Ensure coverage directory exists
  if (!fs.existsSync(COVERAGE_DIR)) {
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });
  }

  // Write coverage data in multiple formats
  const context = createContext({
    dir: COVERAGE_DIR,
    coverageMap,
  });

  // Save E2E-specific coverage file for merging
  const e2eCoverageFile = path.join(COVERAGE_DIR, 'coverage-e2e.json');
  fs.writeFileSync(e2eCoverageFile, JSON.stringify(coverageMap.data, null, 2));

  // Generate reports
  const reportTypes = ['json', 'json-summary', 'lcov', 'html', 'text'];
  reportTypes.forEach((reportType) => {
    const report = reports.create(reportType, {});
    report.execute(context);
  });

  console.log('✓ Coverage conversion complete');
  console.log(`  Reports generated in ${COVERAGE_DIR}`);
  console.log(`  E2E coverage saved to ${e2eCoverageFile}`);
}

convertV8ToIstanbul().catch((error) => {
  console.error('Error converting coverage:', error);
  process.exit(1);
});
