# Turso Database Integration with Drizzle and AuthJS

This document describes the Turso database integration with Drizzle ORM and AuthJS that has been added to the application.

## Overview

The application now supports:

- **Turso (libSQL)** for production database hosting
- **Local SQLite** for development (via file URLs when using Drizzle migrations)
- **Cloudflare D1** as a fallback adapter for edge environments
- **Drizzle ORM** for type-safe database operations
- **NextAuth** integration with proper adapter switching

## Architecture

### Database Adapters

The application uses an intelligent adapter selection strategy:

1. **Production (Turso)**: When `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set
   - Uses Drizzle adapter with libSQL client
   - Connects to Turso database
   - Full Drizzle ORM functionality

2. **Development (D1 Fallback)**: When Turso credentials are not available
   - Uses Cloudflare D1 adapter
   - Compatible with existing D1 database setup
   - Works in edge runtime environments

### File Structure

```
src/lib/db/
├── schema.ts          # Drizzle schema definitions for NextAuth tables
└── index.ts           # Database client and adapter configuration

drizzle/
└── 0000_*.sql        # Generated migration files

scripts/
└── migrate.mjs       # Migration runner script
```

## Setup Instructions

### For Production with Turso

1. **Create a Turso database**:

   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # Create database
   turso db create my-app

   # Get database URL
   turso db show my-app --url

   # Create auth token
   turso db tokens create my-app
   ```

2. **Set environment variables**:

   ```bash
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   ```

3. **Run migrations**:
   ```bash
   npm run db:generate  # Generate migration files
   npm run db:push      # Push schema to Turso database
   ```

### For Local Development

Local development automatically uses the Cloudflare D1 adapter as a fallback when Turso credentials are not configured. This maintains compatibility with the existing setup.

## Database Schema

The implementation includes all required NextAuth tables:

- `user` - User accounts
- `account` - OAuth account linkings
- `session` - User sessions
- `verificationToken` - Email verification tokens
- `authenticator` - WebAuthn authenticators

## Scripts

- `npm run db:generate` - Generate migration files from schema
- `npm run db:migrate` - Run migrations (for file-based SQLite)
- `npm run db:push` - Push schema directly to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Environment Variables

```bash
# Required for Turso
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_auth_token

# Required for NextAuth
AUTH_SECRET=your_auth_secret
AUTH_MAILGUN_KEY=your_mailgun_key
AUTH_MAILGUN_FROM=your_email@domain.com
```

## Testing

Visit `/test-db` to see the current database configuration status and verify the integration is working correctly.

## Benefits

1. **Type Safety**: Full TypeScript support with Drizzle ORM
2. **Performance**: Turso provides low-latency SQLite at the edge
3. **Compatibility**: Maintains existing D1 adapter support
4. **Flexibility**: Easy switching between local and production databases
5. **Migration Support**: Proper schema versioning and migration management

## Production Deployment

When deploying to production with Turso:

1. Set the Turso environment variables in your deployment platform
2. Run migrations: `npm run db:push`
3. The application will automatically use the Drizzle adapter with Turso

When deploying to Cloudflare without Turso:

1. The application will automatically fall back to the D1 adapter
2. Uses the existing D1 database configuration from `wrangler.jsonc`
