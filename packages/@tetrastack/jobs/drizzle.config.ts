/**
 * Drizzle Kit configuration for @tetrastack/server-jobs
 *
 * This config is used to generate migrations for the jobs schema.
 *
 * Usage:
 *   npx drizzle-kit generate
 *   npx drizzle-kit migrate
 *
 * Or integrate into main app's drizzle config:
 *   import { schema } from '@tetrastack/server-jobs/schema';
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
});
