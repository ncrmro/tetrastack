/**
 * Vitest per-file setup
 *
 * This file runs before each test file to:
 * 1. Extend Vitest matchers
 * 2. Run migrations and seed for in-memory database
 *
 * For in-memory databases (:memory:), each connection gets a fresh empty database.
 * This setup ensures that before each test file runs:
 * - Migrations are applied to create the schema
 * - Seed data is loaded for tests to use
 *
 * The setup runs at module level and uses beforeAll hook to ensure it runs
 * before the tests in each file.
 */

import '@testing-library/jest-dom/vitest'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { beforeAll } from 'vitest'
import { db } from '@/database'
import { seed } from './scripts/seed'

// Run migrations and seed before each test file
beforeAll(async () => {
  // Run migrations to create schema (required for :memory: database)
  await migrate(db, { migrationsFolder: './drizzle' })

  // Seed test data
  await seed()
})
