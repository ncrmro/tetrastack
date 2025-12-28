# Testing

Tetrastack uses a multi-tier testing strategy with Vitest for unit, integration, and component tests, and Playwright for end-to-end browser testing.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Vitest Configuration](#vitest-configuration)
4. [Workspace Packages](#workspace-packages)
5. [Test Environments](#test-environments)
6. [Database Testing](#database-testing)
7. [Coverage](#coverage)
8. [Writing Tests](#writing-tests)

---

## Test Structure

```
tests/
├── unit/           # Pure function and utility tests (fast, isolated)
├── integration/    # Database and service layer tests
├── components/     # React component tests (happy-dom environment)
├── agents/         # AI agent integration tests (requires OPENAI_API_KEY)
├── factories/      # Test data generators (fishery + faker)
└── e2e/            # Playwright browser tests
```

**Naming Conventions:**

- Vitest: `*.test.ts` or `*.test.tsx`
- Playwright: `*.spec.ts`

---

## Running Tests

```bash
# All tests
npm run test

# Individual test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:components     # Component tests (happy-dom)
npm run test:e2e            # Playwright E2E tests
npm run test:e2e:ui         # Playwright with interactive UI
npm run test:e2e:headed     # Playwright in headed browser mode

# AI agent tests (requires OPENAI_API_KEY)
npm run test:agents

# Coverage report
npm run coverage
```

---

## Vitest Configuration

### Main Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    environmentMatchGlobs: [
      ['tests/components/**/*.test.{ts,tsx}', 'happy-dom'],
    ],
    include: [
      'tests/unit/**/*.test.{js,ts,tsx}',
      'tests/integration/**/*.test.{js,ts,tsx}',
      'tests/components/**/*.test.{ts,tsx}',
      'tests/agents/**/*.test.{js,ts,tsx}',
    ],
    globalSetup: ['./vitest.setup.ts'],
    setupFiles: ['./vitest.test-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: ':memory:',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Component Test Configuration (`vitest.config.components.ts`)

Dedicated config for component tests using `happy-dom` environment:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    include: ['tests/components/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.test-setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## Workspace Packages

When tests import workspace packages (e.g., `@tetrastack/backend`), vitest must resolve these imports through aliases.

### Adding Package Aliases

In `vitest.config.ts`, add aliases for each workspace package:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // ... other config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Workspace package aliases for vitest
      '@tetrastack/backend': path.resolve(
        __dirname,
        './packages/@tetrastack/backend/src/index.ts',
      ),
      '@tetrastack/backend/utils': path.resolve(
        __dirname,
        './packages/@tetrastack/backend/src/utils/index.ts',
      ),
      '@tetrastack/backend/auth': path.resolve(
        __dirname,
        './packages/@tetrastack/backend/src/auth/index.ts',
      ),
      '@tetrastack/backend/database': path.resolve(
        __dirname,
        './packages/@tetrastack/backend/src/database/index.ts',
      ),
      '@tetrastack/react-glass': path.resolve(
        __dirname,
        './packages/@tetrastack/react-glass/index.ts',
      ),
      '@tetrastack/react-glass-graphs': path.resolve(
        __dirname,
        './packages/@tetrastack/react-glass-graphs/index.ts',
      ),
    },
  },
});
```

### Why Aliases Are Needed

TypeScript path mappings in `tsconfig.json` are only used for type checking. At runtime, tools like Vitest use their own module resolution. The vitest `resolve.alias` configuration ensures:

1. **Direct source resolution** - Tests import TypeScript source directly, no build step required
2. **Hot reload** - Changes to packages reflect immediately in tests
3. **Consistent behavior** - Same resolution as Next.js transpilePackages

### Package-Specific Tests

Workspace packages can have their own vitest configuration for isolated testing:

```typescript
// packages/@tetrastack/react-glass/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

Run package tests:

```bash
cd packages/@tetrastack/react-glass
npm test
```

See [packages.md](./packages.md) for more on workspace package structure.

---

## Test Environments

| Test Type   | Environment          | Use Case                                    |
| ----------- | -------------------- | ------------------------------------------- |
| Unit        | `node`               | Pure functions, utilities, business logic   |
| Integration | `node`               | Database operations, API handlers, services |
| Components  | `happy-dom`          | React components, hooks, DOM interactions   |
| E2E         | Browser (Playwright) | Full user workflows, real browser           |

### Environment Selection

The `environmentMatchGlobs` configuration auto-selects environments:

```typescript
environmentMatchGlobs: [
  ['tests/components/**/*.test.{ts,tsx}', 'happy-dom'],
  // All other tests use 'node' (default)
];
```

---

## Database Testing

Integration tests use in-memory SQLite for speed and isolation:

```typescript
env: {
  DATABASE_URL: ':memory:',
}
```

### Setup Flow

1. **globalSetup** (`vitest.setup.ts`) - Runs once before all tests
2. **setupFiles** (`vitest.test-setup.ts`) - Runs before each test file
   - Initializes database connection
   - Runs migrations
   - Seeds initial data if needed

### Test Isolation

Each test file gets a fresh database state. Use factories for test data:

```typescript
import { projectFactory, userFactory } from '../factories';

describe('Project operations', () => {
  it('creates a project', async () => {
    const user = await userFactory.create();
    const project = await projectFactory.create({ userId: user.id });
    // ...
  });
});
```

---

## Coverage

Coverage is configured with V8 provider:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
  reportOnFailure: true,
  include: ['src/**/*.{js,ts,tsx}'],
  thresholds: {
    lines: 15,
    functions: 50,
    branches: 70,
    statements: 15,
  },
}
```

### Reports

- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - For CI/codecov integration
- `coverage/coverage-summary.json` - JSON summary

### Running Coverage

```bash
npm run coverage
```

---

## Writing Tests

### Unit Test Example

```typescript
// tests/unit/slugify.test.ts
import { describe, it, expect } from 'vitest';
import { slugify } from '@/utils/slugify';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('handles special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });
});
```

### Integration Test Example

```typescript
// tests/integration/projects.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/database';
import { projectFactory, userFactory } from '../factories';

describe('Project database operations', () => {
  beforeEach(async () => {
    // Database is reset between test files automatically
  });

  it('creates and retrieves a project', async () => {
    const user = await userFactory.create();
    const project = await projectFactory.create({
      userId: user.id,
      name: 'Test Project',
    });

    const found = await db.query.projects.findFirst({
      where: eq(projects.id, project.id),
    });

    expect(found?.name).toBe('Test Project');
  });
});
```

### Component Test Example

```typescript
// tests/components/GlassButton.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlassButton } from '@tetrastack/react-glass/GlassButton';

describe('GlassButton', () => {
  it('renders with text', () => {
    render(<GlassButton>Click me</GlassButton>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<GlassButton onClick={onClick}>Click</GlassButton>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Test Factories

Use fishery with faker for realistic test data:

```typescript
// tests/factories/project.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { db } from '@/database';
import { projects } from '@/database/schema';

export const projectFactory = Factory.define<Project>(({ onCreate }) => {
  onCreate(async (project) => {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  });

  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
});
```
