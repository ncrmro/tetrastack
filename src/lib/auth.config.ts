import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { Provider } from 'next-auth/providers';

/**
 * Edge-compatible auth configuration for middleware
 * This config CANNOT import from database modules or Node.js APIs
 *
 * Contains only edge-safe providers (Google)
 * The Credentials provider is added in src/app/auth.ts since it requires database access
 */

export const authConfig = {
  providers: [Google] as Provider[],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
