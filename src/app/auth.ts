import NextAuth, { DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/database';
import { eq } from 'drizzle-orm';
import { users } from '@/database/schema.auth';
import PostHogClient from '@/lib/posthog-server';
import { authConfig } from '@/lib/auth.config';

// Redirect URL for authenticated users
export const AUTHENTICATED_USER_REDIRECT_URL = '/dashboard';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      admin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    admin: boolean;
  }

  interface JWT {
    id: string;
    admin: boolean;
  }
}

// PostHog identification helper function
function identifyUserWithPostHog(user: {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  admin?: boolean | undefined;
}) {
  // Skip PostHog identification if no API key is configured
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return;
  }

  try {
    const posthog = PostHogClient();
    posthog.identify({
      distinctId: user.id,
      properties: {
        email: user.email || null,
        name: user.name || null,
        admin: user.admin || false,
      },
    });
    posthog.flush();
  } catch (error) {
    console.error('Failed to identify user with PostHog:', error);
  }
}

// Development credentials provider (requires database, cannot be in auth.config.ts)
if (process.env.NODE_ENV === 'development') {
  authConfig.providers.push(
    Credentials({
      id: 'password',
      name: 'Password',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        /**
         * In development users can sign in with either password or admin as a password
         * Users must be seeded via `npm run db:seed` before authentication
         */
        const password = credentials.password as string;

        // Parse password to extract base type (admin or password)
        const passwordMatch = password.match(/^(password|admin)(?:-.*)?$/);
        if (!passwordMatch) {
          return null;
        }

        const [, baseType] = passwordMatch;
        const isAdmin = baseType === 'admin';

        // Look up the seeded user by email
        const email = isAdmin ? 'admin@example.com' : 'bob@alice.com';

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          console.error(
            `Authentication failed: User not found in database (${email})`,
          );
          console.error(
            'Please run `npm run db:seed` to seed development users',
          );
          return null;
        }

        // Convert integer ID to string for NextAuth compatibility
        return {
          ...user,
          id: user.id.toString(),
          admin: user.admin ?? false,
        };
      },
    }),
  );
}

/**
 * Pure JWT session strategy for all environments
 * Extends the edge-safe auth.config.ts with database-dependent callbacks
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: undefined, // No adapter - pure JWT strategy
  callbacks: {
    /**
     * JWT Callback
     *
     * Called whenever a JWT is created (at sign in) or updated (when session is accessed).
     * We look up the user in the database and store their ID and admin status in the token.
     */
    async jwt({ token, user }) {
      // On sign-in with Credentials provider, user object is fully populated
      if (user && user.id) {
        token.id = user.id;
        token.admin = user.admin;
        return token;
      }

      // For OAuth providers (Google, Mailgun) or token refresh, look up user by email
      const { email, name, picture: image } = token;
      if (!email) {
        throw new Error('No email found during JWT callback');
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        token.id = existingUser.id.toString();
        token.admin = existingUser.admin ?? false;
        return token;
      }

      // Create new user for OAuth sign-ins (production only)
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: name as string | null,
          image: image as string | null,
          admin: false,
          onboardingCompleted: true,
          onboardingData: null,
        })
        .returning();

      token.id = newUser.id.toString();
      token.admin = newUser.admin ?? false;
      return token;
    },

    /**
     * Session Callback
     *
     * Called whenever a session is checked (getSession, useSession, etc).
     * Forward token data to the session object.
     */
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.admin = token.admin as boolean;
      return session;
    },

    /**
     * SignIn Callback
     *
     * Called on successful sign in.
     * Used for PostHog identification.
     */
    signIn({ user }) {
      if (user && user.id) {
        identifyUserWithPostHog({
          id: user.id,
          email: user.email,
          name: user.name,
          admin: user.admin,
        });
      }
      return true;
    },
  },
});

/**
 * Wrapped auth function that throws if not authenticated
 * Use this in server actions that require authentication
 * For server components/pages, use authRedirect() instead
 */
export async function authRequired() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Not authenticated!');
  }
  return session;
}

/**
 * Auth function for server-side components (pages)
 * Redirects to sign-in page if not authenticated instead of throwing an error
 * Use this in server components/pages. For server actions, use authRequired() instead.
 */
export async function authRedirect() {
  const session = await auth();
  if (!session?.user) {
    return signIn();
  }
  return session;
}
