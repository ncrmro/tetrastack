import NextAuth, { NextAuthConfig } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { sqlite } from '../database';
import { providers } from './providers';
import { uuidv7 } from '../utils';
import { eq } from 'drizzle-orm';
import type { Provider } from 'next-auth/providers';

const { users } = sqlite;

/** Type for database instances compatible with DrizzleAdapter */
type DrizzleDatabase = Parameters<typeof DrizzleAdapter>[0];

/** User type returned from database queries */
interface DbUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * Configuration options for createAuth
 */
export interface CreateAuthConfig {
  database?: DrizzleDatabase;
  providers?: Provider[];
  callbacks?: NextAuthConfig['callbacks'];
}

/**
 * Creates auth configuration for Node.js mode (with database)
 */
const createAuthConfigNode = (
  database: DrizzleDatabase,
  customProviders?: Provider[],
): NextAuthConfig => {
  // Cast to access query and insert methods - DrizzleAdapter union type is too broad
  const db = database as DrizzleDatabase & {
    query: {
      users: {
        findFirst: (opts: {
          where: ReturnType<typeof eq>;
        }) => Promise<DbUser | undefined>;
      };
    };
    insert: (table: typeof users) => {
      values: (data: {
        id: string;
        email: string;
        name: string | null | undefined;
      }) => { returning: () => Promise<DbUser[]> };
    };
  };

  return {
    adapter: DrizzleAdapter(database),
    providers: customProviders ?? providers,
    session: {
      strategy: 'jwt',
    },
    callbacks: {
      async signIn({ user }) {
        if (user.email) {
          let dbUser = await db.query.users.findFirst({
            where: eq(users.email, user.email),
          });

          if (!dbUser) {
            const inserted = await db
              .insert(users)
              .values({
                id: uuidv7(),
                email: user.email,
                name: user.name,
              })
              .returning();
            dbUser = inserted[0];
          }
          user.id = dbUser?.id;
        }
        return true;
      },
      jwt: async ({ token, user }) => {
        if (user) {
          token.userId = user.id;
        }
        return token;
      },
      session: async ({ session, token }) => {
        if (token.userId) {
          session.user.id = token.userId as string;
        }
        return session;
      },
    },
  };
};

/**
 * Creates auth configuration for Edge mode (without database)
 * Suitable for use in proxy.js where database access is not available
 */
const createAuthConfigEdge = (
  customProviders?: Provider[],
): NextAuthConfig => ({
  providers: customProviders ?? providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});

/**
 * Creates NextAuth instance with optional database support
 *
 * @example Node.js mode (with database):
 * ```typescript
 * import { createAuth } from '@tetrastack/backend/auth';
 * import { database } from './database';
 *
 * export const { handlers, auth, signIn, signOut } = createAuth({ database });
 * ```
 *
 * @example Edge mode (without database):
 * ```typescript
 * import { createAuth } from '@tetrastack/backend/auth';
 *
 * export const { auth } = createAuth();
 * ```
 */
export function createAuth(
  config?: CreateAuthConfig,
): ReturnType<typeof NextAuth> {
  if (config?.database) {
    const nodeConfig = createAuthConfigNode(config.database, config.providers);
    // Merge custom callbacks with the base callbacks
    if (config.callbacks) {
      const baseCallbacks = nodeConfig.callbacks || {};
      nodeConfig.callbacks = {
        ...baseCallbacks,
        ...config.callbacks,
        // Merge signIn to call both base and custom
        signIn: async (params) => {
          // Call base signIn first (handles user lookup/creation)
          const baseResult = await baseCallbacks.signIn?.(params);
          if (baseResult === false) return false;
          // Then call custom signIn if provided
          if (config.callbacks?.signIn) {
            return config.callbacks.signIn(params);
          }
          return baseResult ?? true;
        },
      };
    }
    return NextAuth(nodeConfig);
  }
  return NextAuth(createAuthConfigEdge(config?.providers));
}

/**
 * Creates auth configuration based on mode
 */
export const createAuthConfig = (config?: CreateAuthConfig): NextAuthConfig => {
  if (config?.database) {
    return createAuthConfigNode(config.database, config.providers);
  }
  return createAuthConfigEdge(config?.providers);
};
