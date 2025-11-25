# Testing Architecture

This project uses a three-tier testing approach to ensure code quality and reliability across all levels of the application.

## Directory Structure

```
tests/
├── unit/           # Unit tests (Vitest)
├── integration/    # Integration tests (Vitest)
│   └── README.md   # Integration testing guidelines, database setup, and fixtures
├── components/     # Component tests (Vitest + React Testing Library)
├── e2e/            # End-to-end tests (Playwright)
│   └── README.md   # E2E testing guidelines and fixtures
├── agents/         # Agent integration tests (OpenAI)
└── factories/      # Test data factories (fishery + faker)
    └── README.md   # Factory pattern documentation
```

## Test Types

### Unit Tests (`tests/unit/`)

- **Purpose**: Test individual functions, utilities, and pure logic
- **Framework**: Vitest
- **Run**: `npm run test:unit`
- **Examples**:
  - Pure functions like unit conversion utilities
  - Helper functions and calculations
  - Business logic and calculations

### Component Tests (`tests/components/`)

- **Purpose**: Test React component behavior, rendering, and user interactions
- **Framework**: Vitest + React Testing Library + happy-dom
- **Run**: `npm run test:components`
- **Examples**:
  - Component rendering and conditional rendering
  - User interactions (clicks, typing, form submissions)
  - Component state changes
  - Props validation and callbacks
  - Accessibility testing
- **When to use**:
  - Testing component UI logic and interactions
  - Testing components in isolation with mocked dependencies
  - Faster alternative to E2E tests for component-specific behavior
  - Component-level accessibility testing

### Integration Tests (`tests/integration/`)

- **Purpose**: Test interactions between components, actions, and data layers
- **Framework**: Vitest with database
- **Run**: `npm run test:integration`
- **Guidelines**: See `tests/integration/README.md` for database setup, seeded fixtures, and factory usage
- **Examples**:
  - Server actions with database operations
  - Component + data transformation workflows
  - Form validation with business logic
  - Model layer functions with database persistence

### End-to-End Tests (`tests/e2e/`)

- **Purpose**: Test complete user workflows through the browser
- **Framework**: Playwright
- **Run**: `npm run test:e2e` or `npm run test:e2e:ui`
- **Guidelines**: See `tests/e2e/README.md` for detailed guidelines, fixtures, and page object patterns
- **Examples**:
  - User authentication flows
  - CRUD operations through the UI
  - Navigation and page interactions
  - Form submissions and validations

### Agent Tests (`tests/agents/`)

- **Purpose**: Test AI agent integrations
- **Framework**: Vitest with OpenAI API
- **Run**: `npm run test:agents` (requires `OPENAI_API_KEY`)
- **Examples**:
  - Recipe generation agents
  - Food generation agents
  - Meal generation agents

## Running Tests

### All Tests

```bash
npm test                 # Run all test types sequentially
make ci                  # Run linting + all tests (CI pipeline)
```

### Individual Test Types

```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:components  # Component tests only
npm run test:e2e         # E2E tests only
npm run test:e2e:ui      # E2E tests with Playwright UI
```

## Configuration Files

- `vitest.config.ts` - Vitest configuration for unit and integration tests
- `vitest.config.components.ts` - Vitest configuration for component tests (uses happy-dom)
- `playwright.config.ts` - Playwright configuration for E2E tests
- `tests/e2e/global-setup.ts` - Global setup for E2E tests

## Writing Tests

### Test Data Factories

**IMPORTANT**: Use test data factories instead of manual object construction for cleaner, more maintainable tests.

See `tests/factories/README.md` for comprehensive documentation.

**Key Principle: Minimize Custom Parameters**

Always use factories with **as few custom parameters as possible**:

- ✅ **Preferred**: `await foodFactory.create()` - Uses sensible defaults
- ✅ **Preferred**: `await foodFactory.processed().fat().create()` - Uses traits for variations
- ⚠️ **Use sparingly**: `await foodFactory.create({ name: 'Olive Oil' })` - Only when test requires specific value
- ❌ **Avoid**: Multiple custom parameters - Makes tests brittle and obscures test intent

**Key Principle: Auto-Parent Creation**

Factories automatically create parent entities when not provided. Let factories do the work:

- ✅ **Preferred**: `await projectFactory.create()` - Auto-creates team
- ✅ **Preferred**: `await taskFactory.create()` - Auto-creates project and team
- ⚠️ **Only when needed**: Explicitly create parents when multiple children share the same parent or when testing parent-specific behavior
- ❌ **Avoid**: Creating parents unnecessarily - `const team = await teamFactory.create(); const project = await projectFactory.create({ teamId: team.id });`

Benefits:

- **87% less test code**: Meals test reduced from 165 lines to 20 lines
- **Less boilerplate**: No need to create team for every project test
- **Realistic data**: Faker generates realistic names, emails, dates
- **Type-safe**: Full TypeScript inference
- **Reusable**: Define once, use everywhere
- **Flexible**: Override any field, chain traits for variations
- **Maintainable**: When factory defaults improve, all tests improve automatically

### Unit Tests

```typescript
// tests/unit/my-function.test.ts
import { myFunction } from '../../src/lib/my-function';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });
});
```

### Component Tests

```typescript
// tests/components/MyComponent.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    mockCallback.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders with correct text', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent onSubmit={mockCallback} />);

    const button = screen.getByRole('button', { name: /submit/i });
    await user.click(button);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });
});
```

**Important notes for component tests:**

- Always import `React` when using JSX in test files
- Use `cleanup()` in `afterEach` to reset the DOM between tests
- Use `userEvent.setup()` for realistic user interactions
- Use `waitFor()` for async assertions
- Mock server actions and external dependencies with `vi.fn()`

### Integration Tests

```typescript
// tests/integration/my-feature.test.ts
import { myAction } from '../../src/actions/my-action';
import { projectFactory, taskFactory } from '../factories';

describe('My Feature Integration', () => {
  it('should integrate components correctly', async () => {
    // ✅ PREFERRED: Use factories with defaults, auto-creates parents
    const project = await projectFactory.create(); // Auto-creates team
    const task = await taskFactory.create(); // Auto-creates project and team

    // Test interactions between layers
    const result = await myAction(task);
    expect(result.success).toBe(true);
  });

  it('should handle multiple items sharing parent', async () => {
    // ✅ VALID: Create parent when multiple children need same parent
    const project = await projectFactory.create();
    const task1 = await taskFactory.create({ projectId: project.id });
    const task2 = await taskFactory.create({ projectId: project.id });

    expect(task1.projectId).toBe(task2.projectId);
  });

  it('should handle specific test case', async () => {
    // ⚠️ USE SPARINGLY: Custom param only when test logic requires it
    const urgentTask = await taskFactory.create({ title: 'Urgent Task' });

    const result = await myAction(urgentTask);
    expect(result.task.title).toBe('Urgent Task');
  });
});
```

**Important notes for integration tests:**

- **Database is pre-seeded**: Fixture data (foods, recipes, meals) is available from `vitest.setup.ts`
- **Use factories with minimal custom parameters**: Rely on defaults and traits whenever possible
- **Automatic cleanup**: Factory-generated data is cleaned up in teardown (see `vitest.setup.ts`)
- **Leverage fixtures**: Reference existing seeded data when possible instead of creating duplicates

See `tests/integration/README.md` for comprehensive integration testing guidelines.

### E2E Tests

```typescript
// tests/e2e/my-workflow.spec.ts
import { test, expect } from './fixtures/base-fixtures';

test('complete user workflow', async ({ onboardedUser }) => {
  const { page } = onboardedUser;
  await page.goto('/meal-plan');
  // Test user interactions
});
```

See `tests/e2e/README.md` for comprehensive E2E testing patterns, fixtures, and page object models.

## Best Practices

1. **Use Factories with Minimal Custom Parameters**: Always use test data factories, relying on defaults and traits (see `tests/factories/README.md`)
   - ✅ Preferred: `foodFactory.create()` or `foodFactory.processed().create()`
   - ⚠️ Use sparingly: `foodFactory.create({ name: 'Specific Value' })`
   - ❌ Avoid: Multiple custom parameters that override defaults
2. **Let Factories Auto-Create Parents**: Factories automatically create parent entities (team → project → task)
   - ✅ Preferred: `projectFactory.create()` (auto-creates team)
   - ✅ Preferred: `taskFactory.create()` (auto-creates project and team)
   - ⚠️ Only when needed: Create parents explicitly when multiple children share the same parent
   - ❌ Avoid: `const team = await teamFactory.create(); const project = await projectFactory.create({ teamId: team.id });`
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Use mocks for external dependencies in unit and integration tests
5. **Descriptive**: Use clear, descriptive test names and descriptions
6. **Coverage**: Aim for high coverage but focus on critical paths
7. **Speed**: Keep unit tests fast, integration tests moderate, E2E tests comprehensive
8. **Data Cleanup**: Use test-specific data and clean up after tests (factories help with this)
