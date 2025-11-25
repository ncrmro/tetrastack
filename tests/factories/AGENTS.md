# Test Data Factories

Rails FactoryBot-inspired pattern for generating test data with sensible defaults, chainable traits, and database persistence. **Reduces test code by 87%** while improving readability and maintainability.

## Architecture

```
src/lib/factories.ts        # Central factory utilities (Factory, faker, db)
tests/factories/
├── index.ts                 # Barrel export for all factories
├── user.factory.ts          # User factory
└── [entity].factory.ts      # Future factories (recipe, meal, user, etc.)
```

**Stack**: fishery v2.3.1 (factory pattern) + @faker-js/faker v10.1.0 (fake data)

## Quick Start

```typescript
import { userFactory, postFactory } from '../factories';

// Build with defaults - PREFERRED
const user = userFactory.build();

// Use traits for variations - PREFERRED
const adminUser = userFactory.admin().build();
const processedFatFood = foodFactory.processed().fat().build();

// Override specific fields - USE SPARINGLY, only when test requires it
const admin = userFactory.build({ name: 'Alice' });

// Persist to database via model layer
const savedUser = await userFactory.create();

// Build multiple
const users = userFactory.buildList(5);

// Build with associations
const post = postFactory.build(
  {},
  {
    associations: { author: userFactory.build({ name: 'Diana' }) },
  },
);
```

**IMPORTANT: Minimize Custom Parameters**

The power of factories comes from their sensible defaults. Tests should use factories with **as few custom parameters as possible**:

- ✅ **Preferred**: `userFactory.create()` - Rely on defaults
- ✅ **Preferred**: `foodFactory.processed().fat().create()` - Use traits for variations
- ⚠️ **Use sparingly**: `userFactory.create({ name: 'Specific Name' })` - Only when the test logic requires a specific value
- ❌ **Avoid**: `userFactory.create({ name: 'X', email: 'Y', role: 'Z', ... })` - Too many overrides make tests brittle

**Why minimize custom parameters?**

1. **Maintainability**: When factory defaults change, fewer tests break
2. **Readability**: Less noise in test code focuses attention on what's being tested
3. **Flexibility**: Defaults can be updated in one place to improve all tests
4. **Intent**: Custom parameters should signal "this value matters for the test"

## Associations

Factories can reference other factories for relationships:

```typescript
import { userFactory } from './user.factory';

const postFactory = Factory.define<Post>(() => ({
  title: 'My Blog Post',
  author: userFactory.build(),
}));
```

Override associations when building:

```typescript
const specificAuthor = userFactory.build({ name: 'Jordan' });
const post = postFactory.build(
  {},
  {
    associations: { author: specificAuthor },
  },
);
```

## Auto-Parent Creation

**IMPORTANT**: Factories with parent relationships (team → project → task) automatically create parent entities when not provided. This eliminates superfluous parent creation code in tests.

### The Pattern

```typescript
// ✅ PREFERRED: Factory auto-creates team
const project = await projectFactory.create();

// ✅ PREFERRED: Factory auto-creates project (which auto-creates team)
const task = await taskFactory.create();

// ✅ PREFERRED: Factory auto-creates team
const tag = await tagFactory.create();

// ❌ AVOID: Unnecessary explicit parent creation
const team = await teamFactory.create();
const project = await projectFactory.create({ teamId: team.id });
```

### When to Create Parents Explicitly

Create parents explicitly only when:

1. **Multiple children share the same parent**

```typescript
// ✅ VALID: Projects sharing a team
const team = await teamFactory.create();
const project1 = await projectFactory.create({ teamId: team.id });
const project2 = await projectFactory.create({ teamId: team.id });
```

2. **Testing parent-specific behavior**

```typescript
// ✅ VALID: Need specific team type
const engineeringTeam = await teamFactory.engineering().create();
const project = await projectFactory.create({ teamId: engineeringTeam.id });
```

3. **Need to reference the parent later**

```typescript
// ✅ VALID: Will use team in assertions
const team = await teamFactory.create();
const project = await projectFactory.create({ teamId: team.id });
expect(project.teamId).toBe(team.id);
```

### How It Works

Factories use transient parameters to accept optional parent IDs. If not provided, the factory automatically creates the parent:

```typescript
// Simplified example
export const projectFactory = ProjectFactory.define(({ transient }) => ({
  title: Factory.faker.company.buzzPhrase(),
  teamId: transient.teamId || '', // Auto-filled in create()
}));

// In create() method:
async create(params?, transientParams?) {
  let teamId = transientParams?.teamId || params?.teamId;

  // Auto-create team if not provided
  if (!teamId) {
    const team = await teamFactory.create();
    teamId = team.id;
  }

  // Continue with project creation...
}
```

## Creating New Factories

```typescript
// tests/factories/post.factory.ts
import { Factory } from '@/lib/factories';
import type { CreatePostModelData } from '@/models/posts';
import { userFactory } from './user.factory';

class PostFactory extends Factory<CreatePostModelData> {
  published() {
    return this.params({ status: 'published' });
  }

  async create(params) {
    const post = this.build(params);
    const { createPosts } = await import('@/models/posts');
    const [created] = await createPosts([post]);
    return created;
  }
}

export const postFactory = PostFactory.define(({ sequence, associations }) => ({
  title: Factory.faker.lorem.sentence(),
  content: Factory.faker.lorem.paragraphs(3),
  author: associations.author || userFactory.build(),
  status: 'draft',
}));
```

Export from `tests/factories/index.ts`:

```typescript
export { postFactory } from './post.factory';
```

## Key Patterns

1. **Build model types**: Use `CreateEntityModelData` from models layer, not database insert types
2. **Prefer defaults over custom parameters**: Use factories as-is whenever possible
3. **Use traits for variations**: `.processed().fat()` is clearer and more maintainable than custom params
4. **Auto-create parents**: Let factories create parent entities automatically - only create explicitly when needed
5. **Use `.create()` for persistence**: Calls model layer, handles transactions
6. **Use transient params**: Control behavior without affecting output
7. **Use `Factory.faker`**: Generate realistic data (`Factory.faker.person.fullName()`)
8. **Ensure uniqueness**: Use timestamp + sequence pattern for truly unique values (see Uniqueness Pattern below)

```typescript
// ✅ EXCELLENT - Uses defaults and traits, auto-creates parents
const project = await projectFactory.create(); // Auto-creates team
const task = await taskFactory.highPriority().create(); // Auto-creates project → team

// ✅ EXCELLENT - Uses defaults and traits
const oil = await foodFactory.processed().fat().create();
const veggies = await foodFactory.vegetable().createList(3);

// ⚠️ USE SPARINGLY - Custom param only when test requires specific value
const oil = await foodFactory.processed().fat().create({ name: 'olive oil' });

// ❌ AVOID - Unnecessary parent creation
const team = await teamFactory.create();
const project = await projectFactory.create({ teamId: team.id }); // Should just use projectFactory.create()

// ❌ AVOID - Manual construction and direct database insert
const oil = { name: 'oil', type: 'processed', category: 'fat', ... };
await db.insert(foods).values(oil);

// ❌ AVOID - Too many custom parameters defeats the purpose
const oil = await foodFactory.create({
  name: 'oil',
  type: 'processed',
  category: 'fat',
  servingSize: 100,
  // ... many more custom params
});
```

## Uniqueness Pattern

Factories use different uniqueness strategies depending on the table's ID type: auto-increment vs UUID/string IDs.

### For Auto-Increment IDs (Numeric Primary Keys)

For tables with auto-increment primary keys (like `households`, `meal_plans`), **do not set the ID** - let the database handle it:

```typescript
export const householdFactory = HouseholdFactory.define(({ sequence }) => ({
  // Don't set id - let database auto-increment handle it
  address: Factory.faker.location.streetAddress(),
  inviteCode: Factory.faker.string.alphanumeric(8).toUpperCase(),
  createdAt: new Date(),
}));
```

**Why?** SQLite auto-increment doesn't work when you explicitly pass a value (even null). Omitting the field lets the database generate sequential IDs automatically.

### For UUID/String IDs

For tables using UUIDs or string IDs (like `meals`, `foods`), use **timestamp + sequence** pattern in string fields to ensure uniqueness:

```typescript
export const mealFactory = MealFactory.define(({ sequence }) => {
  const timestamp = Date.now();

  return {
    // UUID is generated by the model layer (createMeal function)
    name: `test-meal-${Factory.faker.food.dish()}-${timestamp}-${sequence}`,
    description: Factory.faker.lorem.sentence(),
    // ...
  };
});
```

### Why This Pattern?

- **No reliance on cleanup**: Even if `beforeEach` cleanup fails, values remain unique
- **Parallel test safety**: Multiple test runs can't create conflicting names/slugs
- **Debugging**: Timestamp makes it easy to identify when test data was created
- **Model layer handles IDs**: Let UUID generation happen in model functions, not factories

### Best Practices

1. **Auto-increment tables**: Omit `id` field completely, let database handle it
2. **UUID tables**: Use timestamp in string fields like `name`, but let model layer generate actual ID
3. **String patterns**: Use `prefix-${faker.method()}-${timestamp}-${sequence}` for name fields
4. **Capture timestamp once**: Store in const to ensure same value across all fields
5. **Still implement proper cleanup**: Unique pattern doesn't replace cleanup, it's a safety net
6. **Direct inserts in tests**: When using `db.insert()` directly in tests, omit auto-increment ID fields

## Resources

- `tests/factories/food.factory.ts` - Complete implementation reference
- `tests/integration/meals-model.test.ts` - Real-world usage (165 → 20 lines)
- [Fishery Docs](https://github.com/thoughtbot/fishery) - Factory library
- [Faker Docs](https://fakerjs.dev/) - Fake data API
