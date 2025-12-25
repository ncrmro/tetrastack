import type { Graph } from '../src/types';

/**
 * Multi-category graph demonstrating cross-functional dependencies.
 * Shows nodes from different categories (research, marketing, engineering)
 * working together in a coordinated graph.
 */
export const multiCategoryGraph: Graph = {
  id: 'multi-category',
  name: 'Cross-Functional Graph',
  description: 'A graph spanning research, marketing, and engineering',
  category: 'research', // Primary category
  version: '1.0.0',
  nodes: [
    {
      id: 'research-phase',
      label: 'Research & Discovery',
      description: 'Gather requirements and analyze the problem space',
      category: 'research',
      status: 'completed',
      dependencies: [],
      outputs: [
        {
          id: 'research-1',
          name: 'Research Findings',
          type: 'research-report',
          status: 'complete',
        },
        {
          id: 'research-2',
          name: 'User Insights',
          type: 'insights',
          status: 'complete',
        },
      ],
      estimatedTime: '2 hours',
    },
    {
      id: 'marketing-strategy',
      label: 'Marketing Strategy',
      description: 'Develop positioning and messaging based on research',
      category: 'marketing',
      status: 'in_progress',
      dependencies: ['research-phase'],
      outputs: [
        {
          id: 'mktg-1',
          name: 'Positioning Document',
          type: 'strategy',
          status: 'draft',
        },
      ],
      estimatedTime: '1 hour',
    },
    {
      id: 'engineering-spec',
      label: 'Technical Specification',
      description: 'Define technical architecture based on research findings',
      category: 'engineering',
      status: 'available',
      dependencies: ['research-phase'],
      outputs: [
        {
          id: 'eng-1',
          name: 'Tech Spec',
          type: 'specification',
          status: 'draft',
        },
      ],
      estimatedTime: '3 hours',
    },
    {
      id: 'finance-budget',
      label: 'Budget Planning',
      description: 'Allocate resources and estimate costs',
      category: 'finance',
      status: 'pending',
      dependencies: ['marketing-strategy', 'engineering-spec'],
      outputs: [
        {
          id: 'fin-1',
          name: 'Budget Proposal',
          type: 'budget',
          status: 'draft',
        },
      ],
      estimatedTime: '45 min',
    },
    {
      id: 'implementation',
      label: 'Implementation',
      description: 'Build the solution according to specifications',
      category: 'engineering',
      status: 'pending',
      dependencies: ['engineering-spec', 'finance-budget'],
      outputs: [
        {
          id: 'impl-1',
          name: 'Deliverable',
          type: 'product',
          status: 'draft',
        },
      ],
      estimatedTime: '1 week',
    },
    {
      id: 'launch',
      label: 'Launch Campaign',
      description: 'Execute marketing launch based on strategy',
      category: 'marketing',
      status: 'pending',
      dependencies: ['marketing-strategy', 'implementation'],
      outputs: [
        {
          id: 'launch-1',
          name: 'Launch Materials',
          type: 'campaign',
          status: 'draft',
        },
      ],
      estimatedTime: '2 hours',
    },
  ],
};
