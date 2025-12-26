import { createAuth } from '@tetrastack/backend/auth';
import type { DefaultSession } from 'next-auth';
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
      id: string; // Changed from number to string
      admin: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string; // Changed from number to string
    admin: boolean;
  }

  interface JWT {
    id: string; // Changed from number to string
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

const currentProviders = [...authConfig.providers];

// Development credentials provider (requires database, cannot be in auth.config.ts)
if (process.env.NODE_ENV === 'development') {
  currentProviders.push(
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
          id: user.id, // Now it's already a string (UUID)
          admin: user.metadata?.admin ?? false,
        };
      },
    }),
  );
}

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

/**
 * Pure JWT session strategy for all environments
 * Extends the edge-safe auth.config.ts with database-dependent callbacks
 */
export const { handlers, signIn, signOut, auth } = createAuth({
  database: db,
  providers: currentProviders,
  callbacks: {
    // Custom signIn callback for PostHog identification
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
