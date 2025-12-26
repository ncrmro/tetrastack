import { sqlite } from '@tetrastack/backend/database';

const { createAuthTables } = sqlite;

/**
 * User metadata structure stored in users.metadata JSON column
 *
 * Defines user-specific settings, preferences, and flags.
 * Using a JSON column allows flexible extension without schema migrations.
 */
export type UserMetadata = {
  /** Whether the user has admin privileges */
  admin?: boolean;

  /** Whether the user has completed onboarding */
  onboardingCompleted?: boolean;

  /** Onboarding step data */
  onboardingData?: Record<string, unknown>;

  /** Theme preference for the UI */
  theme?: 'light' | 'dark' | 'system';

  /** Whether to show completed tasks by default */
  showCompletedTasks?: boolean;

  /** Default view for project lists */
  defaultProjectView?: 'list' | 'board' | 'calendar';
};

// Create auth tables with our custom metadata type
export const { users, accounts, sessions, verificationTokens } =
  createAuthTables<UserMetadata>();

// Schema generation and types
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * User schema for insertions (auto-generated from Drizzle table)
 */
export const insertUserSchema = createInsertSchema(users);

/**
 * Complete user schema for reads (auto-generated from Drizzle table)
 */
export const selectUserSchema = createSelectSchema(users);

// Export types for TypeScript usage
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
