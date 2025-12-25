import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import { createAuthTables } from './auth';

// Define a custom metadata type for testing
type TestUserMetadata = {
  admin: boolean;
  onboarding_completed: boolean;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
};

describe('createAuthTables', () => {
  let db: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;

  beforeEach(() => {
    // Create in-memory SQLite database
    sqlite = new Database(':memory:');
    db = drizzle(sqlite);

    // Create tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER,
        image TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (provider, provider_account_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        expires INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (identifier, token)
      );
    `);
  });

  it('should create tables with default metadata type', () => {
    const { users, accounts, sessions, verificationTokens } =
      createAuthTables();
    expect(users).toBeDefined();
    expect(accounts).toBeDefined();
    expect(sessions).toBeDefined();
    expect(verificationTokens).toBeDefined();
  });

  it('should create tables with custom metadata type', () => {
    const { users, accounts, sessions, verificationTokens } =
      createAuthTables<TestUserMetadata>();
    expect(users).toBeDefined();
    expect(accounts).toBeDefined();
    expect(sessions).toBeDefined();
    expect(verificationTokens).toBeDefined();
  });

  it('should insert and retrieve user with typed metadata', async () => {
    const { users } = createAuthTables<TestUserMetadata>();

    const metadata: TestUserMetadata = {
      admin: true,
      onboarding_completed: false,
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    };

    // Insert user with metadata
    await db.insert(users).values({
      id: '019b565e-b579-7d19-944c-71eb05aa98dc',
      email: 'test@example.com',
      name: 'Test User',
      metadata,
    });

    // Retrieve user
    const result = await db.select().from(users);
    expect(result).toHaveLength(1);

    const user = result[0];
    expect(user.email).toBe('test@example.com');
    expect(user.metadata).toEqual(metadata);

    // TypeScript should know the metadata type
    if (user.metadata) {
      expect(user.metadata.admin).toBe(true);
      expect(user.metadata.onboarding_completed).toBe(false);
      expect(user.metadata.preferences?.theme).toBe('dark');
    }
  });

  it('should handle null metadata', async () => {
    const { users } = createAuthTables<TestUserMetadata>();

    await db.insert(users).values({
      id: '019b565e-b579-7d19-944c-71eb05aa98dd',
      email: 'nullmeta@example.com',
      name: 'Null Metadata User',
    });

    const result = await db.select().from(users);
    expect(result).toHaveLength(1);
    expect(result[0].metadata).toBeNull();
  });

  it('should update metadata', async () => {
    const { users } = createAuthTables<TestUserMetadata>();
    const { eq } = await import('drizzle-orm');

    const initialMetadata: TestUserMetadata = {
      admin: false,
      onboarding_completed: false,
    };

    await db.insert(users).values({
      id: '019b565e-b579-7d19-944c-71eb05aa98de',
      email: 'update@example.com',
      name: 'Update User',
      metadata: initialMetadata,
    });

    const updatedMetadata: TestUserMetadata = {
      admin: true,
      onboarding_completed: true,
      preferences: {
        theme: 'light',
        notifications: false,
      },
    };

    await db
      .update(users)
      .set({ metadata: updatedMetadata })
      .where(eq(users.email, 'update@example.com'));

    const result = await db.select().from(users);
    expect(result[0].metadata).toEqual(updatedMetadata);
  });

  it('should create related accounts and sessions', async () => {
    const { users, accounts, sessions } = createAuthTables<TestUserMetadata>();

    const userId = '019b565e-b579-7d19-944c-71eb05aa98df';

    // Create user
    await db.insert(users).values({
      id: userId,
      email: 'related@example.com',
      name: 'Related User',
      metadata: { admin: false, onboarding_completed: true },
    });

    // Create account
    await db.insert(accounts).values({
      userId,
      type: 'oauth',
      provider: 'github',
      providerAccountId: '12345',
    });

    // Create session
    await db.insert(sessions).values({
      sessionToken: 'test-session-token',
      userId,
      expires: new Date(Date.now() + 86400000), // 1 day from now
    });

    const userResult = await db.select().from(users);
    const accountResult = await db.select().from(accounts);
    const sessionResult = await db.select().from(sessions);

    expect(userResult).toHaveLength(1);
    expect(accountResult).toHaveLength(1);
    expect(sessionResult).toHaveLength(1);

    expect(accountResult[0].provider).toBe('github');
    expect(sessionResult[0].userId).toBe(userId);
  });
});
