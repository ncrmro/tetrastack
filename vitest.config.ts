import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Main vitest config for unit, integration, and component tests
// Storybook tests use vitest.config.storybook.ts (run via npm run test:storybook)
export default defineConfig({
  plugins: [react()],
  test: {
    // Use projects to configure different environments for different test types
    // This replaces the deprecated environmentMatchGlobs
    projects: [
      // Unit and integration tests (node environment)
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'tests/unit/**/*.test.{js,ts,tsx}',
            'tests/integration/**/*.test.{js,ts,tsx}',
            'tests/agents/**/*.test.{js,ts,tsx}',
          ],
          globalSetup: ['./vitest.setup.ts'],
          setupFiles: ['./vitest.test-setup.ts'],
          env: {
            NODE_ENV: 'test',
            DATABASE_URL: ':memory:',
          },
        },
      },
      // Component tests (happy-dom environment for DOM APIs)
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'happy-dom',
          include: ['tests/components/**/*.test.{ts,tsx}'],
          setupFiles: ['./vitest.test-setup.ts'],
          env: {
            NODE_ENV: 'test',
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      // Coverage reporters:
      // - 'json' generates coverage/coverage-final.json (referenced in .github/workflows/ci.yml, line 207)
      // - 'json-summary' generates coverage/coverage-summary.json
      // - 'html' generates coverage/index.html (HTML report)
      // - 'lcov' generates coverage/lcov.info (for codecov, etc.)
      // - 'text' outputs summary to console
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      reportOnFailure: true,
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,ts,tsx}',
        '**/*.spec.{js,ts,tsx}',
        '**/dist/',
        '**/.next/',
        'coverage/',
        'vitest.config.ts',
        'vitest.config.storybook.ts',
        'vitest.config.components.ts',
        'vitest.setup.ts',
        'vitest.test-setup.ts',
        'next.config.ts',
        'tailwind.config.ts',
        'postcss.config.mjs',
        'playwright.config.ts',
        'scripts/',
        '.github/',
        'drizzle.config.ts',
      ],
      include: ['src/**/*.{js,ts,tsx}'],
      all: true,
      thresholds: {
        lines: 15,
        functions: 50,
        branches: 70,
        statements: 15,
        autoUpdate: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});
