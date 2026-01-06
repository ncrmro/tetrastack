# Development Workflow

This document outlines the expected development loop for both human developers and AI agents working on Tetrastack projects.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Starting Development](#starting-development)
3. [UI Development Workflow](#ui-development-workflow)
4. [Agent Visual Inspection](#agent-visual-inspection)
5. [Automated Quality Checks](#automated-quality-checks)
6. [Spec-Driven Development](#spec-driven-development)
7. [E2E Testing](#e2e-testing)

---

## Prerequisites

Before beginning any development work:

1. Clone the repository and install dependencies
2. Copy `.env.example` to `.env` if not already present
3. Have Docker/Podman available for container-based development

---

## Starting Development

**Always start with `make up` before any other development work.**

```bash
make up
```

This command:

- Starts the LibSQL database server
- Runs database migrations
- Starts the Next.js development server
- Displays the server URL (default: http://localhost:3000)

The development environment must be running before:

- Writing or modifying code
- Running tests
- Accessing the application

To stop the environment:

```bash
make down
```

---

## UI Development Workflow

### Presentational Stories First

When developing UI components, **always write Storybook stories before integrating into the application**.

#### The Pattern

1. **Create the presentation component** - Pure, stateless component with props
2. **Write stories for all variants** - Cover different states, sizes, and edge cases
3. **Visually verify in Storybook** - Use the Storybook UI to inspect rendering
4. **Write component tests** - Use stories as the basis for tests
5. **Integrate into application** - Connect to data and routing

#### Example Workflow

```bash
# 1. Start Storybook
cd packages/@tetrastack/react-glass
npm run storybook
```

```tsx
// 2. Create component with stories side-by-side
// GlassButton.tsx
export function GlassButton({ variant, children, onClick }: GlassButtonProps) {
  return <button className={cn(styles[variant])}>{children}</button>;
}

// GlassButton.stories.tsx
export const Primary: Story = {
  args: { variant: 'primary', children: 'Click Me' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Click Me' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Disabled' },
};
```

See [storybook.md](./storybook.md) for complete Storybook documentation.

---

## Agent Visual Inspection

AI agents should use **Playwright MCP** for visual inspection of UI components during development.

### When to Use Visual Inspection

- After creating or modifying Storybook stories
- When debugging visual regressions
- Before marking UI tasks as complete
- When verifying responsive behavior

### How Agents Should Inspect

1. Ensure Storybook is running (`npm run storybook`)
2. Use Playwright MCP to navigate to the story URL
3. Take screenshots of component states
4. Verify against design requirements

### Story URLs

Storybook stories are accessible at predictable URLs:

```
http://localhost:6006/?path=/story/{category}-{component}--{story-name}
```

Example:

```
http://localhost:6006/?path=/story/glass-components-glassbutton--primary
```

---

## Automated Quality Checks

### Stop Hook Automation

Agents should be aware that **lint, type checking, and unit tests are automatically run on a Stop hook**.

When development work pauses or completes:

- ESLint checks are executed
- TypeScript type checking runs
- Unit tests for modified files execute
- Failures are surfaced to the agent for correction

See [claude-hooks.md](../conventions/claude-hooks.md) for hook configuration details.

### Manual Quality Checks

Run checks manually when needed:

```bash
# Linting and formatting
make lint
make format

# Type checking
npm run typecheck

# Unit tests
make test-unit

# All tests
make test-all
```

---

## Spec-Driven Development

### Reviewing Specs

Before implementing features:

1. **Locate relevant specs** in the `specs/` directory
2. **Review existing requirements** and acceptance criteria
3. **Identify tasks** that need completion
4. **Understand user stories** for context

### Updating Specs

As development progresses:

1. **Add new requirements** when functional gaps are discovered
2. **Mark tasks complete** as implementation finishes
3. **Update acceptance criteria** if scope changes
4. **Document edge cases** encountered during development

### Spec Task Format

```markdown
## Tasks

- [x] Implement basic component structure
- [x] Add variant styles
- [ ] Add keyboard navigation
- [ ] Write accessibility tests
```

Mark tasks with `[x]` when complete, `[ ]` when pending.

---

## E2E Testing

### When to Run E2E Tests

Run E2E tests when changes affect:

- User-facing workflows
- Authentication flows
- Form submissions
- Navigation patterns
- Data persistence

### Focus on Happy Path

E2E tests should be **focused on user stories from specs**:

- Test the primary success path
- Cover critical user journeys
- Avoid testing edge cases in E2E (use unit/integration tests)
- Keep tests fast and reliable

### Running E2E Tests

```bash
# Headless (CI mode)
make e2e

# With interactive UI
npm run test:e2e:ui

# Headed browser mode
npm run test:e2e:headed
```

### Writing E2E Tests

E2E tests live in `tests/e2e/` and use Playwright:

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password-123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

See [testing.md](./testing.md) for complete testing documentation.

---

## Development Loop Summary

### For Humans

1. `make up` - Start environment
2. Create/modify stories in Storybook
3. Implement component logic
4. Run tests locally
5. Update specs as needed
6. `make down` - Stop environment

### For Agents

1. `make up` - Start environment (verify running)
2. Review relevant specs for context
3. Write presentational stories first
4. Use Playwright MCP for visual inspection
5. Implement logic, let Stop hooks catch issues
6. Update spec tasks as work completes
7. Run E2E tests for user story validation
