// Shared types and constants for agents - safe for client-side import

export interface TaskGenerationOptions {
  simplified?: boolean;
  includeSubtasks?: boolean;
  includeDependencies?: boolean;
  getOrCreateTasks?: boolean; // Enable task database search/create
  getOrCreateProjects?: boolean; // Cascade to project agent
}

export const TaskGenerationSteps = {
  RESEARCH: 'research',
  SELECT: 'select',
  GENERATE: 'generate',
  COMPLETE: 'complete',
} as const;
