import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { GraphViewer } from './GraphViewer';
import { simpleGraph, parallelGraph, multiCategoryGraph } from '../../fixtures';

const meta: Meta<typeof GraphViewer> = {
  title: 'Packages/react-glass-graphs/GraphViewer',
  component: GraphViewer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '600px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Simple linear graph: A → B → C
 * Demonstrates a basic dependency chain with different statuses.
 */
export const SimpleGraph: Story = {
  args: {
    graph: simpleGraph,
  },
};

/**
 * Parallel graph with branching and merging.
 * Root node splits into three parallel branches that converge at the end.
 */
export const ParallelGraph: Story = {
  args: {
    graph: parallelGraph,
  },
};

/**
 * Multi-category graph spanning research, marketing, finance, and engineering.
 * Shows cross-functional dependencies between different domains.
 */
export const MultiCategoryGraph: Story = {
  args: {
    graph: multiCategoryGraph,
  },
};

/**
 * Non-interactive mode - panning and zooming disabled.
 * Useful for embedding graphs in read-only contexts.
 */
export const NonInteractive: Story = {
  args: {
    graph: simpleGraph,
    interactive: false,
  },
};
