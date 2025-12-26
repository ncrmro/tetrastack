import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
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
  const users = pgTable('users', {
    id: uuid('id')
      .notNull()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text('name'),
    email: text('email').notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    image: text('image'),
    metadata: jsonb('metadata').$type<TMetadata>(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  });

  const accounts = pgTable(
    'accounts',
    {
      userId: uuid('user_id')
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
      createdAt: timestamp('created_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp('updated_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
    },
    (account) => ({
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    }),
  );

  const sessions = pgTable(
    'sessions',
    {
      sessionToken: text('session_token').notNull().primaryKey(),
      userId: uuid('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
      expires: timestamp('expires', { mode: 'date' }).notNull(),
      createdAt: timestamp('created_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp('updated_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
    },
    (session) => ({
      userIdIdx: uniqueIndex('sessions__userId__idx').on(session.userId),
    }),
  );

  const verificationTokens = pgTable(
    'verification_tokens',
    {
      identifier: text('identifier').notNull(),
      token: text('token').notNull(),
      expires: timestamp('expires', { mode: 'date' }).notNull(),
      createdAt: timestamp('created_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
      updatedAt: timestamp('updated_at', { mode: 'date' })
        .notNull()
        .defaultNow(),
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
