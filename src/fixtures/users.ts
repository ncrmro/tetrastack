import { uuidv7 } from '@tetrastack/backend/utils';
import type { UserMetadata } from '../database/schema.auth';

/**
 * User fixtures for seeding and testing
 *
 * Development Authentication:
 * These users can be logged in using the development credentials from auth.ts:
 * - Admin access: Password "admin" (exactly)
 * - Regular user access: Password "password" (exactly)
 *
 * Note: Using suffixes like "admin-123" or "password-456" will create NEW unique users,
 * not log in as these existing users.
 *
 * Examples:
 * - john.doe@example.com with "admin" or "password"
 * - jane.doe@example.com with "admin" or "password"
 */
export const users: Array<{
  id: string;
  name: string;
  email: string;
  metadata: UserMetadata;
}> = [
  {
    id: uuidv7(),
    name: 'Admin User',
    email: 'admin@example.com',
    metadata: {
      admin: true,
      onboardingCompleted: false,
    },
  },
  {
    id: uuidv7(),
    name: 'Bob Alice',
    email: 'bob@alice.com',
    metadata: {
      admin: false,
      onboardingCompleted: false,
    },
  },
];
