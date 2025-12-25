// Graph Types
// Based on specs/006-document-workflows/plan.md

export type GraphCategory =
  | 'research'
  | 'marketing'
  | 'finance'
  | 'engineering';

export type NodeStatus =
  | 'pending' // Not started
  | 'available' // Dependencies met, ready to start
  | 'in_progress' // Currently being worked on
  | 'completed' // Finished
  | 'blocked'; // Dependencies not met

export interface DocumentOutput {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'complete' | 'needs_review';
}

export interface GraphNodeData {
  id: string;
  label: string;
  description?: string;
  category: GraphCategory;
  status: NodeStatus;
  dependencies: string[];
  outputs: DocumentOutput[];
  estimatedTime?: string;
  estimatedCost?: string;
}

export interface Graph {
  id: string;
  name: string;
  description: string;
  category: GraphCategory;
  version: string;
  nodes: GraphNodeData[];
}

// Category color mappings using theme tokens from globals.css
export const categoryColors: Record<
  GraphCategory,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
  }
> = {
  research: {
    bg: 'bg-tertiary-container',
    border: 'border-tertiary',
    text: 'text-on-tertiary-container',
    accent: 'text-tertiary',
  },
  marketing: {
    bg: 'bg-secondary-container',
    border: 'border-secondary',
    text: 'text-on-secondary-container',
    accent: 'text-secondary',
  },
  finance: {
    bg: 'bg-primary-container',
    border: 'border-primary',
    text: 'text-on-primary-container',
    accent: 'text-primary',
  },
  engineering: {
    bg: 'bg-surface-variant',
    border: 'border-outline',
    text: 'text-on-surface-variant',
    accent: 'text-on-surface',
  },
};

// Status visual styles
export const statusStyles: Record<
  NodeStatus,
  {
    ring: string;
    badge: string;
    icon: string;
  }
> = {
  pending: {
    ring: 'ring-1 ring-outline opacity-60',
    badge: 'bg-surface-variant text-on-surface-variant',
    icon: 'clock',
  },
  available: {
    ring: 'ring-2 ring-primary',
    badge: 'bg-primary text-on-primary',
    icon: 'play',
  },
  in_progress: {
    ring: 'ring-2 ring-secondary animate-pulse',
    badge: 'bg-secondary text-on-secondary',
    icon: 'arrow-path',
  },
  completed: {
    ring: 'ring-1 ring-primary/50',
    badge: 'bg-primary/20 text-primary',
    icon: 'check-circle',
  },
  blocked: {
    ring: 'ring-1 ring-error',
    badge: 'bg-error-container text-on-error-container',
    icon: 'exclamation-triangle',
  },
};

// Category display names
export const categoryLabels: Record<GraphCategory, string> = {
  research: 'Research',
  marketing: 'Marketing',
  finance: 'Finance',
  engineering: 'Engineering',
};

// Status display names
export const statusLabels: Record<NodeStatus, string> = {
  pending: 'Pending',
  available: 'Available',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
};
