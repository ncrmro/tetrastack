# E2E Coverage Collection

This directory contains utilities for collecting code coverage from Playwright E2E tests using Istanbul/NYC.

## How It Works

1. **Instrumentation**: When `E2E_COVERAGE=1` is set, the Next.js app is built with Babel instead of SWC, and Istanbul instrumentation is added to all source files.

2. **Collection**: Playwright's built-in V8 coverage API collects coverage data during test execution. The `coverage-helper.ts` module automatically starts and stops coverage collection for each test.

3. **Conversion**: After tests complete, the `convert-e2e-coverage.js` script converts V8 coverage format to Istanbul format.

4. **Merging**: The `merge-coverage.js` script merges E2E coverage with Vitest coverage to create a unified coverage report.

## Usage

### Local Development

Run E2E tests with coverage:
```bash
# Using npm scripts
npm run test:e2e:coverage

# Using make
make e2e-coverage

# Run all tests with coverage (Vitest + E2E)
make coverage-all
```

### CI/CD

The GitHub Actions workflow automatically collects E2E coverage and merges it with Vitest coverage. See `.github/workflows/web.tests.yml` for the implementation.

## Files

- `coverage-helper.ts` - Playwright helper functions for coverage collection
- `../../scripts/convert-e2e-coverage.js` - Converts V8 coverage to Istanbul format
- `../../scripts/merge-coverage.js` - Merges E2E and Vitest coverage

## Environment Variables

- `E2E_COVERAGE=1` - Enable coverage collection for E2E tests
- `BABEL_ENV=e2e` - Use Babel with Istanbul instrumentation

## Output

Coverage data is stored in:
- `.nyc_output/` - Raw V8 coverage data from Playwright
- `coverage/` - Converted and merged Istanbul coverage reports
- `coverage/coverage-e2e.json` - E2E-specific coverage (for merging)
- `coverage/coverage-final.json` - Merged coverage from all sources
