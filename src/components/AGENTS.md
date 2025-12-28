# Component Architecture & Storybook Guidelines

## Overview

This directory contains all reusable UI components for the Tetrastack application, organized using **Atomic Design principles**. Storybook is a first-class citizen for component development, design iteration, and testing.

## Philosophy

Components are the building blocks of the UI. They should be:

- **Isolated**: Work independently without tight coupling to app-specific logic
- **Reusable**: Designed to be used across multiple features
- **Testable**: Each component has Storybook stories for visual testing
- **Documented**: Stories serve as living documentation
- **Accessible**: Follow WCAG accessibility guidelines

## Atomic Design Hierarchy

We follow the Atomic Design methodology to organize components by complexity:

### Atoms (Design System Primitives)

**Location**: `src/components/ui/`

The smallest, most fundamental UI elements. These are the building blocks that cannot be broken down further.

**Characteristics**:

- Single responsibility
- Highly reusable
- Minimal business logic
- Exhaustive Storybook coverage

**Examples**:

- `button.tsx` - Button component with variants
- `input.tsx` - Input fields
- `label.tsx` - Form labels
- `avatar.tsx` - User avatar display
- `card.tsx` - Basic card container

**Story Requirements**:

- **Exhaustive** - Cover all variants, states, sizes, and edge cases
- Focus on visual appearance and interaction states
- Include accessibility tests

```tsx
// Example: src/components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Button' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Button' },
};

// ... more variants
```

### Molecules (Shared Feature Components)

**Location**: `src/components/navigation/`, `src/components/[feature-domain]/`

Combinations of atoms that form simple, functional units.

**Characteristics**:

- Combine multiple atoms
- Represent common UI patterns
- Shared across features
- Self-contained functionality

**Examples**:

- `navigation/MainNav.tsx` - Main navigation bar
- `TeamSelector.tsx` - Team selection dropdown
- `ProjectFilters.tsx` - Filter controls for projects
- `StatusBadge.tsx` - Status indicator badge

**Story Requirements**:

- Show common usage patterns
- Demonstrate interaction between atoms
- Include different content scenarios

```tsx
// Example: src/components/navigation/MainNav.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MainNav } from './MainNav';

const meta: Meta<typeof MainNav> = {
  title: 'Navigation/MainNav',
  component: MainNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MainNav>;

export const Default: Story = {
  args: {
    currentUser: { name: 'John Doe', avatar: '/avatar.png' },
    currentTeam: { id: '1', name: 'Acme Corp' },
  },
};

export const NoTeam: Story = {
  args: {
    currentUser: { name: 'John Doe', avatar: '/avatar.png' },
  },
};
```

### Organisms (Route-Specific Components)

**Location**: `src/app/[route]/_components/`

Complex components that form distinct sections of the interface. These are route-specific and may include business logic.

**Characteristics**:

- Specific to a particular route/feature
- May contain business logic
- Combine molecules and atoms
- Prefixed with `_components/` to indicate private to route

**Examples**:

- `app/dashboard/_components/UserStats.tsx` - Dashboard statistics widget
- `app/projects/_components/ProjectBoard.tsx` - Project kanban board
- `app/tasks/_components/TaskTimeline.tsx` - Task timeline view

**Story Requirements**:

- Show realistic data scenarios
- Mock external dependencies (actions, API calls)
- Focus on visual layout and user flows

```tsx
// Example: src/app/dashboard/_components/UserStats.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { UserStats } from './UserStats';

const meta: Meta<typeof UserStats> = {
  title: 'Dashboard/UserStats',
  component: UserStats,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserStats>;

export const WithData: Story = {
  args: {
    stats: {
      projectsActive: 5,
      tasksCompleted: 23,
      teamMembers: 8,
    },
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
```

### Templates (Page Templates)

**Location**: `src/components/templates/`

Page-level templates that define layout structure without specific content. Used primarily for visual testing of layouts.

**Characteristics**:

- Define page structure
- Content-agnostic
- Used for layout testing
- Can be Server or Client Components

**Examples**:

- `templates/DashboardTemplate.tsx` - Dashboard layout structure
- `templates/ProjectDetailTemplate.tsx` - Project detail page layout

**Story Requirements**:

- Show layout with placeholder content
- Test responsive behavior
- Demonstrate different layout states (empty, filled, error)

```tsx
// Example: src/components/templates/DashboardTemplate.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { DashboardTemplate } from './DashboardTemplate';

const meta: Meta<typeof DashboardTemplate> = {
  title: 'Templates/Dashboard',
  component: DashboardTemplate,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardTemplate>;

export const Default: Story = {
  args: {
    sidebar: <div>Sidebar Content</div>,
    main: <div>Main Content</div>,
    header: <div>Header Content</div>,
  },
};
```

## Component Layer Architecture

### UI Layer (`src/components/ui/`)

This is the **wrapper layer** between the application and design systems. See `src/components/ui/AGENTS.md` for detailed documentation.

**Key Principles**:

- ✅ **ALWAYS** import UI components from `@/components/ui/`
- ❌ **NEVER** import directly from `@tetrastack/react-glass` or design system packages
- This layer provides stability and allows design system migration without breaking app code

```tsx
// ❌ BAD: Direct import from design system
import { GlassButton } from '@tetrastack/react-glass';

// ✅ GOOD: Import through wrapper layer
import { Button } from '@/components/ui/button';
```

### Glass Components Design System (`@tetrastack/react-glass`)

The glass morphism design system lives in a separate package: `packages/@tetrastack/react-glass/`

**Package Structure**:

```
packages/@tetrastack/react-glass/
├── .storybook/              # Package-specific Storybook config
├── AGENTS.md                # Design system documentation
├── src/
│   └── lib/
│       └── glass-components/
│           ├── GlassButton.tsx
│           ├── GlassButton.stories.tsx
│           ├── GlassCard.tsx
│           ├── GlassCard.stories.tsx
│           ├── GlassInput.tsx
│           ├── GlassInput.stories.tsx
│           └── [other components]
└── index.ts                 # Package exports
```

**Integration with Root Storybook**:

- Root `.storybook/main.ts` imports stories from the package
- Glass component stories appear in Storybook under their own category
- UI wrapper components reference glass components

## Storybook Configuration

### Root Storybook (`.storybook/`)

Configured to discover stories from:

1. Application components: `src/**/*.stories.@(js|jsx|mjs|ts|tsx)`
2. Glass package: Imported via package references

**Run Storybook**: `npm run storybook` (port 6006)

**Addons**:

- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-docs` - Auto-generated documentation
- `@storybook/addon-vitest` - Component testing with Vitest
- `@chromatic-com/storybook` - Visual regression testing

### Component Testing in Storybook

Stories can be used as test cases with Vitest:

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/vitest';
import { within, userEvent } from '@storybook/testing-library';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Clickable: Story = {
  args: {
    children: 'Click me',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
```

Run component tests: `npm run test:components`

## Creating New Components

### Step 1: Determine Component Level

Ask yourself:

- Is it a single, fundamental element? → **Atom** (`src/components/ui/`)
- Does it combine atoms for a reusable pattern? → **Molecule** (`src/components/[domain]/`)
- Is it specific to one route/feature? → **Organism** (`src/app/[route]/_components/`)
- Is it a layout template? → **Template** (`src/components/templates/`)

### Step 2: Create Component File

```tsx
// src/components/ui/badge.tsx
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary',
        secondary: 'bg-secondary text-on-secondary',
        success: 'bg-success text-on-success',
        error: 'bg-error text-on-error',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
```

### Step 3: Create Storybook Story

```tsx
// src/components/ui/badge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'success', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Badge',
    variant: 'secondary',
  },
};

export const Success: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const Error: Story = {
  args: {
    children: 'Error',
    variant: 'error',
  },
};
```

### Step 4: Export from Index (if creating a new subdirectory)

If creating a new molecule category:

```tsx
// src/components/navigation/index.ts
export { MainNav } from './MainNav';
export { SubNav } from './SubNav';
```

## Styling Guidelines

### Theme System

**CRITICAL**: Always consult `src/app/globals.css` before writing styles.

The app uses a semantic token-based theme system:

```css
/* globals.css defines tokens like: */
--color-primary: ...;
--color-on-primary: ...;
--color-surface: ...;
--color-on-surface: ...;
```

### Tailwind Usage

Use Tailwind utility classes with theme tokens:

```tsx
// ✅ GOOD: Using theme tokens
<div className="bg-surface text-on-surface">Content</div>

// ❌ BAD: Hardcoded colors
<div className="bg-gray-100 text-gray-900">Content</div>
```

### Component Variants

Use `class-variance-authority` for variants:

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      primary: 'bg-primary text-on-primary',
      secondary: 'bg-secondary text-on-secondary',
    },
    size: {
      sm: 'px-3 py-1.5 text-sm',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'lg',
  },
});
```

## Best Practices

### DO:

✅ **Co-locate stories** with components (same directory)
✅ **Use TypeScript** for all components and stories
✅ **Follow Atomic Design** hierarchy strictly
✅ **Import from `@/components/ui/`** for primitives
✅ **Test in Storybook** before integrating into pages
✅ **Document with JSDoc** for complex props
✅ **Use semantic HTML** and ARIA attributes
✅ **Keep components pure** - avoid side effects in render
✅ **Prefer composition** over prop drilling

### DON'T:

❌ **Don't import directly** from design system packages
❌ **Don't mix business logic** with presentation in atoms/molecules
❌ **Don't create one-off components** - make them reusable
❌ **Don't skip Storybook stories** - they're documentation
❌ **Don't use hardcoded colors** - use theme tokens
❌ **Don't make components too large** - break them down
❌ **Don't forget accessibility** - test with addon-a11y
❌ **Don't duplicate components** - reuse existing ones

## Component Development Workflow

1. **Design in Storybook**
   - Create component and story files
   - Iterate on design and variants in isolation
   - Test accessibility with addon-a11y

2. **Test Interactions**
   - Add interaction tests using `play` functions
   - Run `npm run test:components`

3. **Integrate into Pages**
   - Import component in route pages
   - Pass real data/props
   - Test in browser

4. **Document**
   - Add JSDoc comments for complex props
   - Update this AGENTS.md if adding new patterns
   - Keep stories as living documentation

## File Naming Conventions

- **Components**: PascalCase - `Button.tsx`, `MainNav.tsx`
- **Stories**: Match component name - `Button.stories.tsx`
- **Utilities**: camelCase - `utils.ts`, `cn.ts`
- **Types**: PascalCase suffix - `ButtonProps`, `NavItem`

## Example Component Hierarchy

```
ProjectCard (Molecule - src/components/ProjectCard.tsx)
├── Card (Atom - src/components/ui/card.tsx)
│   ├── CardHeader
│   ├── CardTitle
│   └── CardContent
├── StatusBadge (Molecule - src/components/StatusBadge.tsx)
│   └── Badge (Atom - src/components/ui/badge.tsx)
└── Button (Atom - src/components/ui/button.tsx)
```

## Server Components vs Client Components

### Server Components (Default)

Most components should be Server Components:

```tsx
// No "use client" directive needed
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

**When to use**:

- Static display components
- Data fetching components
- Components without interactivity

### Client Components

Add `"use client"` directive when needed:

```tsx
'use client';

import { useState } from 'react';

export function InteractiveButton() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
  );
}
```

**When to use**:

- Components with `useState`, `useEffect`, etc.
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring client-side JS

**In Storybook**:

- All stories run in client context
- Both Server and Client Components work in Storybook
- For Server Components, Storybook renders them in client mode

## Testing Strategy

Components have three levels of testing:

1. **Storybook Stories** (Visual Testing)
   - All variants and states
   - Visual regression with Chromatic
   - Accessibility testing

2. **Component Tests** (Interaction Testing)
   - `npm run test:components`
   - Uses Storybook stories as test cases
   - Tests user interactions

3. **E2E Tests** (Integration Testing)
   - `npm run test:e2e`
   - Tests components in real application context
   - Uses Playwright

## Migration Path

If migrating existing components:

1. Move to appropriate Atomic Design level
2. Create Storybook story
3. Ensure imports use `@/components/ui/` for primitives
4. Update theme to use semantic tokens
5. Test in Storybook before integration

## Questions & Help

- **Where should my component live?** - Use the Atomic Design hierarchy guide above
- **How do I style components?** - Check `src/app/globals.css` first, use Tailwind with theme tokens
- **Why wrap glass components?** - See `src/components/ui/AGENTS.md` for the wrapper layer pattern
- **Can I use external UI libraries?** - Yes, but wrap them in `src/components/ui/` first
- **How do I test interactions?** - Use Storybook's `play` functions and interaction testing

---

**Remember**: Components are the foundation of the UI. Invest time in making them reusable, well-tested, and documented through Storybook. Future you (and your team) will thank you!
