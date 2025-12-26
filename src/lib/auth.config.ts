import { createAuthConfig } from '@tetrastack/backend/auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-compatible auth configuration for middleware
 * This config CANNOT import from database modules or Node.js APIs
 *
 * Uses createAuthConfig from @tetrastack/backend/auth in edge mode.
 */
export const authConfig = createAuthConfig({
  providers: [Google],
});
