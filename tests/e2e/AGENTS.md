# E2E Testing with Playwright

## Overview

End-to-end tests verify complete user workflows using Playwright. Tests are organized using the **Page Object Model** pattern with reusable **fixtures** for authentication and onboarding.

## Core Principles

### 1. **Never use `networkidle`**

Use specific element visibility checks instead:

```typescript
// ❌ BAD - Don't use networkidle
await page.waitForLoadState('networkidle');

// ✅ GOOD - Wait for specific elements
await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
```

### 2. **No Branching Logic**

**CRITICAL**: Never add conditional logic (if/else, switch, ternary) in:

- Test files (`*.spec.ts`)
- Fixtures (`fixtures/*.ts`)
- Page objects (`page-objects/*.ts`)

```typescript
// ❌ BAD - No branching logic
if (isMobile) {
  await page.click('.mobile-menu');
} else {
  await page.click('.desktop-menu');
}

// ✅ GOOD - Handle both cases in page object
await basePage.navigateToMealPlan(); // Handles mobile/desktop internally
```

**Real-world anti-pattern to NEVER use:**

```typescript
// ❌ TERRIBLE - NEVER DO THIS - Conditional navigation logic in tests
await test.step('Navigate to meal plan nutrition page', async () => {
  const nutritionLink = page.getByRole('link', { name: /nutrition/i }).first();

  if (await nutritionLink.isVisible()) {
    await nutritionLink.click();
    await page.waitForLoadState('networkidle');
  } else {
    // Fallback: navigate directly
    await page.goto('/meal-plan');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    await page.goto('/meal-plans/1');
    await page.waitForLoadState('networkidle');
  }
});

// ✅ GOOD - Deterministic navigation in page object
await mealPlanPage.gotoNutritionPage(planId);
```

**Why this is bad:**

- Creates non-deterministic tests (different paths on each run)
- Hides bugs (code works in one path but not the other)
- Makes tests flaky and hard to debug
- Violates the E2E principle of testing what users actually do

**The fix:**

- Tests should be deterministic - same path every time
- Put any conditional logic in page objects if absolutely necessary
- Better yet: eliminate conditions by ensuring test state is predictable

### 3. **Use Page Object Models**

All navigation and interaction should go through page objects in `page-objects/`:

- `BasePage.ts`: Common navigation (navbar, account dropdown, sign out)
- `SignInPage.ts`: Authentication flows
- `OnboardingPage.ts`: Onboarding workflow
- `RecipePage.ts`: Recipe interactions
- `MealPlanPage.ts`: Meal plan operations
- And more...

### 4. **Use Base Fixtures**

Import from `./fixtures/base-fixtures` for pre-configured user contexts:

```typescript
import { test, expect } from './fixtures/base-fixtures';

test('my test', async ({ onboardedUser }) => {
  const { page } = onboardedUser;
  // User is already authenticated and onboarded
  await page.goto('/meal-plan');
});
```

## Available Fixtures

### Authentication States

- **`onboardedUser`**: Regular user with completed onboarding (cookie-based, fast)
- **`onboardedAdmin`**: Admin user with completed onboarding (cookie-based, fast)
- **`authenticatedUser`**: Regular user, authentication only (no onboarding)
- **`authenticatedAdmin`**: Admin user, authentication only (no onboarding)
- **`unauthenticatedUser`**: Clean slate for testing auth flows

### Test Data

- **`baseTestData`**: Test data for regular user
- **`baseAdminTestData`**: Test data for admin user

### Example Usage

```typescript
import { test, expect } from './fixtures/base-fixtures';
import { MealPlanPage } from './page-objects/MealPlanPage';

test('create meal plan', async ({ onboardedUser }) => {
  const { page } = onboardedUser;
  const mealPlanPage = new MealPlanPage(page);

  await mealPlanPage.goto();
  await mealPlanPage.createMealPlan('Weekly Plan');
  await expect(page.getByText('Weekly Plan')).toBeVisible();
});
```

## Page Object Pattern

### Structure

All page objects should extend or follow the `BasePage` pattern:

```typescript
import { Page, Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly someElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someElement = page.getByRole('button', { name: 'Click Me' });
  }

  async performAction() {
    await this.someElement.click();
  }
}
```

### Locators vs Assertions

**CRITICAL**: Page objects should expose locators, NOT contain assertions.

#### ❌ BAD - Assertions in page objects

```typescript
export class MyPage {
  private readonly heading = this.page.locator('h1');

  // DON'T create verify methods with assertions
  async verifyHeading(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.heading).toContainText('Welcome');
  }
}

// Test file
test('my test', async ({ page }) => {
  const myPage = new MyPage(page);
  await myPage.verifyHeading(); // ❌ Hidden assertion - ESLint warning
});
```

**Problems:**

- Hides assertions from ESLint's `playwright/expect-expect` rule
- Reduces test readability - can't see what's being asserted
- Makes tests harder to debug - assertions buried in page objects
- Violates single responsibility - page objects should model the page, not validate it

#### ✅ GOOD - Locators exposed, assertions in tests

```typescript
export class MyPage {
  // Expose locators as public readonly properties
  readonly heading = this.page.locator('h1');
  readonly submitButton = this.page.getByRole('button', { name: 'Submit' });

  // Action methods are fine
  async fillForm(data: FormData) {
    await this.nameInput.fill(data.name);
    await this.submitButton.click();
  }

  // Helper methods to build dynamic locators are fine
  getItemLocator(itemName: string) {
    return this.page.getByRole('listitem', { name: itemName });
  }
}

// Test file
test('my test', async ({ page }) => {
  const myPage = new MyPage(page);

  // Assertions visible in test file ✅
  await expect(myPage.heading).toBeVisible();
  await expect(myPage.heading).toContainText('Welcome');

  // Using helper method for dynamic locator
  await expect(myPage.getItemLocator('Item 1')).toBeVisible();
});
```

**Benefits:**

- ESLint can verify tests have assertions
- Test intent is clear and readable
- Easy to debug - can see exactly what's being checked
- Page objects stay focused on modeling the page structure

### Common Patterns

- **Navigation**: Use `BasePage` methods (`navigateToMealPlan()`, `navigateToAccount()`)
- **Forms**: Define locators for inputs and submit buttons
- **Assertions**: Keep assertions in test files, not page objects
- **Mobile/Desktop**: Handle both in page object methods (no branching in tests)
- **Dynamic Locators**: Use helper methods that return locators (not assertions)

## Fixtures

### Base Fixtures (`fixtures/base-fixtures.ts`)

Provides fast cookie-based authentication and onboarding:

- Creates test users with deterministic credentials
- Sets authentication cookies (faster than UI login)
- Completes onboarding in database (faster than UI workflow)
- Cleans up contexts automatically after tests

### Domain-Specific Fixtures

- **`household-fixtures.ts`**: Household setup and invitation flows
- **`meal-plan-fixtures.ts`**: Meal plan creation with meals
- **`recipe-fixtures.ts`**: Recipe creation with ingredients

### Creating Custom Fixtures

```typescript
import { test as base } from './base-fixtures';

export const test = base.extend<{ myFixture: MyType }>({
  myFixture: async ({ onboardedUser }, use) => {
    const { page } = onboardedUser;
    // Setup code
    const myData = await setupMyData(page);

    await use(myData);

    // Cleanup code (optional)
  },
});
```

## Running Tests

```bash
npm run test:e2e         # All E2E tests
npm run test:e2e:ui      # With Playwright UI
make ci                  # Full CI pipeline (includes E2E)
```

### Debugging

```bash
npm run test:e2e:ui                    # Interactive UI mode
npx playwright test --debug            # Debug mode
npx playwright test --headed           # Show browser
npx playwright test <file> --headed    # Run specific file
```

## Test Organization

### File Naming

- `<feature>.spec.ts`: Feature-specific tests
- `<feature>-<specific>.spec.ts`: More specific tests

### Test Structure

```typescript
import { test, expect } from './fixtures/base-fixtures';
import { MyPage } from './page-objects/MyPage';

test.describe('Feature Name', () => {
  test('should do something', async ({ onboardedUser }) => {
    const { page } = onboardedUser;
    const myPage = new MyPage(page);

    // Arrange
    await myPage.goto();

    // Act
    await myPage.performAction();

    // Assert
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

## Best Practices

1. **Fast Authentication**: Use fixtures (cookie-based) instead of UI login
2. **Fast Onboarding**: Use database setup instead of UI workflow
3. **Specific Waits**: Wait for specific elements, never `networkidle`
4. **Page Objects**: Encapsulate page interactions and navigation
5. **No Branching**: Handle mobile/desktop in page objects, not tests
6. **Clean Tests**: Keep tests readable and focused on user actions
7. **Locators, Not Assertions**: Page objects expose locators; tests contain assertions
8. **Reusable Fixtures**: Extract common setup into fixtures

## Common Patterns

### Navigation

```typescript
// Use BasePage for common navigation
const basePage = new BasePage(page);
await basePage.navigateToMealPlan(); // Handles mobile/desktop
await basePage.navigateToAccount();
await basePage.signOut();
```

### Form Submission

```typescript
// Define form locators in page object
export class MyFormPage {
  readonly nameInput: Locator;
  readonly submitButton: Locator;

  async fillForm(name: string) {
    await this.nameInput.fill(name);
    await this.submitButton.click();
  }
}
```

### Waiting for Results

```typescript
// Wait for specific elements after actions
await submitButton.click();
await page.getByText('Success').waitFor();
await expect(page.getByText('Success')).toBeVisible();
```

## Troubleshooting

### Tests Timing Out

- Ensure specific element waits instead of `networkidle`
- Check if development server is running
- Verify database migrations are applied

### Authentication Issues

- Check `AUTH_SECRET` environment variable
- Verify cookie domain matches test URL
- Use `authenticatedUser` fixture for debugging

### Flaky Tests

- Add explicit waits for dynamic content
- Use `waitFor()` before assertions
- Avoid time-based waits (use element visibility)

## File Structure

```
tests/e2e/
├── fixtures/
│   ├── base-fixtures.ts         # Authentication & onboarding fixtures
│   ├── household-fixtures.ts    # Household-specific fixtures
│   ├── meal-plan-fixtures.ts    # Meal plan fixtures
│   └── recipe-fixtures.ts       # Recipe fixtures
├── page-objects/
│   ├── BasePage.ts              # Common navigation
│   ├── SignInPage.ts            # Authentication
│   ├── OnboardingPage.ts        # Onboarding workflow
│   ├── RecipePage.ts            # Recipe interactions
│   ├── MealPlanPage.ts          # Meal plan operations
│   └── ...                      # Other page objects
├── helpers.ts                   # Shared helper functions
├── global-setup.ts              # Global test setup
└── *.spec.ts                    # Test files
```
