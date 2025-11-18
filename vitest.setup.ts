/**
 * Vitest global setup file
 *
 * This runs once before all test files start and once after all tests complete.
 *
 * NOTE: For in-memory database (:memory:), migrations and seeding are handled
 * in vitest.test-setup.ts which runs before each test file. This is necessary
 * because each database connection to :memory: creates a fresh empty database.
 *
 * Global setup is primarily used for one-time initialization that applies to
 * all tests (e.g., loading environment variables from .env files).
 *
 * Environment variables like NODE_ENV and DATABASE_URL are configured in
 * vitest.config.ts in the `test.env` section.
 */

import dotenv from 'dotenv';

// Load environment variables from .env files
dotenv.config({ quiet: true });

/**
 * Global setup - runs once before all tests
 *
 * Currently just loads environment variables. Environment-specific variables
 * like NODE_ENV and DATABASE_URL are set in vitest.config.ts.
 */
export async function setup() {
  // Environment variables are loaded by dotenv above
  // Test-specific env vars are set in vitest.config.ts
}

/**
 * Global teardown - runs once after all tests complete
 *
 * For in-memory databases, no cleanup is needed as the database
 * disappears when the connection closes.
 */
export async function teardown() {
  // No cleanup needed for :memory: database
}
