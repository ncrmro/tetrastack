import { sql } from 'drizzle-orm';
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { uuidv7 } from '../../../utils/uuidv7';

/**
 * Factory function to create auth tables with custom metadata type.
 * @example
 * ```typescript
 * type UserMetadata = { admin: boolean; onboarding_completed: boolean };
 * const { users, accounts, sessions, verificationTokens } = createAuthTables<UserMetadata>();
 * ```
 */
export const createAuthTables = <
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
>() => {
  const users = sqliteTable('users', {
    id: text('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name'),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'timestamp' }),
    image: text('image'),
    metadata: text('metadata', { mode: 'json' }).$type<TMetadata>(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text('deleted_at'),
  });

  const accounts = sqliteTable(
    'accounts',
    {
      userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      type: text('type').notNull(),
      provider: text('provider').notNull(),
      providerAccountId: text('provider_account_id').notNull(),
      refresh_token: text('refresh_token'),
      access_token: text('access_token'),
      expires_at: integer('expires_at'),
      token_type: text('token_type'),
      scope: text('scope'),
      id_token: text('id_token'),
      session_state: text('session_state'),
      createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
      updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    },
    (account) => ({
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    }),
  );

  const sessions = sqliteTable(
    'sessions',
    {
      sessionToken: text('session_token').notNull().primaryKey(),
      userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      expires: integer('expires', { mode: 'timestamp' }).notNull(),
      createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
      updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    },
    (session) => ({
      userIdIdx: uniqueIndex('sessions__userId__idx').on(session.userId),
    }),
  );

  const verificationTokens = sqliteTable(
    'verification_tokens',
    {
      identifier: text('identifier').notNull(),
      token: text('token').notNull(),
      expires: integer('expires', { mode: 'timestamp' }).notNull(),
      createdAt: text('created_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
      updatedAt: text('updated_at')
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    },
    (vt) => ({
      compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    }),
  );

  return { users, accounts, sessions, verificationTokens };
};

// Default tables with generic metadata for backwards compatibility
export const { users, accounts, sessions, verificationTokens } =
  createAuthTables();

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const insertVerificationTokenSchema =
  createInsertSchema(verificationTokens);
export const selectVerificationTokenSchema =
  createSelectSchema(verificationTokens);
