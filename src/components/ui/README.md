# UI Components Layer

## Purpose

The `src/components/ui/` directory serves as the **project-specific wrapper layer** for all UI primitives used in the application. This layer provides a stable, consistent API between your application code and the underlying design system components.

## Architecture

This directory contains two types of components:

1. **Glass Component Wrappers** - Re-exports from `@/lib/glass-components` (our framework-agnostic glass-morphism design system)
2. **shadcn/ui Components** - Components from the shadcn/ui library

Both types are wrapped through this layer to:

- Maintain a consistent import path (`@/components/ui/`)
- Enable easy switching between design systems
- Allow project-specific customization
- Provide a stable API that insulates application code from underlying library changes

## Critical Rule: Import from Here, Not from Design Systems

**ALWAYS import UI components from `@/components/ui/`, NEVER directly from design systems:**

```tsx
// ❌ BAD: Direct imports from design systems
import { GlassButton } from '@/lib/glass-components';
import { Dialog } from '@/components/ui/dialog'; // Wait, this is actually correct!

// ✅ GOOD: Import through the ui/ wrapper layer
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
```

**Exception**: Demo pages (`/glass-demo`, `/glass-example`) may import directly from `@/lib/glass-components` for educational purposes to showcase the raw design system.

## Benefits of the Wrapper Layer

### 1. Easy Design System Migration

Replace the entire design system without touching application code:

```tsx
// Before: Glass components
export { GlassButton as Button } from '@/lib/glass-components';

// After: Switching to shadcn/ui (or any other system)
export { Button } from '@/components/ui/button-shadcn';
```

Your application code never changes - it always imports from `@/components/ui/button`.

### 2. Project-Specific Defaults

Override defaults for your project's needs:

```tsx
import { GlassButton, type GlassButtonProps } from '@/lib/glass-components';

// Set project-wide defaults
export function Button({
  variant = 'primary',
  size = 'lg',
  ...props
}: GlassButtonProps) {
  return <GlassButton variant={variant} size={size} {...props} />;
}
```

### 3. Consistent API Across Teams

Everyone imports from the same place with the same component names, reducing confusion:

```tsx
// Everyone uses the same imports
import { Button, Card, Input } from '@/components/ui';
```

### 4. Centralized Customization

Add project-specific functionality in one place:

```tsx
export function Button({ onClick, ...props }: ButtonProps) {
  // Project-wide analytics tracking
  const handleClick = (e) => {
    trackEvent('button_click');
    onClick?.(e);
  };

  return <GlassButton onClick={handleClick} {...props} />;
}
```

## Current Component Inventory

### Glass Component Wrappers

Currently planned (implementation in progress):

- [ ] **Background** - Theme background (custom component)
- [ ] **Button** - Will wrap GlassButton
- [ ] **Card** - Will wrap GlassCard with composable parts
- [ ] **Input** - Will wrap GlassInput
- [ ] **Select** - Will wrap GlassSelect
- [ ] **Nav** - Will wrap GlassNav
- [ ] **Incrementor** - Will wrap GlassIncrementor

### shadcn/ui Components

Already implemented:

- **button.tsx** - Button component (currently shadcn-based)
- **card.tsx** - Card with Header, Title, Description, Content, Footer, Action
- **input.tsx** - Input field
- **dialog.tsx** - Modal dialog with Trigger, Portal, Overlay, Content, Header, Footer
- **dropdown-menu.tsx** - Dropdown menu component
- **label.tsx** - Form label component
- **avatar.tsx** - Avatar component

### Project-Specific Components

- **Background.tsx** - Theme background wrapper
- **ThemeToggle.tsx** - Light/dark mode toggle
- **MacroCircleRatios.tsx** - Nutrition visualization (domain-specific)

## Usage Patterns

### Pattern 1: Simple Re-export

When you want to expose the component as-is:

```tsx
// components/ui/card.tsx
export {
  GlassCard as Card,
  GlassCardHeader as CardHeader,
  GlassCardTitle as CardTitle,
  GlassCardDescription as CardDescription,
  GlassCardContent as CardContent,
} from '@/lib/glass-components';

export type { GlassCardProps as CardProps } from '@/lib/glass-components';
```

### Pattern 2: Custom Defaults

When you want to set project-specific defaults:

```tsx
// components/ui/button.tsx
import { GlassButton, type GlassButtonProps } from '@/lib/glass-components';

export function Button({ variant = 'primary', ...props }: GlassButtonProps) {
  return <GlassButton variant={variant} {...props} />;
}

export type ButtonProps = GlassButtonProps;
```

### Pattern 3: Enhanced Functionality

When you need to add project-specific behavior:

```tsx
// components/ui/input.tsx
import { GlassInput, type GlassInputProps } from '@/lib/glass-components';
import { useFormValidation } from '@/lib/hooks/useFormValidation';

export function Input(props: GlassInputProps) {
  const { register } = useFormValidation();

  return <GlassInput {...register(props.name)} {...props} />;
}

export type InputProps = GlassInputProps;
```

### Pattern 4: Composing Multiple Components

When you want to build higher-level abstractions:

```tsx
// components/ui/form-field.tsx
import { Input } from './input';
import { Label } from './label';

export function FormField({ label, name, ...inputProps }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...inputProps} />
    </div>
  );
}
```

## Integration with Glass Components

For detailed information about the underlying glass components design system, see:

- `src/lib/glass-components/README.md` - Design system philosophy, components, and portability guidelines

The glass components are designed to be:

- **Framework-agnostic** - Work in any React environment
- **Self-contained** - Minimal external dependencies
- **Portable** - Can be moved to other projects

## Migration Roadmap

Current state (in progress):

1. ✅ Glass components design system created in `src/lib/glass-components/`
2. ✅ Glass components documented with usage patterns
3. 🚧 **IN PROGRESS**: Creating wrappers in `src/components/ui/` for glass components
4. ⏳ **NEXT**: Migrate application code to use `@/components/ui/` imports
5. ⏳ **FUTURE**: Enforce import rules via ESLint

## Best Practices

### DO:

- ✅ Always import from `@/components/ui/`
- ✅ Keep wrappers thin - minimal logic
- ✅ Re-export types alongside components
- ✅ Document custom props or behavior
- ✅ Use descriptive component names that match their purpose

### DON'T:

- ❌ Import directly from `@/lib/glass-components` in application code
- ❌ Import directly from shadcn source files
- ❌ Add business logic to UI component wrappers
- ❌ Mix design systems in the same component
- ❌ Create one-off styled components outside this directory

## Example: Full Implementation Flow

**Step 1: Glass component exists**

```tsx
// src/lib/glass-components/GlassButton.tsx
export function GlassButton({ variant, children, ...props }) {
  return (
    <button className={`glass-effect ${variant}`} {...props}>
      {children}
    </button>
  );
}
```

**Step 2: Create wrapper**

```tsx
// src/components/ui/button.tsx
export { GlassButton as Button } from '@/lib/glass-components';
export type { GlassButtonProps as ButtonProps } from '@/lib/glass-components';
```

**Step 3: Use in application**

```tsx
// src/app/recipes/page.tsx
import { Button } from '@/components/ui/button';

export default function RecipesPage() {
  return <Button variant="primary">Create Recipe</Button>;
}
```

**Step 4: Later, swap design system (if needed)**

```tsx
// src/components/ui/button.tsx
// No changes to application code needed!
export { Button } from './button-shadcn';
export type { ButtonProps } from './button-shadcn';
```

## Component Documentation Template

When adding a new component to this directory, document it with:

````tsx
/**
 * [Component Name] - [Brief description]
 *
 * Wraps: [Source component, e.g., GlassButton from @/lib/glass-components]
 *
 * @example
 * ```tsx
 * import { ComponentName } from '@/components/ui/component-name';
 *
 * <ComponentName variant="primary">Example</ComponentName>
 * ```
 */
export function ComponentName(props: ComponentProps) {
  // Implementation
}
````

## Questions?

- **Which design system should I use?** → Use `@/components/ui/` imports - this layer abstracts the decision
- **Can I customize a component?** → Yes! Override defaults in the wrapper or extend functionality
- **How do I add a new component?** → Create it in `@/lib/glass-components`, then wrap it here in `ui/`
- **What if I need a one-off styled component?** → Create it in your feature directory, not here
- **Can I use Tailwind directly in application code?** → Yes! This layer is for reusable UI primitives only

---

**Remember**: This layer exists to make your life easier. If the abstraction feels like it's getting in the way, discuss with the team - we can adjust the pattern!
