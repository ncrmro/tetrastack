import { uuidv7 } from '@tetrastack/backend/utils';

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
export const users = [
  {
    id: uuidv7(),
    name: 'Admin User',
    email: 'admin@example.com',
    admin: true,
    password: 'password', // Login with "admin" or "admin-123" etc
  },
  {
    id: uuidv7(),
    name: 'Bob Alice',
    email: 'bob@alice.com',
    admin: false,
    password: 'password', // Login with "password" or "password-456" etc
  },
];
