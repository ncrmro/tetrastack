import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import type { AdapterAccountType } from 'next-auth/adapters';

/**
 * User preferences structure stored in users.data
 *
 * Defines user-specific settings and preferences.
 * This type can be extended as new preference categories are added.
 */
export type UserPreferences = {
  /**
   * Theme preference for the UI
   */
  theme?: 'light' | 'dark' | 'system';

  /**
   * Whether to show completed tasks by default
   */
  showCompletedTasks?: boolean;

  /**
   * Default view for project lists
   */
  defaultProjectView?: 'list' | 'board' | 'calendar';
};

export const users = sqliteTable('user', {
  id: integer('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  admin: integer('admin', { mode: 'boolean' }).default(false),
  onboardingCompleted: integer('onboarding_completed', {
    mode: 'boolean',
  }).default(false),
  onboardingData: text('onboarding_data', {
    mode: 'json',
  }).$type<Record<string, unknown> | null>(),
  /**
   * Generic user data storage for preferences and settings
   *
   * This flexible JSON column can store various user preferences without requiring
   * schema migrations for each new preference type.
   *
   * Example usage:
   * - preferences: UserPreferences
   *   - Theme (light, dark, system)
   *   - Default views and display settings
   * - Notification settings
   * - Feature flags
   */
  data: text('data', {
    mode: 'json',
  }).$type<{
    preferences?: UserPreferences;
  }>(),
});

export const accounts = sqliteTable(
  'account',
  {
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = sqliteTable(
  'authenticator',
  {
    credentialID: text('credentialID').notNull().unique(),
    userId: integer('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('providerAccountId').notNull(),
    credentialPublicKey: text('credentialPublicKey').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credentialDeviceType').notNull(),
    credentialBackedUp: integer('credentialBackedUp', {
      mode: 'boolean',
    }).notNull(),
    transports: text('transports'),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

// Schema generation and types
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

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
