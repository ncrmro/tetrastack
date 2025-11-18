import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './schema.auth';

/**
 * Optional schema for storing agent states
 * Enables multi-turn conversations and agent resumption across sessions
 *
 * This table is optional and can be added if you want to persist agent states.
 * Without this table, agents can still be serialized to JSON and stored elsewhere
 * (e.g., session storage, cookies, or client-side state).
 *
 * To add this schema to your database:
 * 1. Uncomment the export in src/lib/db/schema.ts
 * 2. Run: npm run db:generate
 * 3. Run: npm run db:migrate
 */
export const agentStates = sqliteTable('agent_states', {
  id: text('id').primaryKey(), // UUID or generated ID
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  sessionId: text('session_id'), // Optional session identifier
  agentType: text('agent_type').notNull(), // 'FoodGeneratorAgent', 'RecipeGeneratorAgent', etc.
  state: text('state').notNull(), // JSON-serialized AgentState
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // Optional TTL for cleanup
});

export type AgentStateRecord = typeof agentStates.$inferSelect;
export type NewAgentStateRecord = typeof agentStates.$inferInsert;
