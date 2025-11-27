/**
 * Database Layer - LibSQL Client Configuration
 *
 * This module provides environment-specific database client creation for LibSQL.
 *
 * ## Environment Support
 *
 * - **Production (Cloudflare Workers)**: Turso via HTTP with auth token
 * - **Docker Development**: LibSQL server via HTTP (http://db:8080)
 * - **Integration Tests**: In-memory SQLite (migrations/seeding handled in vitest.setup.ts)
 *
 * ## Migration & Seeding
 *
 * - **Docker**: Handled by db-init container (runs migrations + seed script)
 * - **Integration Tests**: Handled in vitest.setup.ts (applies migrations + seeds to :memory: db)
 * - **Scripts**: Use seed.ts directly for manual seeding
 *
 * @see https://github.com/tursodatabase/libsql
 */

import { createClient } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export * from './schema'

/**
 * Creates a database client based on the current environment.
 *
 * @returns Configured Drizzle database instance
 */
export function createDatabaseClient() {
  // Production: Use Turso with web client (Cloudflare Workers compatible)
  if (process.env.TURSO_AUTH_TOKEN && process.env.TURSO_DATABASE_URL) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    return drizzle(client, { schema })
  }

  // Integration tests: Use in-memory database with Node.js client
  // Note: Migrations and seeding are handled in vitest.setup.ts
  if (process.env.DATABASE_URL === ':memory:') {
    // Use dynamic import in Node.js environment (test mode)
    // This keeps @libsql/client/node out of Cloudflare Workers bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient: createNodeClient } = require('@libsql/client/node')
    const client = createNodeClient({
      url: ':memory:',
    })
    return drizzle(client, { schema })
  }

  // Local development with Docker or HTTP connection
  const client = createClient({
    url:
      process.env.DATABASE_URL ||
      `http://localhost:${process.env.DB_PORT || 8080}`,
  })
  return drizzle(client, { schema })
}

/**
 * Database instance for use throughout the application.
 *
 * Works with:
 * - Production (Turso HTTP)
 * - Docker development (LibSQL HTTP)
 * - Integration tests (in-memory SQLite via Node.js client)
 *
 * Migrations and seeding for tests are handled in vitest.setup.ts
 */
export const db = createDatabaseClient()

export type Database = typeof db

/**
 * Utility function to handle both array and ResultSet return types from .returning()
 *
 * LibSQL can return results in different formats depending on the client and query.
 * This helper normalizes the response to always return an array.
 *
 * @param result - Result from a Drizzle query with .returning()
 * @returns Array of result rows
 *
 * @example
 * const result = await db.insert(users).values(data).returning();
 * const rows = getResultArray(result);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getResultArray(result: any[] | { rows: any[] }): any[] {
  return Array.isArray(result) ? result : result.rows
}
