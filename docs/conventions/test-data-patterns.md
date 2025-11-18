# Test Data Patterns

This project uses three complementary patterns for managing test and development data. Each serves a different purpose and context.

## Overview

| Pattern       | Purpose                                   | Context                  | Location              |
| ------------- | ----------------------------------------- | ------------------------ | --------------------- |
| **Factories** | Generate test data with sensible defaults | Unit & integration tests | `tests/factories/`    |
| **Fixtures**  | Pre-configured test contexts              | E2E tests (Playwright)   | `tests/e2e/fixtures/` |
| **Seed Data** | Populate development database             | Development environment  | `scripts/seed.ts`     |

## 1. Factories (Unit & Integration Tests)

Rails FactoryBot-inspired pattern using **fishery** + **@faker-js/faker** for generating test data. Reduces test code by 87% while improving readability and maintainability.

### Purpose

- **Generate test data** with sensible defaults and realistic values
- **Reduce boilerplate** in test files
- **Persist to database** via the models layer
- **Chain traits** for complex test scenarios
- **Minimize custom parameters** to keep tests maintainable and flexible

### Stack

- **fishery** v2.3.1: Factory pattern library
- **@faker-js/faker** v10.1.0: Fake data generation

### When to Use

- ✅ **Unit tests** requiring database records
- ✅ **Integration tests** with complex data setups
- ✅ **Test data** that needs variations (traits)
- ✅ **Tests** requiring associations between entities

### Example Usage

```typescript
import { userFactory, mealFactory } from '../factories';

// ✅ PREFERRED: Build with defaults - no custom parameters
const user = userFactory.build();

// ✅ PREFERRED: Use traits for variations
const processedFatFood = foodFactory.processed().fat().build();

// ⚠️ USE SPARINGLY: Override specific fields only when test requires it
const admin = userFactory.build({ name: 'Alice' });

// ✅ PREFERRED: Persist to database via model layer with defaults
const savedUser = await userFactory.create();

// Build multiple with defaults
const users = userFactory.buildList(5);

// Build with associations
const meal = mealFactory.build(
  {},
  {
    associations: {
      creator: userFactory.build(), // ✅ Uses defaults
    },
  },
);
```

**CRITICAL: Minimize Custom Parameters**

The power of factories is in their sensible defaults. Use **as few custom parameters as possible**:

- ✅ **Preferred**: `userFactory.create()` - Rely on defaults
- ✅ **Preferred**: `foodFactory.processed().fat().create()` - Use traits
- ⚠️ **Use sparingly**: `userFactory.create({ email: 'specific@test.com' })` - Only when test logic requires it
- ❌ **Avoid**: `userFactory.create({ name: 'X', email: 'Y', role: 'Z', ... })` - Too many overrides

**Why?**

- **Maintainability**: Fewer parameters mean fewer breaking changes when factories evolve
- **Readability**: Custom parameters should signal "this value is important for this test"
- **Flexibility**: Factory defaults can be improved without updating every test
- **Intent**: Excessive customization obscures what the test is actually verifying

### Creating New Factories

```typescript
// tests/factories/post.factory.ts
import { Factory } from '@/lib/factories';
import type { CreatePostModelData } from '@/models/posts';
import { userFactory } from './user.factory';

class PostFactory extends Factory<CreatePostModelData> {
  // Define traits for common variations
  published() {
    return this.params({ status: 'published' });
  }

  // Implement create() for database persistence
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

**Export from `tests/factories/index.ts`:**

```typescript
export { postFactory } from './post.factory';
```

### Key Patterns

1. **Build model types**: Use `CreateEntityModelData` from models layer, not database insert types
2. **Minimize custom parameters**: Rely on factory defaults as much as possible
3. **Use traits for variations**: `.processed().fat()` is clearer and more maintainable than custom params
4. **Use `.create()` for persistence**: Calls model layer, handles transactions
5. **Use `Factory.faker`**: Generate realistic data (`Factory.faker.person.fullName()`)
6. **Ensure uniqueness**: Use timestamp + sequence pattern for truly unique values

**Code Examples:**

```typescript
// ✅ EXCELLENT - Uses defaults and traits
const oil = await foodFactory.processed().fat().create();
const veggies = await foodFactory.vegetable().createList(3);

// ⚠️ USE SPARINGLY - Custom param only when test requires specific value
const specificOil = await foodFactory.processed().fat().create({ name: 'olive oil' });

// ❌ AVOID - Manual construction bypasses factory benefits
const oil = { name: 'oil', type: 'processed', category: 'fat', ... };
await db.insert(foods).values(oil);

// ❌ AVOID - Too many custom parameters
const oil = await foodFactory.create({
  name: 'oil',
  type: 'processed',
  category: 'fat',
  servingSize: 100,
  // ... defeats the purpose of factories
});
```

### Uniqueness Pattern

Different strategies based on ID type:

#### Auto-Increment IDs (Numeric Primary Keys)

For tables with auto-increment primary keys (like `households`, `meal_plans`), **don't set the ID** - let the database handle it:

```typescript
export const householdFactory = HouseholdFactory.define(({ sequence }) => ({
  // Don't set id - let database auto-increment handle it
  address: Factory.faker.location.streetAddress(),
  inviteCode: Factory.faker.string.alphanumeric(8).toUpperCase(),
  createdAt: new Date(),
}));
```

**Why?** SQLite auto-increment doesn't work when you explicitly pass a value (even null). Omitting the field lets the database generate sequential IDs automatically.

#### UUID/String IDs

For tables using UUIDs or string IDs (like `meals`, `foods`), use **timestamp + sequence** pattern in string fields:

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

### Resources

- `tests/factories/README.md`: Complete factory documentation
- `tests/factories/food.factory.ts`: Complete implementation reference
- `tests/integration/meals-model.test.ts`: Real-world usage (165 → 20 lines)
- [Fishery Docs](https://github.com/thoughtbot/fishery): Factory library
- [Faker Docs](https://fakerjs.dev/): Fake data API

---

## 2. Fixtures (E2E Tests)

Playwright test fixtures provide pre-configured test contexts with authentication, onboarding, and domain-specific setup.

### Purpose

- **Fast authentication** using cookie-based sessions (no UI login)
- **Fast onboarding** by populating database directly (no UI workflow)
- **Pre-configured contexts** for different user states
- **Domain-specific setup** (households, meal plans, recipes)

### When to Use

- ✅ **E2E tests** requiring authenticated users
- ✅ **E2E tests** requiring onboarded users
- ✅ **E2E tests** with complex domain setup (meal plans with meals)
- ✅ **E2E tests** needing multiple user roles (admin vs regular user)

### Available Base Fixtures

Import from `tests/e2e/fixtures/base-fixtures.ts`:

```typescript
import { test, expect } from './fixtures/base-fixtures';

test('my test', async ({ onboardedUser }) => {
  const { page, userId } = onboardedUser;
  // User is already authenticated and onboarded
  await page.goto('/meal-plan');
});
```

#### Authentication States

- **`onboardedUser`**: Regular user with completed onboarding (cookie-based, fast)
- **`onboardedAdmin`**: Admin user with completed onboarding (cookie-based, fast)
- **`authenticatedUser`**: Regular user, authentication only (no onboarding)
- **`authenticatedAdmin`**: Admin user, authentication only (no onboarding)
- **`unauthenticatedUser`**: Clean slate for testing auth flows

#### Test Data

- **`baseTestData`**: Test data for regular user (credentials, name, etc.)
- **`baseAdminTestData`**: Test data for admin user

### Domain-Specific Fixtures

- **`household-fixtures.ts`**: Household setup and invitation flows
- **`meal-plan-fixtures.ts`**: Meal plan creation with meals
- **`recipe-fixtures.ts`**: Recipe creation with ingredients

### Creating Custom Fixtures

```typescript
import { test as base } from './base-fixtures';
import type { OnboardedContext } from './base-fixtures';

type MealPlanFixtures = {
  mealPlanWithMeals: OnboardedContext & { mealPlanId: number };
};

export const test = base.extend<MealPlanFixtures>({
  mealPlanWithMeals: async ({ onboardedUser }, use) => {
    const { page, userId } = onboardedUser;

    // Setup: Create meal plan with meals
    const { createMealPlans } = await import('@/models/meal-plans');
    const [mealPlan] = await createMealPlans([
      {
        householdId: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ]);

    await use({
      page,
      userId,
      mealPlanId: mealPlan.id,
    });

    // Cleanup (optional)
  },
});
```

### How Fixtures Work

1. **Base Fixtures** (`base-fixtures.ts`):
   - Generate deterministic test data (unique per worker + timestamp)
   - Create test user in database
   - Generate JWT session token
   - Set authentication cookies
   - Optionally complete onboarding in database

2. **Domain Fixtures** (extend base):
   - Import and extend base fixtures
   - Create domain-specific data (meal plans, recipes)
   - Provide fully configured contexts to tests

3. **Tests**:
   - Import extended fixtures
   - Access pre-configured contexts
   - Focus on user interactions, not setup

### Resources

- `tests/e2e/README.md`: Complete E2E testing documentation
- `tests/e2e/fixtures/base-fixtures.ts`: Base fixture implementation
- `tests/e2e/fixtures/meal-plan-fixtures.ts`: Domain fixture example

---

## 3. Seed Data (Development Environment)

Populates the development database with initial data for manual testing and development.

### Purpose

- **Populate development database** with realistic data
- **Create test users** for manual testing
- **Provide sample data** for UI development
- **Reset database** to known state

### When to Use

- ✅ **Initial setup** of development environment
- ✅ **After database migrations** that clear data
- ✅ **Manual testing** requiring specific data
- ✅ **UI development** needing sample content

### Running Seed Script

```bash
npm run db:seed     # Populate database with seed data
```

### What Gets Seeded

1. **Nutrients**: Master list (calories, protein, carbs, fat, etc.)
2. **Test Users**:
   - Admin: `admin@example.com` (ID: 1)
   - Regular: `bob@alice.com` (ID: 2)
   - Both with completed onboarding and nutrition targets
3. **Household**: Test household with both users as members
4. **Foods**: From `src/fixtures/foods.ts` with nutritional data
5. **Recipes**: From `src/fixtures/` with ingredients
6. **Meals**: From `src/fixtures/` with recipe associations

### Seed Script Structure

```typescript
// scripts/seed.ts
async function seed() {
  // 1. Clear existing data (in correct order)
  await db.delete(userNutrientDailyTargets);
  await db.delete(mealRecipes);
  // ... clear all tables

  // 2. Insert nutrients (required for foreign keys)
  await db.insert(nutrientsTable).values(nutrientsToInsert);

  // 3. Insert test users
  const [adminUser, regularUser] = await db.insert(users).values([...]);

  // 4. Seed nutrition targets
  await seedDefaultNutritionTargets(adminUser.id);

  // 5. Create household and memberships
  const [testHousehold] = await db.insert(households).values({...});

  // 6. Insert foods, recipes, meals from fixtures
  await db.insert(foods).values(foodsToInsert);
  // ... more inserts
}
```

### Static Fixtures

Seed data uses static fixtures from `src/fixtures/`:

- `src/fixtures/foods.ts`: Sample food items with nutritional data
- `src/fixtures/recipes.ts`: Sample recipes with ingredients
- `src/fixtures/meals.ts`: Sample meals with recipe associations

**Note**: These static fixtures are separate from test factories. Factories generate dynamic data for tests, while static fixtures provide consistent seed data.

### Development Credentials

After seeding, you can sign in with:

- **Admin**: `admin@example.com` (password: any suffix with "admin", e.g., "admin-123")
- **Regular User**: `bob@alice.com` (password: any suffix with "password", e.g., "password-456")

---

## Pattern Comparison

### When to Use What

| Scenario                             | Pattern     | Reason                                |
| ------------------------------------ | ----------- | ------------------------------------- |
| Unit test needs a user record        | **Factory** | Generate with defaults, persist to DB |
| Integration test needs complex setup | **Factory** | Chain traits, build associations      |
| E2E test needs authenticated user    | **Fixture** | Fast cookie-based auth                |
| E2E test needs onboarded user        | **Fixture** | Fast database setup                   |
| Development environment needs data   | **Seed**    | Populate with realistic data          |
| Manual testing needs specific state  | **Seed**    | Reset to known state                  |

### Key Differences

| Aspect          | Factories              | Fixtures                | Seed                  |
| --------------- | ---------------------- | ----------------------- | --------------------- |
| **Context**     | Unit/Integration       | E2E (Playwright)        | Development           |
| **Purpose**     | Generate test data     | Configure test contexts | Populate database     |
| **Dynamic**     | Yes (traits, faker)    | Yes (per-worker unique) | No (static data)      |
| **Persistence** | Via models layer       | Direct DB + cookies     | Direct DB inserts     |
| **Reuse**       | High (compose, traits) | High (extend fixtures)  | Low (one-time run)    |
| **Speed**       | Fast                   | Very fast (cookies)     | Moderate (full setup) |

### Pattern Relationships

```
Development Environment
  └── Seed Data (scripts/seed.ts)
      └── Static Fixtures (src/fixtures/)

Test Environment
  ├── Unit & Integration Tests
  │   └── Factories (tests/factories/)
  │       └── Generate with faker + traits
  │
  └── E2E Tests (Playwright)
      └── Fixtures (tests/e2e/fixtures/)
          ├── Base Fixtures (auth, onboarding)
          └── Domain Fixtures (meal plans, recipes)
              └── May use Factories for data generation
```

### Composition Example

E2E fixtures can use factories for data generation:

```typescript
// tests/e2e/fixtures/meal-plan-fixtures.ts
import { mealFactory } from '../../factories';

export const test = base.extend<MealPlanFixtures>({
  mealPlanWithMeals: async ({ onboardedUser }, use) => {
    const { page, userId } = onboardedUser;

    // Use factory to generate meal data
    const meals = await mealFactory.createList(3);

    // Create meal plan with generated meals
    const mealPlan = await createMealPlanWithMeals(meals);

    await use({ page, userId, mealPlanId: mealPlan.id });
  },
});
```

---

## Best Practices

### Factories

1. ✅ Use `CreateEntityModelData` types from models layer
2. ✅ Minimize custom parameters - rely on defaults and traits
3. ✅ Implement traits for common variations
4. ✅ Use `.create()` for database persistence
5. ✅ Use timestamp + sequence for uniqueness
6. ✅ Export from `tests/factories/index.ts`

**Custom Parameter Guidelines:**

- Use factories with defaults: `foodFactory.create()`
- Use traits for variations: `foodFactory.processed().fat().create()`
- Override sparingly: Only when test logic requires a specific value
- Avoid multiple overrides: This makes tests brittle and hard to maintain

### Fixtures

1. ✅ Use base fixtures for authentication/onboarding
2. ✅ Create domain fixtures for complex setup
3. ✅ Keep fixtures focused on single responsibility
4. ✅ Use cookie-based auth (faster than UI)
5. ✅ Clean up contexts in fixture teardown

### Seed Data

1. ✅ Clear data in correct order (child tables first)
2. ✅ Use static fixtures for consistency
3. ✅ Document credentials in comments
4. ✅ Make seed idempotent (can run multiple times)
5. ✅ Keep seed data realistic and useful

---

## Migration Guide

### From Direct DB Inserts to Factories

**Before:**

```typescript
test('create meal', async () => {
  const user = await db
    .insert(users)
    .values({
      email: 'test@example.com',
      name: 'Test User',
      admin: false,
    })
    .returning();

  const meal = await db
    .insert(meals)
    .values({
      name: 'Test Meal',
      description: 'A test meal',
      creatorId: user.id,
    })
    .returning();

  // ... test code
});
```

**After:**

```typescript
import { userFactory, mealFactory } from '../factories';

test('create meal', async () => {
  // ✅ PREFERRED: Use defaults
  const user = await userFactory.create();
  const meal = await mealFactory.create({ creatorId: user.id });

  // ... test code
});

// Or even better if creator doesn't matter for the test:
test('create meal', async () => {
  // ✅ EXCELLENT: Let factory handle all defaults
  const meal = await mealFactory.create();

  // ... test code
});
```

### From UI-Based E2E Setup to Fixtures

**Before:**

```typescript
test('create meal plan', async ({ page }) => {
  // Sign in via UI (slow)
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Complete onboarding via UI (very slow)
  await page.goto('/onboarding');
  // ... 10+ steps of onboarding

  // Finally, test the actual feature
  await page.goto('/meal-plan');
  // ... test code
});
```

**After:**

```typescript
import { test } from './fixtures/base-fixtures';

test('create meal plan', async ({ onboardedUser }) => {
  const { page } = onboardedUser;

  // User is already authenticated and onboarded (fast)
  await page.goto('/meal-plan');
  // ... test code
});
```

---

## Troubleshooting

### Factories

**Issue**: Factory build fails with type errors

- ✅ Use `CreateEntityModelData` type from models layer
- ✅ Check that all required fields are provided in factory definition

**Issue**: Tests fail with unique constraint violations

- ✅ Use timestamp + sequence pattern for unique fields
- ✅ Ensure proper test cleanup in `beforeEach`

### Fixtures

**Issue**: E2E authentication fails

- ✅ Check `AUTH_SECRET` environment variable
- ✅ Verify cookie domain matches test URL
- ✅ Use `authenticatedUser` fixture for debugging

**Issue**: Fixtures are slow

- ✅ Use cookie-based auth instead of UI login
- ✅ Use database setup instead of UI onboarding
- ✅ Minimize fixture dependencies

### Seed Data

**Issue**: Seed script fails with foreign key errors

- ✅ Clear tables in correct order (child tables first)
- ✅ Insert parent records before child records
- ✅ Check that foreign key references exist

**Issue**: Seed data is outdated

- ✅ Update static fixtures in `src/fixtures/`
- ✅ Re-run `npm run db:seed`

---

## Summary

| Pattern       | Command                | Documentation                |
| ------------- | ---------------------- | ---------------------------- |
| **Factories** | Used in tests directly | `tests/factories/README.md`  |
| **Fixtures**  | Used in E2E tests      | `tests/e2e/README.md`        |
| **Seed**      | `npm run db:seed`      | `scripts/seed.ts` (comments) |

**Key Takeaway**: Each pattern serves a specific purpose. Use factories for unit/integration tests, fixtures for E2E tests, and seed data for development. They complement each other and can be composed for powerful test setups.
