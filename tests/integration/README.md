# Integration Testing

Integration tests verify interactions between the data layer (models), database operations, and business logic. These tests use the actual database with seeded fixture data.

## Database Setup

### Pre-Seeded Fixture Data

The test database is **already seeded** with fixture data before integration tests run. This happens automatically in `vitest.setup.ts` during the global setup phase.

**Seeded data includes:**

- **Foods**: From `src/fixtures/foods.ts` - various ingredients with full nutrition data
- **Recipes**: From `src/fixtures/index.ts` - complete recipes with ingredients
- **Meals**: From `src/fixtures/index.ts` - meals composed of recipes
- **Users**: Test users (admin@example.com, bob@alice.com) with completed onboarding
- **Households**: Test household with memberships for both users
- **Nutrition Targets**: Default macros for test users
- **Kroger Store**: Store preference for admin user

You can **reference and use** this existing fixture data in your tests instead of creating everything from scratch.

### Teardown and Cleanup

Test data cleanup happens **automatically** in `vitest.setup.ts` during the global teardown phase. The teardown process:

1. **Runs after all tests complete** (not after each test)
2. **Only removes factory-generated test data** using pattern matching:
   - Meals with names like `test-meal-*`
   - Households with addresses containing `test` or `faker`
   - Users with emails containing `test` or `faker`
3. **Preserves seeded fixture data** for use across all tests

**Important**: The seeded fixture data (foods, recipes, meals from fixtures) is NOT removed during teardown - it persists for the entire test run.

## Writing Integration Tests

### Always Use Factories

**CRITICAL**: Always use test data factories from `tests/factories/` instead of manual object construction or direct database inserts.

```typescript
// ✅ GOOD - Use factories
import { foodFactory } from '../factories';

const food = await foodFactory.processed().fat().create();

// ❌ BAD - Manual construction
const food = {
  id: 'some-id',
  name: 'Olive Oil',
  type: 'processed',
  // ... many more fields
};
await db.insert(foods).values(food);
```

**Benefits of using factories:**

- Less test code (87% reduction)
- Realistic data via Faker
- Type-safe with full inference
- Automatic cleanup (factory data matches teardown patterns)
- Reusable and maintainable

See `tests/factories/README.md` for comprehensive factory documentation.

### Using Existing Fixture Data

You can reference existing seeded data in your tests:

```typescript
import { db } from '@/lib/db';
import { foods, recipes, meals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get an existing food from fixtures
const oliveOil = await db.query.foods.findFirst({
  where: eq(foods.name, 'Olive Oil'),
});

// Get an existing recipe
const greekSalad = await db.query.recipes.findFirst({
  where: eq(recipes.name, 'Greek Salad'),
  with: {
    ingredients: {
      with: { food: true },
    },
  },
});
```

### Creating Test-Specific Data

When you need custom test data, use factories:

```typescript
import { foodFactory, mealFactory } from '../factories';

// Create test-specific foods
const customFood = await foodFactory.protein().create({
  name: 'Special Chicken Breast',
});

// Create test-specific meals
const customMeal = await mealFactory.create({
  name: 'Custom Test Meal',
});
```

Factory-generated data automatically follows naming patterns that will be cleaned up during teardown.

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db';
import { myModel } from '@/models/my-model';
import { foodFactory } from '../factories';

describe('myModel', () => {
  it('should perform integration correctly', async () => {
    // Arrange: Use factories for test data
    const testFood = await foodFactory.create();

    // Act: Call model layer function
    const result = await myModel(testFood);

    // Assert: Verify database state and return values
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    // Verify database state with query
    const dbRecord = await db.query.foods.findFirst({
      where: eq(foods.id, result.data.id),
    });
    expect(dbRecord).toBeDefined();
  });
});
```

## Best Practices

1. **Use Factories**: Always use `tests/factories/` for test data creation
2. **Leverage Seeded Data**: Reference existing fixture data when possible to avoid creating duplicates
3. **Trust Automatic Cleanup**: Don't manually delete test data - teardown handles it
4. **Test Model Layer**: Focus on testing model functions, not raw database operations
5. **Use Transactions**: Model functions should handle transactions - test the complete workflow
6. **Verify State**: Assert both return values and database state changes
7. **Isolation**: Each test should be independent despite shared seeded data

## Common Patterns

### Testing Model Creation

```typescript
import { createMeal } from '@/models/meals';
import { foodFactory } from '../factories';

it('should create meal with recipes', async () => {
  const food1 = await foodFactory.create();
  const food2 = await foodFactory.create();

  const result = await createMeal({
    name: 'Test Meal',
    recipes: [
      {
        recipe: {
          name: 'Test Recipe',
          ingredients: [
            { quantity: 100, unit: 'g', food: food1 },
            { quantity: 50, unit: 'g', food: food2 },
          ],
        },
      },
    ],
  });

  expect(result.success).toBe(true);
  expect(result.meal).toBeDefined();
});
```

### Testing with Existing Fixtures

```typescript
import { db } from '@/lib/db';
import { recipes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

it('should work with existing recipe data', async () => {
  // Use pre-seeded recipe from fixtures
  const existingRecipe = await db.query.recipes.findFirst({
    where: eq(recipes.name, 'Greek Salad'),
    with: {
      ingredients: {
        with: { food: true },
      },
    },
  });

  expect(existingRecipe).toBeDefined();
  expect(existingRecipe.ingredients.length).toBeGreaterThan(0);

  // Test operations with existing data
  // ...
});
```

### Testing Deduplication

```typescript
it('should deduplicate foods across recipes', async () => {
  // Create one food, use it in multiple places
  const sharedFood = await foodFactory.create();

  const result = await createMeal({
    name: 'Test Deduplication',
    recipes: [
      {
        recipe: {
          name: 'Recipe 1',
          ingredients: [{ quantity: 100, unit: 'g', food: sharedFood }],
        },
      },
      {
        recipe: {
          name: 'Recipe 2',
          ingredients: [{ quantity: 50, unit: 'g', food: sharedFood }],
        },
      },
    ],
  });

  expect(result.success).toBe(true);

  // Verify the food was not duplicated
  const uniqueFoods = new Set(
    result.meal.recipes.flatMap((r) =>
      r.recipe.ingredients.map((i) => i.food.id),
    ),
  );
  expect(uniqueFoods.size).toBe(1);
});
```

## Running Integration Tests

```bash
# Run only integration tests
npm run test:integration
make test-integration

# Run all tests (includes integration)
npm test
make test-all

# Run with coverage
npm run test:integration -- --coverage
```

## Debugging

### View Seeded Data

To see what fixture data is available:

```bash
# Check the seed script
cat scripts/seed.ts

# Check fixture files
cat src/fixtures/foods.ts
cat src/fixtures/index.ts
```

### Common Issues

**Issue**: Test fails because expected data doesn't exist  
**Solution**: Check if data needs to be created with factories or if it should use seeded fixtures

**Issue**: Unique constraint violations  
**Solution**: Ensure factory-generated data uses timestamp patterns (see `tests/factories/README.md`)

**Issue**: Test data not cleaned up  
**Solution**: Verify test data follows factory naming patterns (e.g., `test-meal-*`)

## Related Documentation

- `tests/factories/README.md` - Factory pattern and usage
- `tests/README.md` - Overall testing architecture
- `tests/e2e/README.md` - E2E testing with Playwright
- `vitest.setup.ts` - Seed and teardown implementation
- `scripts/seed.ts` - Database seeding logic
