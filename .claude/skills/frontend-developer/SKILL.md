---
name: frontend-developer
description: Expert in building React 19 components with Next.js 15 App Router, TailwindCSS, and the project's theme system. Use when creating or modifying UI components, pages, layouts, client interactions, or styling. Always consults globals.css for theme tokens.
allowed-tools: Read, Edit, Write, Grep, Glob, mcp__typescript-lsp__definition, mcp__typescript-lsp__references, mcp__typescript-lsp__diagnostics, mcp__typescript-lsp__edit_file, mcp__typescript-lsp__rename_symbol
---

# Frontend Developer Skill

Expert frontend development for the Tetrastack/Meze meal prep platform using Next.js 15, React 19, and TailwindCSS with a Material Design-inspired theme system.

## Core Principles

### 1. Server Components First

Always prefer React Server Components over Client Components:

✅ **Default to Server Components**:

```typescript
// app/meals/page.tsx
import { getMeals } from "@/models/meals";

export default async function MealsPage() {
  const meals = await getMeals();
  return <MealList meals={meals} />;
}
```

❌ **Only use Client Components when needed**:

```typescript
'use client'; // Only add when you need:
// - useState, useEffect, or other React hooks
// - Event handlers (onClick, onChange, etc.)
// - Browser APIs (window, document, etc.)
// - Third-party libraries that require client-side
```

### 2. Theme System - Always Consult globals.css

**CRITICAL**: Always read `src/app/globals.css` before writing any CSS or Tailwind classes.

The project uses a Material Design-inspired theme with semantic color tokens:

- `--primary`, `--on-primary`
- `--secondary`, `--on-secondary`
- `--surface`, `--on-surface`
- `--background`, `--on-background`
- `--error`, `--on-error`

**Light/dark mode**: Use `light-dark()` CSS function for theme-aware colors.

✅ **Correct** - Use theme tokens:

```tsx
<div className="bg-surface text-on-surface">
  <button className="bg-primary text-on-primary">Click me</button>
</div>
```

❌ **Wrong** - Hardcoded colors:

```tsx
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
  <button className="bg-blue-500 text-white">Click me</button>
</div>
```

### 3. Component Organization

Break apart large components to keep files focused and maintainable:

✅ **Good structure**:

```
app/meals/
├── page.tsx              # Main page (100 lines)
├── meal-list.tsx         # List component (80 lines)
├── meal-card.tsx         # Card component (60 lines)
└── meal-filters.tsx      # Filters component (50 lines)
```

❌ **Avoid**:

```
app/meals/
└── page.tsx              # Everything in one file (500+ lines)
```

### 4. Server Actions for Forms

Use server actions for form submissions, not API routes:

✅ **Correct**:

```typescript
// app/meals/new/page.tsx
import { createMeal } from "@/actions/meals";

export default function NewMealPage() {
  return (
    <form action={createMeal}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

For client-side validation or loading states, use `useFormState` or `useFormStatus`:

```typescript
"use client"
import { useFormState } from "react-dom";
import { createMeal } from "@/actions/meals";

export default function MealForm() {
  const [state, formAction] = useFormState(createMeal, null);

  return (
    <form action={formAction}>
      {state?.error && <p className="text-error">{state.error}</p>}
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Directory Structure

### src/app/

Next.js 15 App Router pages and layouts.

**Organization**:

- `app/layout.tsx` - Root layout with theme provider
- `app/page.tsx` - Home page
- `app/[feature]/` - Feature-based organization (meals, recipes, etc.)
- `app/api/` - API routes (use sparingly, prefer server actions)
- `app/globals.css` - **ALWAYS CONSULT FOR THEME TOKENS**

### src/components/

Reusable components.

**Naming conventions**:

- Use kebab-case for file names: `meal-card.tsx`
- Use PascalCase for component names: `MealCard`
- Co-locate related components in feature folders

**Example structure**:

```
components/
├── ui/              # Generic UI components
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── meals/           # Meal-specific components
│   ├── meal-card.tsx
│   └── meal-list.tsx
└── layout/          # Layout components
    ├── header.tsx
    └── nav.tsx
```

## Styling Guidelines

### Theme Tokens

**Always use semantic color tokens from globals.css**:

**Background colors**:

- `bg-background` - Page background
- `bg-surface` - Card/panel backgrounds
- `bg-primary` - Primary actions
- `bg-secondary` - Secondary actions
- `bg-error` - Error states

**Text colors**:

- `text-on-background` - Text on background
- `text-on-surface` - Text on surface
- `text-on-primary` - Text on primary
- `text-on-secondary` - Text on secondary
- `text-on-error` - Text on error

**Example card component**:

```tsx
<div className="bg-surface text-on-surface rounded-lg shadow-md p-4">
  <h2 className="text-xl font-semibold mb-2">Card Title</h2>
  <p className="text-on-surface/80">Card content goes here</p>
  <button className="mt-4 bg-primary text-on-primary px-4 py-2 rounded">
    Action
  </button>
</div>
```

### Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<nav className="flex flex-col md:flex-row gap-4">
  {/* Responsive navigation */}
</nav>
```

### Custom CSS (when needed)

If Tailwind doesn't suffice, use the theme tokens with `light-dark()`:

```css
.custom-component {
  background: light-dark(var(--surface-light), var(--surface-dark));
  color: light-dark(var(--on-surface-light), var(--on-surface-dark));
}
```

## Next.js 15 Patterns

### App Router Structure

**Page pattern**:

```typescript
// app/meals/page.tsx
import { selectMeals } from "@/models/meals";

export default async function MealsPage() {
  const meals = await selectMeals([]);
  return <MealList meals={meals} />;
}
```

**Layout pattern**:

```typescript
// app/meals/layout.tsx
export default function MealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meals</h1>
      {children}
    </div>
  );
}
```

### Loading and Error States

**Loading UI**:

```typescript
// app/meals/loading.tsx
export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
```

**Error boundary**:

```typescript
// app/meals/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold text-error mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="bg-primary text-on-primary px-4 py-2 rounded"
      >
        Try again
      </button>
    </div>
  );
}
```

### Metadata

```typescript
// app/meals/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meals - Meze',
  description: 'Browse and manage your meals',
};
```

## React 19 Patterns

### Server Components (default)

```typescript
// Async server component
async function MealDetails({ id }: { id: number }) {
  const meal = await selectMealById(id);
  return <div>{meal.name}</div>;
}
```

### Client Components (when needed)

```typescript
"use client"

import { useState } from "react";

export function MealFilters() {
  const [filter, setFilter] = useState("");

  return (
    <input
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="border rounded px-3 py-2"
    />
  );
}
```

### Form Actions

```typescript
// Server component with form action
import { createMeal } from "@/actions/meals";

export default function NewMealForm() {
  return (
    <form action={createMeal} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          name="name"
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="bg-primary text-on-primary px-4 py-2 rounded"
      >
        Create Meal
      </button>
    </form>
  );
}
```

## TypeScript Best Practices

### Component Props

```typescript
interface MealCardProps {
  meal: SelectMeal; // From Drizzle schema
  onEdit?: (id: number) => void;
  className?: string;
}

export function MealCard({ meal, onEdit, className }: MealCardProps) {
  return (
    <div className={cn("bg-surface rounded-lg p-4", className)}>
      <h3>{meal.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(meal.id)}>Edit</button>
      )}
    </div>
  );
}
```

### Children Types

```typescript
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return <div className={className}>{children}</div>;
}
```

## Common Tasks

### Create a new page

1. Create `app/[feature]/page.tsx`
2. Fetch data using server component (if needed)
3. Create layout in `app/[feature]/layout.tsx` (if needed)
4. Add loading and error states
5. Update navigation/links

### Create a reusable component

1. Create file in `src/components/[category]/component-name.tsx`
2. Define TypeScript interface for props
3. Use theme tokens for styling
4. Keep it focused (under 100 lines)
5. Export as named export

### Add a form with validation

1. Create server action in `src/actions/`
2. Add Zod validation in the action
3. Create form component (server or client)
4. Use `useFormState` for client-side feedback (if needed)
5. Return success/error objects from action

### Style a component

1. **First**: Read `src/app/globals.css` to understand available theme tokens
2. Use Tailwind classes with theme colors (`bg-primary`, `text-on-surface`, etc.)
3. Use responsive prefixes (`md:`, `lg:`) for breakpoints
4. For complex cases, use custom CSS with `light-dark()` function
5. Test in both light and dark modes

## Testing

### E2E Testing with Playwright

```typescript
// tests/e2e/meals.spec.ts
import { test, expect } from '@/tests/e2e/fixtures';

test('can create a meal', async ({ page, authenticatedUser }) => {
  await page.goto('/meals/new');
  await page.fill('input[name="name"]', 'Test Meal');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/meals\/\d+/);
});
```

See `tests/e2e/README.md` for fixtures and patterns.

### Component Testing

```typescript
// tests/unit/components/meal-card.test.tsx
import { render, screen } from "@testing-library/react";
import { MealCard } from "@/components/meals/meal-card";
import { mealFactory } from "@/tests/factories";

test("renders meal name", async () => {
  const meal = await mealFactory.create();
  render(<MealCard meal={meal} />);
  expect(screen.getByText(meal.name)).toBeInTheDocument();
});
```

## Reference Documentation

Always consult these resources when working in their areas:

- `src/app/globals.css` - Theme system with semantic color tokens (CRITICAL - read before any styling)
- [src/app/README.md](../../../src/app/README.md) - App directory patterns, import rules, and server component guidelines
- [src/components/ui/README.md](../../../src/components/ui/README.md) - UI components wrapper layer and design system integration (CRITICAL)
- [src/lib/glass-components/README.md](../../../src/lib/glass-components/README.md) - Glass components design system philosophy and portability
- [tests/README.md](../../../tests/README.md) - Testing architecture overview and three-tier testing approach
- [tests/e2e/README.md](../../../tests/e2e/README.md) - E2E testing patterns, fixtures, and Playwright best practices
- [tests/factories/README.md](../../../tests/factories/README.md) - Factory pattern for generating test data with minimal parameters

## Common Patterns

### Data fetching pattern

```typescript
// Server component
async function MealsPage() {
  const meals = await selectMeals([]);

  if (meals.length === 0) {
    return <EmptyState />;
  }

  return <MealList meals={meals} />;
}
```

### Interactive list pattern

```typescript
// app/meals/page.tsx - Server component
import { MealList } from "./meal-list";

export default async function MealsPage() {
  const meals = await selectMeals([]);
  return <MealList meals={meals} />;
}

// app/meals/meal-list.tsx - Client component
"use client"

import { useState } from "react";

export function MealList({ meals }: { meals: SelectMeal[] }) {
  const [filter, setFilter] = useState("");

  const filtered = meals.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter meals..."
        className="border rounded px-3 py-2 mb-4 w-full"
      />
      <div className="grid gap-4">
        {filtered.map(meal => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  );
}
```

### Modal/Dialog pattern

```typescript
"use client"

import { useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-surface text-on-surface rounded-lg p-6 max-w-md w-full">
        {children}
        <button
          onClick={onClose}
          className="mt-4 bg-primary text-on-primary px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
```

## Troubleshooting

### Hydration errors

**Symptom**: "Text content does not match server-rendered HTML"

**Solution**: Avoid using browser-only APIs in server components

```typescript
// ❌ Wrong
const isClient = typeof window !== 'undefined';

// ✅ Correct - Use client component
"use client"
export function ClientOnly() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  return <div>{/* browser-dependent content */}</div>;
}
```

### Theme colors not working

**Solution**: Always check `src/app/globals.css` for available tokens. Use semantic names, not hardcoded colors.

### Form not submitting

**Check**: Is the server action marked with `"use server"`?
**Check**: Are you returning the right shape from the action?
**Check**: Is error handling in place?
