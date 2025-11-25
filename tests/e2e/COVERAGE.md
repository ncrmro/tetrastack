# E2E Coverage Collection

This directory contains utilities for collecting code coverage from Playwright E2E tests using V8 coverage format (compatible with Vitest).

## How It Works

1. **Collection**: When `E2E_COVERAGE=1` is set, Playwright's built-in V8 coverage API collects coverage data during test execution. The `coverage-helper.ts` module automatically starts and stops coverage collection for each test.

2. **Storage**: Coverage data is saved in V8 format to `coverage/tmp/` directory - the same format that Vitest uses.

3. **Merging**: Vitest's merge-reports feature can combine both Vitest and Playwright V8 coverage into a unified report.

## Key Advantages

- **No conversion needed**: Playwright and Vitest both use V8 coverage format natively
- **Simpler setup**: No Babel instrumentation or Istanbul conversion required
- **Faster**: Direct V8 coverage collection without additional build steps
- **Native compatibility**: Works seamlessly with Vitest's coverage tools

## Usage

### Local Development

Run E2E tests with coverage:

```bash
# Using npm scripts
npm run coverage:e2e

# Using make
make e2e-coverage

# Run all tests with coverage (Vitest + E2E)
make coverage-all
```

### CI/CD

The GitHub Actions workflow automatically collects E2E coverage and merges it with Vitest coverage. See `.github/workflows/web.tests.yml` for the implementation.

## Files

- `coverage-helper.ts` - Playwright helper functions for V8 coverage collection
- `../../scripts/merge-v8-coverage.js` - Verifies V8 coverage files are ready for merging

## Environment Variables

- `E2E_COVERAGE=1` - Enable coverage collection for E2E tests

## Output

Coverage data is stored in:

- `coverage/tmp/` - V8 coverage data from Playwright (automatically merged with Vitest)
- `coverage/` - Merged coverage reports from all sources
