import type { Graph } from '../src/types';

/**
 * Simple linear graph demonstrating basic A→B→C dependency chain.
 * Shows different node statuses in a straightforward progression.
 */
export const simpleGraph: Graph = {
  id: 'simple-graph',
  name: 'Simple Linear Graph',
  description: 'A basic three-node graph demonstrating linear dependencies',
  category: 'engineering',
  version: '1.0.0',
  nodes: [
    {
      id: 'step-1',
      label: 'Initialize',
      description: 'Set up the initial configuration and requirements',
      category: 'engineering',
      status: 'completed',
      dependencies: [],
      outputs: [
        {
          id: 'init-1',
          name: 'Configuration File',
          type: 'config',
          status: 'complete',
        },
      ],
      estimatedTime: '15 min',
    },
    {
      id: 'step-2',
      label: 'Process',
      description: 'Execute the main processing logic',
      category: 'engineering',
      status: 'in_progress',
      dependencies: ['step-1'],
      outputs: [
        {
          id: 'proc-1',
          name: 'Processing Results',
          type: 'data',
          status: 'draft',
        },
      ],
      estimatedTime: '30 min',
    },
    {
      id: 'step-3',
      label: 'Finalize',
      description: 'Complete and validate the final output',
      category: 'engineering',
      status: 'pending',
      dependencies: ['step-2'],
      outputs: [
        {
          id: 'final-1',
          name: 'Final Report',
          type: 'report',
          status: 'draft',
        },
      ],
      estimatedTime: '20 min',
    },
  ],
};
