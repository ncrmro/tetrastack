import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import drizzle from 'eslint-plugin-drizzle';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'drizzle/**',
      'worktree/**',
      '.turbo/**',
      '.vercel/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      '*.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    ignores: ['.next/**/*', 'src/components/onboarding/*', 'scripts/seed.ts'],
  },
  {
    files: [
      'src/lib/db/**/*.{ts,js}',
      'drizzle.config.{ts,js}',
      'scripts/seed.{ts,js}',
      'scripts/dataload.{ts,js}',
      'scripts/migrate.{ts,js}',
    ],
    plugins: {
      drizzle,
    },
    rules: {
      ...drizzle.configs.recommended.rules,
    },
  },
  {
    files: [
      'tests/unit/**/*.{test,spec}.{ts,js,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,js,tsx}',
    ],
    ...vitest.configs.recommended,
  },
  {
    files: ['tests/e2e/**/*.{test,spec}.{ts,js,tsx}'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Disable React hooks rule for E2E tests - Playwright fixtures use 'use' parameter which conflicts
      'react-hooks/rules-of-hooks': 'off',
      // Enforce no networkidle usage (aligns with E2E testing guidelines in CLAUDE.md)
      'playwright/no-networkidle': 'error',
      // Enforce proper element visibility checks
      'playwright/prefer-web-first-assertions': 'error',
      // Enforce tests have assertions
      'playwright/expect-expect': 'error',
      // Enforce no flaky test patterns
      'playwright/no-wait-for-timeout': 'error',
      // Enforce no conditional logic in tests
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      // Enforce better patterns
      'playwright/no-useless-not': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/no-wait-for-selector': 'error',
    },
  },
];

export default eslintConfig;
