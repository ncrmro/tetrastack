// Shared types and constants for agents - safe for client-side import

import { z } from 'zod';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Timeline tracking for agent execution
export interface TimelineEvent {
  timestamp: string;
  step: string; // High-level step (research, select, generate, foods)
  phase: string; // Detailed phase within step
  agent?: string; // Which agent/sub-agent
  toolCall?: {
    name: string; // Tool name
    input: unknown; // Tool input parameters
  };
  toolResult?: {
    success: boolean;
    data?: unknown; // Tool response data
    error?: string; // Error message if failed
  };
  details?: string; // Human-readable description
  metadata?: {
    duration?: number; // Time taken for this event
    usage?: unknown; // Token usage from AI calls
    finishReason?: string; // How AI step completed
    [key: string]: unknown; // Allow additional properties
  };
}

// Zod schema for TimelineEvent validation
export const TimelineEventSchema = z.object({
  timestamp: z.string(),
  step: z.string(),
  phase: z.string(),
  agent: z.string().optional(),
  toolCall: z
    .object({
      name: z.string(),
      input: z.unknown(),
    })
    .optional(),
  toolResult: z
    .object({
      success: z.boolean(),
      data: z.unknown().optional(),
      error: z.string().optional(),
    })
    .optional(),
  details: z.string().optional(),
  metadata: z
    .object({
      duration: z.number().optional(),
      usage: z.unknown().optional(),
      finishReason: z.string().optional(),
    })
    .passthrough() // Allow additional properties
    .optional(),
});

export type ProgressCallback = (
  step: string,
  details?: string,
  completed?: string[],
  timelineEvent?:
    | TimelineEvent
    | { type: string; data: unknown; timestamp?: string },
) => void;

// Generic result type for all generators
export interface GeneratorResult<T> {
  data: T;
  explanation: string;
  research?: string;
}

// Serialized agent state for storage/transfer
export interface AgentState<TResult = unknown> {
  agentName: string;
  result?: TResult;
  messages: ChatMessage[];
  context?: unknown;
  modelId: string;
  completedStages: string[];
  timestamp: string;
}
