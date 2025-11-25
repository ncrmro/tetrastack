---
name: backend-developer
description: Expert in building backend features with Next.js server actions, Drizzle ORM models, database operations, and the many-first design pattern. Use when creating or modifying server actions, database models, schemas, migrations, or backend business logic.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, mcp__typescript-lsp__definition, mcp__typescript-lsp__references, mcp__typescript-lsp__diagnostics, mcp__typescript-lsp__edit_file, mcp__typescript-lsp__rename_symbol
---

# Backend Developer Skill

Expert backend development using Next.js server actions, Drizzle ORM, and the many-first design pattern.

## Core Principles

### 1. Many-First Design Pattern

**CRITICAL**: All CRUD operations use arrays by default. Never create single-record wrappers.

✅ **Correct**:

```typescript
// In actions or models
const [tag] = await insertTags([data]);
const [updated] = await updateTags([eq(tags.id, id)], data);
await deleteTags([eq(tags.id, id)]);
```

❌ **Wrong**:

```typescript
// NEVER create these
export async function createTag(data) { ... }
export async function updateTag(id, data) { ... }
export async function deleteTag(id) { ... }
```

### 2. Server Actions Over API Routes

Always prefer server actions (`src/actions/`) over API routes unless specifically needed for webhooks or external integrations.

**IMPORTANT**: Never use `redirect()` or `permanentRedirect()` in server actions as they throw errors. Return success/error objects instead and handle navigation in client components.

✅ **Correct**:

```typescript
'use server';

export async function createItem(data: InsertItem) {
  try {
    const [item] = await insertItems([data]);
    return { success: true, item };
  } catch (error) {
    return { success: false, error: 'Failed to create item' };
  }
}
```

❌ **Wrong**:

```typescript
'use server';

export async function createItem(data: InsertItem) {
  const [item] = await insertItems([data]);
  redirect('/items'); // DO NOT USE - throws error
}
```

### 3. Model Factory Pattern

Use `createModelFactory` from `src/lib/models/` for all database operations:

```typescript
import { createModelFactory } from '@/lib/models';

const {
  insert,
  select,
  update,
  delete: deleteOp,
  buildConditions,
  takeFirst,
} = createModelFactory(db, tableName, tableSchema);
```

## Directory Structure & Responsibilities

### src/actions/

Server actions for data mutations and form handling. Always read `src/actions/README.md` before working in this area.

**Pattern**:

```typescript
'use server';

import { insertItems } from '@/models/items';

export async function createItem(formData: FormData) {
  const data = {
    /* validate and parse */
  };
  const [item] = await insertItems([data]);
  return { success: true, item };
}
```

### src/models/

Database operations and business logic. Always read `src/models/README.md` before working in this area.

**Pattern**:

```typescript
import { createModelFactory } from '@/lib/models';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema.items';

const {
  insert,
  select,
  update,
  delete: deleteOp,
} = createModelFactory(db, 'items', items);

export const insertItems = insert;
export const selectItems = select;
export const updateItems = update;
export const deleteItems = deleteOp;
```

### src/lib/db/

Database schema and connection. Always read `src/lib/db/README.md` before working with schemas or migrations.

**Key files**:

- `schema.*.ts` - Eight domain-specific schema files
- `index.ts` - Database connection and table exports
- Migration commands in Makefile

## Database Operations

### Drizzle Query Patterns

**Select with conditions**:

```typescript
import { eq, and, gte } from 'drizzle-orm';

const items = await selectItems([
  eq(items.userId, userId),
  gte(items.createdAt, startDate),
]);
```

**Select one (takeFirst)**:

```typescript
const { takeFirst } = createModelFactory(db, 'items', items);
const item = await takeFirst([eq(items.id, itemId)]);
```

**Update with conditions**:

```typescript
const [updated] = await updateItems([eq(items.id, itemId)], {
  name: 'New Name',
});
```

**Transactions**:

```typescript
await db.transaction(async (tx) => {
  const [item] = await tx.insert(items).values(data).returning();
  await tx.insert(itemRelations).values({ itemId: item.id });
});
```

### Migrations

**Important**: Use `make migration-reconcile` to resolve migration conflicts.

**Generate migration**:

```bash
make migration-generate name=add_new_field
```

**Run migrations**:

```bash
make migration-migrate
```

## TypeScript Best Practices

### Use TypeScript LSP Tools

Prefer TypeScript LSP MCP tools for TypeScript-specific operations:

- `mcp__typescript-lsp__edit_file` instead of `Edit` for TypeScript files
- `mcp__typescript-lsp__references` instead of `Grep` for finding usages
- `mcp__typescript-lsp__definition` for navigating to definitions
- `mcp__typescript-lsp__rename_symbol` for safe refactoring
- `mcp__typescript-lsp__diagnostics` to check type errors

### Type Safety

```typescript
// Use Drizzle's type inference
type InsertItem = typeof items.$inferInsert;
type SelectItem = typeof items.$inferSelect;

// Use Zod for validation
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
});
```

### Avoid Dynamic Imports

**Never** use dynamic imports. Always use top-level static imports:

✅ **Correct**:

```typescript
import { something } from './module';
```

❌ **Wrong**:

```typescript
const module = await import('./module');
```

## Testing

Always use test factories from `tests/factories/`. Read `tests/factories/README.md` for patterns.

**Best practice** - Use minimal custom parameters:

✅ **Good**:

```typescript
await foodFactory.create();
await foodFactory.processed().fat().create();
```

❌ **Avoid**:

```typescript
await foodFactory.create({
  name: 'X',
  type: 'Y',
  category: 'Z',
});
```

## Docker Commands

All npm commands must run inside Docker:

```bash
docker compose exec web npm run test:unit
docker compose exec web npm install package-name
```

Or use Makefile shortcuts:

```bash
make ci        # Run all tests and linting
make format    # Format code
```

## Common Tasks

### Create a new model

1. Define schema in appropriate `src/lib/db/schema.*.ts` file
2. Generate migration: `make migration-generate name=add_model_name`
3. Create model file in `src/models/model-name.ts` using `createModelFactory`
4. Create factory in `tests/factories/model-name.factory.ts`
5. Write tests in `tests/unit/models/model-name.test.ts`

### Create a server action

1. Create file in `src/actions/feature-name.ts`
2. Add `"use server"` directive at top
3. Import model operations from `src/models/`
4. Return success/error objects (never use `redirect()`)
5. Write integration tests in `tests/integration/actions/`

### Add a database field

1. Update schema in `src/lib/db/schema.*.ts`
2. Generate migration: `make migration-generate name=add_field_name`
3. Review and run migration: `make migration-migrate`
4. Update TypeScript types (auto-inferred from schema)
5. Update factories if needed

## Reference Documentation

Always consult these READMEs when working in their areas:

- [src/database/README.md](../../../src/database/README.md) - Database schema organization, eight domain-specific schemas, and migration patterns
- [src/lib/models/README.md](../../../src/lib/models/README.md) - Model factory patterns, many-first design philosophy, and CRUD operations
- [src/models/README.md](../../../src/models/README.md) - Models layer architecture overview and responsibilities
- [src/actions/README.md](../../../src/actions/README.md) - Server actions patterns, re-export guidelines, and import rules
- [src/jobs/README.md](../../../src/jobs/README.md) - Jobs system architecture, fluent API patterns, and database-backed queue
- [src/agents/README.md](../../../src/agents/README.md) - Agent architecture and database-first AI generation pattern
- [tests/README.md](../../../tests/README.md) - Testing architecture overview and three-tier testing approach
- [tests/factories/README.md](../../../tests/factories/README.md) - Factory pattern documentation and best practices
- [tests/integration/README.md](../../../tests/integration/README.md) - Integration testing guidelines and database setup

## Troubleshooting

### Type errors after schema change

```bash
docker compose exec web npm run typecheck
```

### Migration conflicts

```bash
make migration-reconcile
```

### Test failures

```bash
docker compose exec web npm run test:unit -- --reporter=verbose
```
