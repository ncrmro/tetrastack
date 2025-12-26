# React Glass Graphs

A generic DAG (Directed Acyclic Graph) visualization library built on React Flow with glass-morphism styling.

## Philosophy

This package provides **reusable graph visualization components** that can be shared across projects. Use it for:

- Workflow visualizations
- Pipeline diagrams
- Dependency trees
- Task/process graphs
- Any directed acyclic graph

Components in this package should:

- Be **framework-agnostic** - Works with any React setup (Next.js, Vite, etc.)
- Be **domain-agnostic** - No business logic, just visualization
- Use **React Flow** - Built on @xyflow/react for powerful graph capabilities
- Support **theming** - Uses CSS custom properties for customization
- Provide **clean APIs** - Well-typed props with TypeScript

## Components

### WorkflowBrowser

The main component for rendering interactive DAG visualizations.

```tsx
import { WorkflowBrowser } from '@tetrastack/react-glass-graphs';
import type { WorkflowGraph } from '@tetrastack/react-glass-graphs';

const graph: WorkflowGraph = {
  id: 'my-graph',
  name: 'My Graph',
  description: 'A sample DAG',
  category: 'engineering',
  version: '1.0.0',
  nodes: [
    {
      id: 'node-1',
      label: 'First Node',
      description: 'Start here',
      category: 'engineering',
      status: 'completed',
      dependencies: [],
      outputs: [],
    },
    // ... more nodes
  ],
};

function App() {
  return <WorkflowBrowser workflow={graph} />;
}
```

#### Props

| Prop          | Type            | Description                          |
| ------------- | --------------- | ------------------------------------ |
| `workflow`    | `WorkflowGraph` | The graph data to visualize          |
| `interactive` | `boolean`       | Enable pan/zoom/drag (default: true) |

## Types

### WorkflowGraph

```typescript
interface WorkflowGraph {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  version: string;
  nodes: WorkflowNodeData[];
}
```

### WorkflowNodeData

```typescript
interface WorkflowNodeData {
  id: string;
  label: string;
  description?: string;
  category: WorkflowCategory;
  status: NodeStatus;
  dependencies: string[]; // IDs of nodes this depends on
  outputs: DocumentOutput[];
  estimatedTime?: string;
  estimatedCost?: string;
}
```

### WorkflowCategory

```typescript
type WorkflowCategory = 'research' | 'marketing' | 'finance' | 'engineering';
```

### NodeStatus

```typescript
type NodeStatus =
  | 'pending'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'blocked';
```

## Fixtures

The package includes generic example fixtures for testing and Storybook:

```tsx
import {
  simpleGraph,
  parallelGraph,
  multiCategoryGraph,
} from '@tetrastack/react-glass-graphs/fixtures';
```

- **simpleGraph** - Basic linear A→B→C graph
- **parallelGraph** - Branching and merging graph
- **multiCategoryGraph** - Cross-functional graph spanning categories

## Theme Customization

The components use CSS custom properties from the Material Design color system. Define these in your project's CSS:

```css
:root {
  /* Primary colors */
  --color-primary: oklch(0.6 0.15 250);
  --color-on-primary: oklch(1 0 0);
  --color-primary-container: oklch(0.9 0.05 250);
  --color-on-primary-container: oklch(0.2 0.05 250);

  /* Secondary colors */
  --color-secondary: oklch(0.6 0.12 320);
  --color-on-secondary: oklch(1 0 0);
  --color-secondary-container: oklch(0.9 0.05 320);
  --color-on-secondary-container: oklch(0.2 0.05 320);

  /* Tertiary colors */
  --color-tertiary: oklch(0.65 0.12 180);
  --color-on-tertiary: oklch(1 0 0);
  --color-tertiary-container: oklch(0.9 0.05 180);
  --color-on-tertiary-container: oklch(0.2 0.05 180);

  /* Surface colors */
  --color-surface: oklch(0.98 0 0);
  --color-on-surface: oklch(0.1 0 0);
  --color-surface-variant: oklch(0.92 0.01 260);
  --color-on-surface-variant: oklch(0.3 0.01 260);

  /* Outline */
  --color-outline: oklch(0.5 0.01 260);
  --color-outline-variant: oklch(0.8 0.01 260);

  /* Error */
  --color-error: oklch(0.55 0.2 25);
  --color-error-container: oklch(0.9 0.05 25);
  --color-on-error-container: oklch(0.25 0.1 25);
}
```

### Category Color Mapping

Each category maps to theme colors:

| Category    | Background          | Border    | Text                   |
| ----------- | ------------------- | --------- | ---------------------- |
| research    | tertiary-container  | tertiary  | on-tertiary-container  |
| marketing   | secondary-container | secondary | on-secondary-container |
| finance     | primary-container   | primary   | on-primary-container   |
| engineering | surface-variant     | outline   | on-surface-variant     |

### Status Visual Styles

| Status      | Ring Style                      | Badge Style     |
| ----------- | ------------------------------- | --------------- |
| pending     | outline, opacity-60             | surface-variant |
| available   | primary ring-2                  | primary         |
| in_progress | secondary ring-2, animate-pulse | secondary       |
| completed   | primary/50 ring-1               | primary/20      |
| blocked     | error ring-1                    | error-container |

## Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "peerDependencies": {
    "react": ">=19",
    "react-dom": ">=19",
    "@xyflow/react": ">=12",
    "@tetrastack/react-glass": "*"
  }
}
```

## Usage in a Monorepo

### Setup

1. Place package in `packages/@tetrastack/react-glass-graphs/`

2. Add workspace config to root `package.json`:

   ```json
   {
     "workspaces": ["packages/*", "packages/@tetrastack/*"]
   }
   ```

3. Add path aliases to `tsconfig.json`:

   ```json
   {
     "compilerOptions": {
       "paths": {
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

4. Run `npm install` to link the workspace

### Recommended: Wrapper Layer

For maximum flexibility, re-export components through a project wrapper:

```tsx
// src/components/ui/workflow.ts
export {
  WorkflowBrowser,
  type WorkflowGraph,
  type WorkflowNodeData,
} from '@tetrastack/react-glass-graphs';

// Project-specific components stay in the project
export { WorkflowProgress } from '@/components/workflow/Progress';
```

Then import from the wrapper:

```tsx
import { WorkflowBrowser } from '@/components/ui/workflow';
```

## Storybook

The package includes its own Storybook for development:

```bash
cd packages/@tetrastack/react-glass-graphs
npm run storybook
```

Stories use the generic fixtures to demonstrate component capabilities without domain-specific data.

## Hooks

### useWorkflowLayout

Hook for automatic graph layout using Dagre:

```tsx
import { useWorkflowLayout } from '@tetrastack/react-glass-graphs/hooks';

const { nodes, edges, isLayouted } = useWorkflowLayout(graphNodes);
```

## Custom Nodes

For advanced customization, you can import and extend the node components:

```tsx
import {
  WorkflowNode,
  CategoryBadge,
} from '@tetrastack/react-glass-graphs/nodes';
```

## What Belongs Here vs Project-Specific

**In this package (generic):**

- Graph visualization components
- Layout algorithms
- Node/edge rendering
- Category/status styling

**In your project (specific):**

- Progress indicators tied to specific workflow types
- Business logic for status updates
- Domain-specific fixtures
- Integration with your data layer

## Contributing

When modifying components:

1. Keep components framework-agnostic
2. Keep components domain-agnostic (no business logic)
3. Use TypeScript for all code
4. Document props with JSDoc comments
5. Export types for consumer usage
6. Test with the included Storybook
7. Update fixtures if adding new status/category types
