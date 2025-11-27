/**
 * Drizzle Kit Configuration
 *
 * This configuration determines how Drizzle Kit generates and applies migrations.
 * It supports multiple database connection modes:
 *
 * - Production (Turso): Uses turso dialect with auth token
 * - Development (file-based): Uses sqlite dialect with file:./data/local.db
 * - Development (Docker): Uses sqlite dialect with http://db:8080
 *
 * Environment Variables:
 * - TURSO_AUTH_TOKEN + TURSO_DATABASE_URL: Production Turso connection
 * - DATABASE_URL: Local development database URL (file: or http:)
 * - DB_PORT: LibSQL server port for Docker (default: 8080)
 *
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local', quiet: true })

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  ...(process.env.TURSO_AUTH_TOKEN
    ? {
        // Production: Turso with authentication
        dialect: 'turso',
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL!,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        // Development: File-based or HTTP LibSQL server
        // Defaults to file:./data/local.db for easy local development
        dialect: 'sqlite',
        dbCredentials: {
          url:
            process.env.DATABASE_URL ||
            (process.env.NODE_ENV !== 'production'
              ? 'file:./data/local.db'
              : `http://localhost:${process.env.DB_PORT || 8080}`),
        },
      }),
})
