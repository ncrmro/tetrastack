/**
 * NextJS Admin Utilities
 *
 * A reusable library for NextJS admin interfaces with authentication and authorization.
 *
 * ## Core Utilities
 *
 * - **auth-helpers**: Authorization helpers for verifying team membership and admin status
 * - **Navigation**: Main navigation component with admin menu
 * - **NavigationWrapper**: Server component wrapper for Navigation
 * - **AccountDropdown**: User account dropdown with admin link
 *
 * ## Usage Example
 *
 * ```tsx
 * // Server component with auth helpers
 * import { verifyTeamAdmin } from '@/lib/nextjs-admin';
 * import { auth } from '@/app/auth';
 *
 * export async function AdminPage({ teamId }: { teamId: string }) {
 *   const session = await auth();
 *   const isAdmin = await verifyTeamAdmin(parseInt(session.user.id), teamId);
 *
 *   if (!isAdmin) {
 *     return <div>Unauthorized</div>;
 *   }
 *
 *   return <div>Admin content</div>;
 * }
 * ```
 *
 * ```tsx
 * // Client component with Navigation
 * import { Navigation } from '@/lib/nextjs-admin';
 *
 * export function MyLayout({ session, isAdmin }: Props) {
 *   return <Navigation session={session} isAdmin={isAdmin} signIn={signIn} signOut={signOut} />;
 * }
 * ```
 */

// Auth helpers
export {
  verifyTeamMembership,
  verifyTeamAdmin,
  verifyProjectTeamMembership,
  verifyProjectTeamAdmin,
  verifyTaskTeamMembership,
  verifyCommentOwnership,
  verifyTagTeamMembership,
  verifyBulkTeamAccess,
} from './auth-helpers';

// Components
export { default as Navigation } from './Navigation';
export type { NavigationProps } from './Navigation';

export { default as NavigationWrapper } from './NavigationWrapper';

export { default as AccountDropdown } from './AccountDropdown';
export type { AccountDropdownProps } from './AccountDropdown';
