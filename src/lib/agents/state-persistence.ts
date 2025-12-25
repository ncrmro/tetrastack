import type { BaseAgent } from './base-agent';
import type { AgentState } from './types';

/**
 * Helper utilities for agent state serialization and persistence
 *
 * These functions work with any storage mechanism:
 * - Session storage (cookies)
 * - Client-side state (React state, localStorage)
 * - Database (see schema.agent-states.ts for optional database schema)
 * - Any other storage solution
 *
 * Just use `agent.toJSON()` and `AgentClass.fromJSON()` with your preferred storage.
 */

/**
 * Serialize agent state to a storable format
 * Creates a unique ID and returns the serialized state
 *
 * @param agent - Agent instance to serialize
 * @returns Object with unique ID and serialized state
 *
 * @example
 * ```typescript
 * const agent = await FoodGeneratorAgent.builder()
 *   .execute([{ role: 'user', content: 'chicken breast' }]);
 *
 * const { id, state } = serializeAgentState(agent);
 *
 * // Store in session
 * cookies().set(`agent_${id}`, JSON.stringify(state), {
 *   httpOnly: true,
 *   maxAge: 60 * 60, // 1 hour
 * });
 * ```
 */
export function serializeAgentState<T extends BaseAgent>(
  agent: T,
): { id: string; state: AgentState } {
  return {
    id: crypto.randomUUID(),
    state: agent.toJSON(),
  };
}

/**
 * Deserialize agent state and restore agent instance
 *
 * @param state - Serialized agent state
 * @param AgentClass - Agent class to restore (e.g., FoodGeneratorAgent)
 * @returns Restored agent instance with full state
 *
 * @example
 * ```typescript
 * // Load from session
 * const stateJson = cookies().get(`agent_${stateId}`)?.value;
 * if (stateJson) {
 *   const state = JSON.parse(stateJson);
 *   const agent = deserializeAgentState(state, FoodGeneratorAgent);
 *
 *   // Continue the conversation
 *   await agent.continue([
 *     { role: 'user', content: 'make it skinless' }
 *   ]);
 *
 *   const result = agent.getResult();
 * }
 * ```
 */
export function deserializeAgentState<T extends BaseAgent>(
  state: AgentState,

  AgentClass: any,
): T {
  return AgentClass.fromJSON(state) as T;
}

/**
 * Create a state with expiration timestamp
 * Useful for implementing TTL (time-to-live) in any storage mechanism
 *
 * @param agent - Agent instance to serialize
 * @param ttlHours - Time-to-live in hours (default: 24)
 * @returns Object with ID, state, and expiration timestamp
 *
 * @example
 * ```typescript
 * const { id, state, expiresAt } = createExpiringState(agent, 24);
 *
 * // Store with expiration
 * await storage.set(id, { state, expiresAt });
 *
 * // Later, check expiration before loading
 * const stored = await storage.get(id);
 * if (stored && new Date(stored.expiresAt) > new Date()) {
 *   const agent = deserializeAgentState(stored.state, FoodGeneratorAgent);
 * }
 * ```
 */
export function createExpiringState<T extends BaseAgent>(
  agent: T,
  ttlHours: number = 24,
): { id: string; state: AgentState; expiresAt: Date } {
  return {
    id: crypto.randomUUID(),
    state: agent.toJSON(),
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
  };
}

/**
 * Check if a state has expired
 *
 * @param expiresAt - Expiration timestamp
 * @returns true if expired, false otherwise
 */
export function isStateExpired(expiresAt: Date | string): boolean {
  const expiration =
    typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration < new Date();
}
