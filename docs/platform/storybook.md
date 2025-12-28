# Storybook

Storybook is Tetrastack's primary tool for developing, documenting, and testing UI components in isolation. By leveraging presentation components and the `@storybook/react-vite` framework, we enable rapid UI development with instant feedback loops.

## Table of Contents

1. [Why Storybook](#why-storybook)
2. [Framework Choice: Next.js with Vite](#framework-choice-nextjs-with-vite)
3. [Presentation Components Architecture](#presentation-components-architecture)
4. [Getting Started](#getting-started)
5. [Writing Stories](#writing-stories)
6. [Configuration](#configuration)
7. [Testing with Storybook](#testing-with-storybook)
8. [Best Practices](#best-practices)

---

## Why Storybook

Storybook provides several advantages for Tetrastack's component-driven development:

- **Isolation**: Develop components independently from application state and routing
- **Documentation**: Auto-generated docs serve as a living component library
- **Visual Testing**: Catch UI regressions before they reach production
- **Collaboration**: Designers and developers share a common reference point
- **Rapid Iteration**: Hot module replacement enables instant feedback

---

## Framework Choice: Next.js with Vite

Tetrastack uses `@storybook/react-vite` as the Storybook framework. This provides:

### Performance Benefits

- **Faster builds**: Vite's native ESM approach significantly reduces build times
- **Instant HMR**: Changes reflect immediately without full page reloads
- **Optimized bundling**: Only processes what's needed for the current story

### Next.js Integration

The framework provides built-in support for Next.js features:

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Next.js Routing Support

For components using Next.js routing, configure the story parameters:

```typescript
// Using Pages Router (next/router)
export const WithRouter: Story = {
  parameters: {
    nextjs: {
      router: {
        pathname: '/dashboard',
        asPath: '/dashboard?tab=overview',
        query: { tab: 'overview' },
      },
    },
  },
};

// Using App Router (next/navigation)
export const WithAppRouter: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard',
        segments: ['dashboard'],
      },
    },
  },
};
```

For more details, see the [official Next.js Vite documentation](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite/?renderer=react#nextjs-routing).

---

## Presentation Components Architecture

Tetrastack separates UI into **presentation components** (pure, stateless) and **container components** (stateful, data-fetching). Storybook focuses on presentation components.

### Benefits

1. **Testability**: Pure components are easy to test with different prop combinations
2. **Reusability**: Presentation components work across different contexts
3. **Documentation**: Stories serve as usage examples for each component variant
4. **Performance**: Isolated components enable targeted optimization

### Component Structure

```
packages/@tetrastack/react-glass/
├── src/
│   └── lib/
│       └── glass-components/
│           ├── GlassButton.tsx          # Component implementation
│           ├── GlassButton.stories.tsx   # Component stories
│           ├── GlassCard.tsx
│           ├── GlassCard.stories.tsx
│           └── ...
├── .storybook/
│   ├── main.ts                          # Storybook configuration
│   └── preview.tsx                      # Global decorators and parameters
```

### Example Presentation Component

```tsx
// GlassButton.tsx
interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function GlassButton({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  onClick,
}: GlassButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

---

## Getting Started

### Running Storybook

Each package with components has its own Storybook instance:

```bash
# From the package directory
cd packages/@tetrastack/react-glass
npm run storybook

# Or from the monorepo root
npm run storybook --workspace=@tetrastack/react-glass
```

Storybook will start at `http://localhost:6006`.

### Creating a New Story

1. Create a `.stories.tsx` file alongside your component
2. Define the meta configuration and export stories
3. Add the `autodocs` tag for automatic documentation

---

## Writing Stories

### Basic Story Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlassButton } from './GlassButton';

const meta: Meta<typeof GlassButton> = {
  title: 'Glass Components/GlassButton',
  component: GlassButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof GlassButton>;

// Each export becomes a story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};
```

### Stories with Composition

For complex components, compose smaller components within stories:

```tsx
import { ApplicationLayout } from './ApplicationLayout';
import { ApplicationLayoutNav } from './ApplicationLayoutNav';
import { GlassCard } from './GlassCard';

export const Default: Story = {
  args: {
    header: 'My Application',
    nav: (
      <ApplicationLayoutNav
        options={navOptions}
        activeValue="dashboard"
        onSelect={(val) => console.log('Selected:', val)}
      />
    ),
    children: (
      <GlassCard>
        <h2>Dashboard Content</h2>
      </GlassCard>
    ),
  },
};
```

### Using Decorators

Apply decorators for consistent styling or context:

```tsx
// .storybook/preview.tsx
import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="theme-background min-h-screen p-8">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

---

## Configuration

### Main Configuration

The `.storybook/main.ts` file defines:

- **stories**: Glob patterns for story files
- **addons**: Storybook addons for enhanced functionality
- **framework**: The Storybook framework (react-vite)
- **viteFinal**: Custom Vite configuration

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  async viteFinal(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(
      (await import('@vitejs/plugin-react')).default({
        jsxRuntime: 'automatic',
      }),
    );
    return config;
  },
};

export default config;
```

### Essential Addons

| Addon                           | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `@storybook/addon-essentials`   | Core addons (controls, actions, viewport, backgrounds) |
| `@storybook/addon-interactions` | Test user interactions within stories                  |
| `@storybook/addon-links`        | Link stories together for navigation                   |

---

## Testing with Storybook

### Interaction Testing

Use the `play` function to test component interactions:

```tsx
import { expect, userEvent, within } from '@storybook/test';

export const ClickInteraction: Story = {
  args: {
    children: 'Click Me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await userEvent.click(button);

    await expect(button).toHaveFocus();
  },
};
```

### Visual Regression Testing

Stories serve as the basis for visual regression testing:

1. Each story represents a specific component state
2. Visual testing tools compare snapshots across builds
3. Changes are flagged for review before merging

### Component Testing with Vitest

The `@storybook/react-vite` framework provides full support for Vitest integration:

```typescript
// Component.test.tsx
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import * as stories from './GlassButton.stories';

const { Primary, Disabled } = composeStories(stories);

test('renders primary button', () => {
  render(<Primary />);
  expect(screen.getByRole('button')).toHaveTextContent('Primary Button');
});

test('disabled button is not clickable', () => {
  render(<Disabled />);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

---

## Best Practices

### 1. One Component, One Story File

Keep stories co-located with their components:

```
GlassButton/
├── GlassButton.tsx
├── GlassButton.stories.tsx
└── GlassButton.test.tsx
```

### 2. Cover All Variants

Create stories for each meaningful component state:

- Default state
- All prop variants (size, color, type)
- Interactive states (hover, focus, disabled)
- Edge cases (empty content, long text, loading)

### 3. Use ArgTypes for Documentation

Define argTypes to enhance the Controls panel and auto-generated docs:

```tsx
argTypes: {
  variant: {
    description: 'Visual style of the button',
    control: { type: 'select' },
    options: ['primary', 'secondary', 'tertiary', 'error'],
    table: {
      defaultValue: { summary: 'primary' },
    },
  },
},
```

### 4. Keep Stories Simple

Stories should demonstrate component usage, not implement complex logic:

```tsx
// Good: Simple, focused story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click Me',
  },
};

// Avoid: Complex logic in stories
export const Complex: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    // ... complex state management
  },
};
```

### 5. Use Decorators for Context

When components need context (themes, providers), add decorators:

```tsx
// Story-level decorator
export const WithTheme: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider theme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};
```

---

## Additional Resources

- [Storybook Next.js Vite Documentation](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite/?renderer=react)
- [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf)
- [Storybook Testing](https://storybook.js.org/docs/writing-tests)
- [Tetrastack React Glass Package](../../../packages/@tetrastack/react-glass/)
