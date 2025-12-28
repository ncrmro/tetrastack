# Workspace Packages

Tetrastack uses npm workspaces to manage internal packages under the `packages/` directory. These packages provide shared functionality that can be imported across the main application.

## Table of Contents

1. [Package Structure](#package-structure)
2. [Available Packages](#available-packages)
3. [Workspace Configuration](#workspace-configuration)
4. [TypeScript Path Aliases](#typescript-path-aliases)
5. [Creating a New Package](#creating-a-new-package)
6. [Package Exports](#package-exports)
7. [Testing Packages](#testing-packages)

---

## Package Structure

```
packages/
├── @tetrastack/                    # Scoped packages
│   ├── backend/                    # Backend utilities (auth, database, uploads)
│   ├── react-glass/                # Glass design system components
│   └── react-glass-graphs/         # Graph visualization components
├── tetrastack-server-jobs/         # Background job processing (planning)
└── tetrastack-server-tasks/        # Task queue system (planning)
```

---

## Available Packages

### @tetrastack/backend

Backend utilities for authentication, database operations, and file uploads.

**Exports:**

```typescript
import { ... } from '@tetrastack/backend';           // Main exports
import { ... } from '@tetrastack/backend/auth';      // Authentication utilities
import { ... } from '@tetrastack/backend/database';  // Database helpers
import { ... } from '@tetrastack/backend/uploads';   // File upload utilities
import { ... } from '@tetrastack/backend/utils';     // General utilities (uuidv7, etc.)
```

**Dependencies:** drizzle-orm, next-auth, @aws-sdk/client-s3, zod

### @tetrastack/react-glass

Glass design system React component library with a frosted glass aesthetic.

**Exports:**

```typescript
import { GlassSurface } from '@tetrastack/react-glass/GlassSurface';
import { GlassCard } from '@tetrastack/react-glass/GlassCard';
import { GlassButton } from '@tetrastack/react-glass/GlassButton';
import { GlassInput } from '@tetrastack/react-glass/GlassInput';
import { GlassSelect } from '@tetrastack/react-glass/GlassSelect';
import { GlassIncrementor } from '@tetrastack/react-glass/GlassIncrementor';
import { Breadcrumbs } from '@tetrastack/react-glass/Breadcrumbs';
import { cn } from '@tetrastack/react-glass/utils';
```

**Storybook:** `npm run storybook` (port 6006) from the package directory

### @tetrastack/react-glass-graphs

Graph and visualization components built on @xyflow/react and dagre.

**Exports:**

```typescript
import { ... } from '@tetrastack/react-glass-graphs';          // Main exports
import { ... } from '@tetrastack/react-glass-graphs/fixtures'; // Test fixtures
import { ... } from '@tetrastack/react-glass-graphs/hooks';    // React hooks
import { ... } from '@tetrastack/react-glass-graphs/nodes';    // Graph node components
```

**Dependencies:** @xyflow/react, @dagrejs/dagre

---

## Workspace Configuration

Workspaces are configured in the root `package.json`:

```json
{
  "workspaces": ["packages/*", "packages/@tetrastack/*"]
}
```

This enables:

- Automatic symlink creation for local packages
- Shared `node_modules` hoisting for common dependencies
- Unified dependency management across packages

### Installing Dependencies

When adding dependencies to a workspace package:

```bash
# From root directory
npm install <package> -w @tetrastack/backend

# From package directory
cd packages/@tetrastack/backend
npm install <package>
```

---

## TypeScript Path Aliases

The root `tsconfig.json` defines path aliases for workspace packages:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@tetrastack/backend": ["./packages/@tetrastack/backend/src/index.ts"],
      "@tetrastack/backend/*": ["./packages/@tetrastack/backend/src/*"],
      "@tetrastack/react-glass": [
        "./packages/@tetrastack/react-glass/index.ts"
      ],
      "@tetrastack/react-glass/utils": [
        "./packages/@tetrastack/react-glass/src/lib/glass-components/utils.ts"
      ],
      "@tetrastack/react-glass/*": ["./packages/@tetrastack/react-glass/src/*"],
      "@tetrastack/react-glass-graphs": [
        "./packages/@tetrastack/react-glass-graphs/index.ts"
      ],
      "@tetrastack/react-glass-graphs/*": [
        "./packages/@tetrastack/react-glass-graphs/*"
      ]
    }
  }
}
```

These aliases allow TypeScript to resolve imports directly to source files without requiring a build step.

### Next.js Configuration

Packages must be listed in `next.config.ts` for proper transpilation:

```typescript
const nextConfig: NextConfig = {
  transpilePackages: [
    '@tetrastack/backend',
    '@tetrastack/react-glass',
    '@tetrastack/react-glass-graphs',
  ],
};
```

---

## Creating a New Package

1. **Create the directory structure:**

   ```bash
   mkdir -p packages/@tetrastack/my-package/src
   ```

2. **Initialize package.json:**

   ```json
   {
     "name": "@tetrastack/my-package",
     "version": "0.1.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts"
     }
   }
   ```

3. **Add TypeScript path alias** in root `tsconfig.json`:

   ```json
   {
     "paths": {
       "@tetrastack/my-package": [
         "./packages/@tetrastack/my-package/src/index.ts"
       ],
       "@tetrastack/my-package/*": ["./packages/@tetrastack/my-package/src/*"]
     }
   }
   ```

4. **Add to transpilePackages** in `next.config.ts` if used in the Next.js app

5. **Add vitest alias** if tests need to import the package (see [testing.md](./testing.md#workspace-packages))

---

## Package Exports

Packages use explicit export maps for tree-shaking and selective imports:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./ComponentA": "./src/components/ComponentA.tsx",
    "./ComponentB": "./src/components/ComponentB.tsx",
    "./utils": "./src/utils/index.ts"
  }
}
```

**Benefits:**

- Consumers import only what they need
- Better bundle size optimization
- Clear public API surface
- Subpath imports for organization

---

## Testing Packages

Workspace packages integrate with the main test suite. For vitest to resolve workspace package imports, aliases must be configured.

See [testing.md](./testing.md#workspace-packages) for:

- Configuring vitest aliases for workspace packages
- Running tests that depend on workspace packages
- Package-specific test configurations
