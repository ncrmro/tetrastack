# @tetrastack/backend

Shared backend infrastructure for Tetrastack applications, providing database schemas, authentication, and utility functions.

## Features

- **Database**: Drizzle ORM schemas for SQLite (libSQL/Turso) and PostgreSQL.
- **Validation**: Drizzle-Zod schemas for type-safe validation of database operations.
- **Authentication**: NextAuth.js v5 configuration and utilities.
- **Storage**: R2 upload management with presigned URLs.
- **Utils**: UUIDv7 generation, slugification, and more.

## Installation

```bash
pnpm add @tetrastack/backend
```

> **Important**: When using this package, remove any duplicate dependencies (`drizzle-orm`, `drizzle-zod`, `zod`, `next-auth`, etc.) from your project's root `package.json` to avoid version conflicts. This package provides all necessary dependencies.

## TypeScript Configuration

This package uses TypeScript project references for proper monorepo type-checking.

### Root tsconfig.json

```jsonc
{
  "compilerOptions": {
    // ... your existing options
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "packages"],
  "references": [{ "path": "./packages/@tetrastack/backend" }],
}
```

### Building

With project references, use `tsc --build` to compile all referenced projects:

```bash
# Build all referenced projects
tsc --build

# Build with watch mode
tsc --build --watch

# Clean build artifacts
tsc --build --clean
```

### Benefits

- **Incremental builds**: Only recompiles changed projects
- **Proper dependency graph**: TypeScript understands project relationships
- **Declaration files**: Generates `.d.ts` files for consumption
- **No path mapping needed**: References handle resolution automatically

## Database Schema

This package exports Drizzle ORM schemas that you must import into your application's Drizzle configuration.

```typescript
// src/db/schema.ts
import { sqlite } from '@tetrastack/backend/database';

const { users, accounts, sessions, verificationTokens, uploads } = sqlite;

// Combine with your own tables if needed
export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  uploads,
};
```

### Zod Validation Schemas

Each table exports corresponding Zod schemas for type-safe validation:

```typescript
import {
  insertUserSchema,
  selectUserSchema,
  insertUploadSchema,
  selectUploadSchema,
} from '@tetrastack/backend/database';

// Validate insert data
const validatedUser = insertUserSchema.parse(userData);

// Infer types from schemas
type InsertUser = z.infer<typeof insertUserSchema>;
type SelectUser = z.infer<typeof selectUserSchema>;
```

Available schemas for each table:

- `insertUserSchema` / `selectUserSchema`
- `insertAccountSchema` / `selectAccountSchema`
- `insertSessionSchema` / `selectSessionSchema`
- `insertVerificationTokenSchema` / `selectVerificationTokenSchema`
- `insertUploadSchema` / `selectUploadSchema`

## Authentication

### Setup

Use `createAuth` to configure NextAuth with your database instance.

```typescript
// src/auth.ts
import { createAuth } from '@tetrastack/backend/auth';
import { db } from './db'; // Your initialized Drizzle instance

export const { handlers, auth, signIn, signOut } = createAuth(db);
```

### API Route

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'; // path to your auth.ts
export const { GET, POST } = handlers;
```

### Local Development

In development (`NODE_ENV=development`), you can log in without email verification:

- **Admin**: User `admin` / Password `admin` (or `password`) -> Creates admin user.
- **User**: User `user` / Password `password` -> Creates regular user.

The package will automatically create these users in your database if they don't exist upon first login.

## Uploads

Initialize the uploads service with your database instance.

```typescript
// src/lib/uploads.ts
import { createUploads } from '@tetrastack/backend/uploads';
import { sqlite } from '@tetrastack/backend/database';
import { db } from '@/db';

export const uploads = createUploads(db, sqlite.uploads);
```

Usage:

```typescript
const { url, key } = await uploads.createPresignedUpload({ ... });
```
