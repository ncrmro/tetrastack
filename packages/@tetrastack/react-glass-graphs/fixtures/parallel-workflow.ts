import type { Graph } from '../src/types';

/**
 * Parallel graph demonstrating branching and merging.
 * Root node splits into parallel branches that converge at the end.
 */
export const parallelGraph: Graph = {
  id: 'parallel-graph',
  name: 'Parallel Processing Graph',
  description: 'A graph with parallel branches that merge at completion',
  category: 'engineering',
  version: '1.0.0',
  nodes: [
    {
      id: 'start',
      label: 'Start',
      description: 'Initialize parallel processing tasks',
      category: 'engineering',
      status: 'completed',
      dependencies: [],
      outputs: [
        {
          id: 'start-1',
          name: 'Task Distribution',
          type: 'config',
          status: 'complete',
        },
      ],
      estimatedTime: '10 min',
    },
    {
      id: 'branch-a',
      label: 'Branch A',
      description: 'First parallel processing track',
      category: 'engineering',
      status: 'in_progress',
      dependencies: ['start'],
      outputs: [
        {
          id: 'branch-a-1',
          name: 'Track A Results',
          type: 'data',
          status: 'draft',
        },
      ],
      estimatedTime: '25 min',
    },
    {
      id: 'branch-b',
      label: 'Branch B',
      description: 'Second parallel processing track',
      category: 'engineering',
      status: 'available',
      dependencies: ['start'],
      outputs: [
        {
          id: 'branch-b-1',
          name: 'Track B Results',
          type: 'data',
          status: 'draft',
        },
      ],
      estimatedTime: '20 min',
    },
    {
      id: 'branch-c',
      label: 'Branch C',
      description: 'Third parallel processing track',
      category: 'engineering',
      status: 'blocked',
      dependencies: ['start'],
      outputs: [
        {
          id: 'branch-c-1',
          name: 'Track C Results',
          type: 'data',
          status: 'draft',
        },
      ],
      estimatedTime: '30 min',
    },
    {
      id: 'merge',
      label: 'Merge Results',
      description: 'Combine outputs from all parallel branches',
      category: 'engineering',
      status: 'pending',
      dependencies: ['branch-a', 'branch-b', 'branch-c'],
      outputs: [
        {
          id: 'merge-1',
          name: 'Combined Output',
          type: 'report',
          status: 'draft',
        },
      ],
      estimatedTime: '15 min',
    },
  ],
};
