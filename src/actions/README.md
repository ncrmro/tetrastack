# Actions Layer

## Purpose

The `actions/` directory serves as the boundary layer between backend code (database schemas, models, agents) and **ALL React components**.
This creates a clean separation of concerns where React components only interact with the actions layer, never directly with the underlying implementation.

## Architecture Pattern

```
React Components (any)
        ↓
    Actions Layer  ← YOU ARE HERE
        ↓
Backend (DB/Models/Agents)
```

## Import Rules

### ✅ React Components (ALL)

```typescript
// ANY React component should import from actions
import {
  createFood,
  updateFood,
  type SelectFood,
  type InsertFood,
} from '@/actions/foods';
import {
  createRecipe,
  type SelectRecipe,
  type RecipeInput,
} from '@/actions/recipes';
```

## Re-export Pattern

Each action file re-exports types that React components need:

```typescript
// src/actions/foods.ts
'use server';

import type { InsertFood, SelectFood } from '@/lib/db/schema.foods.types';
import { createFoodWithNutrients as createFoodWithNutrientsModel } from '@/models/foods';

// Re-export types for React components
export type {
  InsertFood,
  SelectFood,
  InsertFoodNutrient,
  SelectFoodNutrient,
} from '@/lib/db/schema.foods.types';

// Re-export model types if needed by components
export type { FoodNutrientData } from '@/models/foods';

// Action functions
export async function createFood(data: InsertFood) {
  // implementation
}
```

## Key Requirements

1. **"use server" directive**: All action files must start with `'use server';`
2. **Type re-exports**: Only re-export types actually used by React components
3. **No redirects in actions**: Return success/error objects and handle navigation in components
4. **Authentication**: Most actions require authentication via `auth()` from NextAuth
5. **Avoid superfluous functions**: Follow the bulk operation pattern from `src/models/README.md` - prefer single flexible functions with array parameters over multiple specific functions for each scenario

## Benefits

- **Clean separation**: React components don't know about database schemas or models
- **Type safety**: Components get properly typed interfaces
- **Single import**: Components import actions and types from one place
- **Maintainability**: Changes to backend implementation don't affect component imports
