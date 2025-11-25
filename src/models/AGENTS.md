# Models Layer

## Purpose

Models contain complex database operations and business logic, following Rails conventions. These are pure database functions with no authentication context.

## Responsibilities

- **Complex queries**: Multi-table joins, aggregations, relations
- **Business logic**: Slug generation, data transformations
- **Database transactions**: Atomic operations across multiple tables
- **Data integrity**: Validations, constraints, consistency checks

## Architecture Pattern

```
Actions (auth & request handling)
        ↓
    Models  ← YOU ARE HERE
        ↓
Database (schemas & queries)
```

## Key Principles

1. **No authentication** - Auth handled by actions layer
2. **Pure functions** - Database operations only
3. **Complex logic** - Multi-step operations, transactions
4. **Reusable** - Can be called by multiple actions
5. **Type-safe** - Full TypeScript types from schemas

## Many-First Design Pattern

This project uses the **many-first design pattern** via the `createModelFactory` factory. All CRUD operations work with arrays by default, eliminating the need for duplicate `createOne`/`createMany` functions.

### Basic Usage

```typescript
// src/models/tags.ts
import { tags, insertTagSchema } from '@/lib/db/schema.tags';
import { createModelFactory } from '@/lib/models';

export const {
  insert: insertTags,
  select: selectTags,
  update: updateTags,
  delete: deleteTags,
} = createModelFactory('tags', tags, tags.id, insertTagSchema);

// Usage (always with arrays)
const [tag] = await insertTags([data]); // Single record
const tags = await insertTags([data1, data2]); // Multiple records
const [updated] = await updateTags([eq(tags.id, id)], data);
await deleteTags([eq(tags.id, id)]);
```

## Complete Documentation

**For comprehensive information, see [`src/lib/models/README.md`](../lib/models/README.md):**

- Many-first design philosophy
- Complete factory API reference
- Custom override patterns (for computed fields like slugs)
- Building custom query functions
- Migration guide from traditional CRUD
- Performance best practices
- Troubleshooting and common issues
