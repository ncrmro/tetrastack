import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // Use happy-dom for component tests, node for everything else
    environmentMatchGlobs: [
      ['tests/components/**/*.test.{ts,tsx}', 'happy-dom'],
    ],
    include: [
      'tests/unit/**/*.test.{js,ts,tsx}',
      'tests/integration/**/*.test.{js,ts,tsx}',
      'tests/components/**/*.test.{ts,tsx}',
      'tests/agents/**/*.test.{js,ts,tsx}',
    ],
    globalSetup: ['./vitest.setup.ts'],
    setupFiles: ['./vitest.test-setup.ts'],
    env: {
      // Use in-memory database for integration tests
      // Fast, isolated, no file locking conflicts
      // Migrations and seeding run in setupFiles before each test file
      NODE_ENV: 'test',
      DATABASE_URL: ':memory:',
    },
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
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
