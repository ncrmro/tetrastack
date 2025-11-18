# Models CRUD Factory

Generic CRUD factory that enforces consistent, concise database operations across all models using the **many-first design pattern**.

## Core Convention: Many-First Pattern

**All CRUD operations work with arrays by default.** Single-record operations use array destructuring.

```typescript
// ❌ Traditional: Multiple function variants
createUser(data); // Single
createUsers([data]); // Multiple
updateUser(id, data); // By ID
updateUsers(ids, data); // By IDs

// ✅ Many-first: Single function handles both
insertUsers([data]); // Returns User[]
const [user] = await insertUsers([data]); // Destructure for single
const users = await insertUsers([d1, d2]); // Multiple
```

**Why?** Eliminates code duplication, enforces consistent APIs, reduces mental overhead.

## Factory API

```typescript
const crud = createModelFactory(tableName, table, idColumn, insertSchema);
```

**Returns:**

| Function          | Signature                                               | Purpose                     |
| ----------------- | ------------------------------------------------------- | --------------------------- |
| `select`          | `(conditions?: SQL[]) => Promise<T[]>`                  | Query records               |
| `insert`          | `(data: T[]) => Promise<T[]>`                           | Create records              |
| `update`          | `(conditions: SQL[], data: Partial<T>) => Promise<T[]>` | Update records              |
| `delete`          | `(conditions: SQL[]) => Promise<void>`                  | Delete records              |
| `buildConditions` | `(filters: Record<...>) => SQL[]`                       | Build WHERE conditions      |
| `takeFirst`       | `<T>(items: T[]) => T`                                  | Extract first item or throw |

**All operations are many-first** - they work with arrays and use SQL conditions, not IDs.

## Implementation Patterns

### Pattern A: Standard (No Custom Logic)

**Use for:** Most models with straightforward CRUD needs.

```typescript
// models/tags.ts
import { tags, insertTagSchema } from '@/lib/db/schema.tags';
import { createModelFactory } from '@/lib/models';

// Direct export - cleanest approach
export const {
  insert: insertTags,
  select: selectTags,
  update: updateTags,
  delete: deleteTags,
  buildConditions,
  takeFirst: takeFirstTag,
} = createModelFactory('tags', tags, tags.id, insertTagSchema);

// Custom query function
export async function getTags(params: { ids?: string[]; teamIds?: string[] }) {
  const conditions = buildConditions({
    ids: params.ids ? { column: tags.id, values: params.ids } : undefined,
    teamIds: params.teamIds
      ? { column: tags.teamId, values: params.teamIds }
      : undefined,
  });
  return selectTags(conditions);
}
```

**Result:** ~20 lines of code per model.

### Pattern B: Custom Overrides (With Business Logic)

**Use for:** Models requiring computed fields (slugs, paths), data transformations, or enrichment.

```typescript
// models/posts.ts
import { db } from '@/lib/db';
import { posts, insertPostSchema } from '@/lib/db/schema.posts';
import { createModelFactory } from '@/lib/models';
import { generateUniqueSlug } from '@/lib/slugify';

// Get base functions, override insert/update
const {
  insert: baseInsert,
  update: baseUpdate,
  select: selectPosts,
  delete: deletePosts,
  buildConditions,
  takeFirst: takeFirstPost,
} = createModelFactory('posts', posts, posts.id, insertPostSchema);

// Re-export unchanged functions
export { selectPosts, deletePosts, buildConditions, takeFirstPost };

// Custom insert: Generate unique slugs
export async function insertPosts(data: InsertPost[]) {
  const existingSlugs = await db.select({ slug: posts.slug }).from(posts);
  const slugSet = new Set(existingSlugs.map((p) => p.slug));

  const itemsWithSlugs = data.map((item) => ({
    ...item,
    slug: generateUniqueSlug(item.title, slugSet),
  }));

  return db.insert(posts).values(itemsWithSlugs).returning();
}

// Custom update: Regenerate slug when title changes
export async function updatePosts(
  conditions: SQL[],
  data: Partial<InsertPost>,
) {
  let updateData = { ...data };

  if (data.title) {
    const existingSlugs = await db.select({ slug: posts.slug }).from(posts);
    const slugSet = new Set(existingSlugs.map((p) => p.slug));
    updateData.slug = generateUniqueSlug(data.title, slugSet);
  }

  return db
    .update(posts)
    .set(updateData)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .returning();
}
```

**Key principles for overrides:**

1. Get base functions first, selectively override
2. Re-export unchanged functions
3. Maintain many-first signature (always arrays)
4. Insert directly with `db.insert()` to preserve computed fields
5. Document why you're overriding

## Consistency Benefits

### Enforced Conventions

| Aspect           | Convention                                 | Benefit                |
| ---------------- | ------------------------------------------ | ---------------------- |
| **Naming**       | Always plural: `insertUsers`, `selectTags` | Zero naming debates    |
| **Parameters**   | Always arrays: `[data]`, `[conditions]`    | Predictable signatures |
| **Return types** | Always arrays: `User[]`, `Tag[]`           | Consistent handling    |
| **Conditions**   | Always SQL arrays: `[eq(id, x)]`           | Composable, type-safe  |

### Code Comparison

**Traditional approach (verbose, inconsistent):**

```typescript
// Multiple function variants per model
export async function createUser(data) { ... }           // 10 lines
export async function createUsers(data) { ... }          // 10 lines
export async function updateUser(id, data) { ... }       // 10 lines
export async function updateUsers(ids, data) { ... }     // 10 lines
export async function deleteUser(id) { ... }             // 8 lines
export async function deleteUsers(ids) { ... }           // 8 lines
// Total: ~56 lines per model, repeated across N models
```

**Factory approach (concise, consistent):**

```typescript
// Single factory call
export const { insert, select, update, delete } = createModelFactory(...);
// Total: ~20 lines per model, identical across all models
```

**Savings:** ~65% less code, 100% consistency.

### Agent-Friendly Design

**Why AI agents excel with this pattern:**

1. **Single pattern to learn** - If it works for `users`, it works for `posts`, `products`, etc.
2. **No guessing** - Factory enforces one correct way to implement CRUD
3. **Self-documenting** - Function names clearly indicate expectations (`insertUsers` expects array)
4. **Type-safe** - Full inference from Drizzle schemas prevents errors
5. **Predictable** - Same signature across all models eliminates ambiguity

**Agent workflow:**

```
1. See: "Create tags model"
2. Pattern match: Use createModelFactory factory
3. Export: insertTags, selectTags, updateTags, deleteTags
4. Done: ~20 lines, zero decisions needed
```

## Usage Patterns

### In Actions Layer

```typescript
// actions/tags.ts
import { insertTags, updateTags, deleteTags } from '@/models/tags';
import { eq } from 'drizzle-orm';

export async function createTag(data: InsertTag): ActionResult<SelectTag> {
  const [tag] = await insertTags([data]);
  return { success: true, data: tag };
}

export async function updateTag(
  id: string,
  data: Partial<InsertTag>,
): ActionResult<SelectTag> {
  const [updated] = await updateTags([eq(tags.id, id)], data);
  return { success: true, data: updated };
}

export async function deleteTag(id: string): ActionResult<void> {
  await deleteTags([eq(tags.id, id)]);
  return { success: true };
}
```

### When to Use `takeFirst`

**Only for SELECT operations requiring error handling:**

```typescript
// ✅ SELECT: Throw error if not found
const user = takeFirstUser(await selectUsers([eq(users.id, id)]));

// ✅ INSERT/UPDATE: Use array destructuring
const [user] = await insertUsers([data]);
const [updated] = await updateUsers([eq(users.id, id)], data);
```

### Building Custom Queries

```typescript
export async function getUsers(params: { ids?: string[]; status?: string[] }) {
  const conditions = buildConditions({
    ids: params.ids ? { column: users.id, values: params.ids } : undefined,
  });

  if (params.status) {
    conditions.push(inArray(users.status, params.status));
  }

  return selectUsers(conditions);
}
```

### Relations and Joins

**Don't override the factory** - use `db.query` for relations:

```typescript
export async function getUsersWithPosts(userIds: string[]) {
  return db.query.users.findMany({
    where: inArray(users.id, userIds),
    with: { posts: true },
  });
}
```

## Critical Gotchas

### 1. Always Pass Arrays

```typescript
// ❌ Wrong
await insertUsers(data);

// ✅ Correct
await insertUsers([data]);
```

### 2. Always Destructure for Single Records

```typescript
// ❌ Wrong - user is User[], not User
const user = await insertUsers([data]);

// ✅ Correct - user is User
const [user] = await insertUsers([data]);
```

### 3. Conditions Always in Arrays

```typescript
// ❌ Wrong
await updateUsers(eq(users.id, id), data);

// ✅ Correct
await updateUsers([eq(users.id, id)], data);
```

### 4. Custom Overrides Must Insert Directly

When overriding to add computed fields, bypass factory validation:

```typescript
// ❌ Wrong - baseInsert strips custom fields
const itemsWithSlugs = data.map(addSlug);
return baseInsert(itemsWithSlugs);

// ✅ Correct - insert directly
return db.insert(table).values(itemsWithSlugs).returning();
```

## Summary

**This library provides:**

- ✅ Single implementation pattern for all models
- ✅ Enforced naming and signature consistency
- ✅ ~65% less boilerplate code
- ✅ Zero API design decisions
- ✅ Type-safe, validated operations
- ✅ Agent-friendly predictability

**Developers and agents write:**

- Consistent code across all models
- Minimal boilerplate (~20 lines per model)
- Self-documenting, predictable APIs
- Less code to review, test, and maintain
