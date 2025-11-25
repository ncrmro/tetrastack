# Database Layer

## Overview

The database layer uses SQLite locally and Turso (SQLite-compatible) in production with Drizzle ORM for type-safe database operations.

## Schema Organization

The database is organized into **eight domain-specific schema files** (`schema.*.ts`), each defining related tables and their relationships:

### Authentication & Users (`schema.auth.ts`)

- `users`: Core user data, admin status, onboarding completion
- `accounts`: OAuth provider account links (NextAuth.js)
- `sessions`: User session management
- `verificationTokens`: Email verification tokens
- `authenticators`: WebAuthn/2FA credentials

### Households (`schema.households.ts`)

- `households`: Physical addresses with invite codes
- `householdMemberships`: User-household relationships with admin privileges

### Nutrition (`schema.nutrients.ts`)

- `nutrients`: Master list of nutrients (calories, protein, etc.) with units

### User Targets (`schema.user-targets.ts`)

- `userNutrientDailyTargets`: Time-series daily nutrition goals per user/nutrient

### Foods (`schema.foods.ts`)

- `foods`: Base food items with nutritional serving data, types (raw/processed/manufactured), subtypes (vegetable/grain/protein/etc.)
- `foodNutrients`: Nutritional values per food serving

### Recipes (`schema.recipes.ts`)

- `recipes`: Named collections of ingredients
- `recipeIngredients`: Food quantities and units per recipe

### Meals (`schema.meals.ts`)

- `meals`: Collections of recipes with descriptions
- `mealRecipes`: Recipe associations per meal

### Meal Plans (`schema.meal-plans.ts`)

- `mealPlans`: Household meal schedules with date ranges
- `mealPlansMeals`: Meal quantities per plan
- `mealPlanShoppingListItems`: Generated shopping lists with quantities and check status

## Migration Management

### Migration Commands

```bash
npm run db:generate     # Generate migration files from schema changes
npm run db:migrate      # Apply migrations to database
make migration-reconcile # Resolve migration conflicts across branches
npx drizzle-kit generate --custom --name=<migration_name> # Generate custom migration file for manual SQL
```

**Custom Migrations**: When you need to write manual SQL (for data migrations, complex alterations, etc.), use `npx drizzle-kit generate --custom --name=<descriptive_name>` to create an empty migration file that you can populate with custom SQL.

### When to Reconcile Migrations

Use `make migration-reconcile` when:

- Working across multiple branches with schema changes
- Migration conflicts occur during merge
- Database schema is out of sync with migration files

## Data Operations

```bash
npm run db:seed         # Seed database with test data
npm run db:dataload     # Load additional data
```

## Common Patterns

### Primary Keys

- **UUIDs (v7)**: Used for most entities to support distributed systems
  - Generated via `generateUuidV7()` helper
  - Format: `text('id').primaryKey().$defaultFn(() => generateUuidV7())`
- **Integer IDs**: Used for user-facing entities like `users` (simpler for NextAuth.js)

### Relationships

- Use Drizzle's `relations()` for type-safe joins
- Define foreign keys with `references()` and appropriate cascade behavior
- Use `onDelete: 'cascade'` for dependent data (e.g., food nutrients)

### Indexing

- Create indexes for frequently queried columns
- Use composite indexes for multi-column queries
- Example: `index('foods_type_idx').on(foods.type)`

### JSON Columns

- Use `text('column_name', { mode: 'json' })` for structured data
- Validate with Zod schemas in application code
- Examples: `wholeUnits` in foods, `onboardingData` in users

### Enums

- Define as TypeScript const arrays: `export const FOOD_TYPES = ['raw', 'processed', 'manufactured'] as const;`
- Use in schema: `text('type', { enum: FOOD_TYPES })`
- Provides type safety and validation

## Type Generation

- Types are auto-generated from schema definitions
- Import types from schema files: `import type { InsertFood, SelectFood } from '@/lib/db/schema.foods.types'`
- Drizzle generates `Insert*` and `Select*` types for each table
- Use Zod schemas (defined alongside tables) for validation

## Working with the Database

### Import Pattern

```typescript
import { db } from '@/lib/db';
import { foods, foodNutrients } from '@/lib/db/schema.foods';
```

### Query Examples

```typescript
// Insert with returning
const [newFood] = await db.insert(foods).values(data).returning();

// Select with join
const foodWithNutrients = await db
  .select()
  .from(foods)
  .leftJoin(foodNutrients, eq(foodNutrients.foodId, foods.id))
  .where(eq(foods.id, foodId));

// Update
await db.update(foods).set({ name: 'New Name' }).where(eq(foods.id, id));

// Delete with cascade
await db.delete(foods).where(eq(foods.id, id)); // Cascades to foodNutrients
```

## Best Practices

1. **Schema Changes**: Always generate migrations after schema changes
2. **Type Safety**: Use generated types, never `any`
3. **Validation**: Validate input with Zod before database operations
4. **Relations**: Prefer type-safe joins over manual queries
5. **Indexes**: Add indexes for performance-critical queries
6. **Cascade Deletes**: Use carefully; document dependencies
7. **Transactions**: Use for multi-table operations that must succeed/fail together
8. **UUID v7**: Preferred for distributed systems and time-ordered IDs

## Connection Management

- Database connection is initialized in `src/lib/db/index.ts`
- Uses environment variables for connection strings
- Local development: SQLite file-based database
- Production: Turso (SQLite-compatible cloud database)
