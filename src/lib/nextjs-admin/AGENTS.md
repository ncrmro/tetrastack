# NextJS Admin Utilities

A reusable NextJS admin utilities and components library for building admin interfaces with authentication and authorization.

## Philosophy

The NextJS Admin library is designed to be **portable and reusable across NextJS projects**. Components and utilities in this directory should:

- ✅ **Be NextJS-specific** - Built for Next.js App Router with server components
- ✅ **Be self-contained** - Minimize external dependencies
- ✅ **Use standard patterns** - Server and client components with TypeScript
- ✅ **Focus on admin functionality** - Authentication, authorization, and admin UI
- ✅ **Export clean APIs** - Well-typed props and clear interfaces

## Usage Pattern

Admin utilities and components are **not meant to be imported directly** into your application code. Instead, they should be re-exported through a project-specific wrapper layer (typically `components/admin/` or `components/`).

### Recommended Project Structure

```
src/
├── lib/
│   └── nextjs-admin/          # ⚠️ DO NOT import from here directly
│       ├── auth-helpers.ts
│       ├── Navigation.tsx
│       ├── AccountDropdown.tsx
│       └── ...
└── components/
    ├── admin/                 # ✅ Import from here
    │   ├── Navigation.tsx     # Re-exports with project customizations
    │   ├── AccountDropdown.tsx
    │   └── ...
    └── ...
```

### Example: Project-Specific Wrapper

```tsx
// ❌ BAD: Direct import in application code
import { Navigation } from '@/lib/nextjs-admin';

// ✅ GOOD: Import through project wrapper
import { Navigation } from '@/components/admin/Navigation';
```

**components/admin/Navigation.tsx:**

```tsx
import {
  Navigation as AdminNavigation,
  type NavigationProps,
} from '@/lib/nextjs-admin';

// Re-export with project-specific defaults or customizations
export function Navigation(props: NavigationProps) {
  return <AdminNavigation {...props} />;
}

export type { NavigationProps };
```

## Benefits of the Wrapper Layer

1. **Easy to switch implementations** - Replace with custom admin components without touching application code
2. **Project-specific customization** - Override defaults, add project-specific features
3. **Consistent API** - Maintain a stable API even when the underlying library changes
4. **Simplified imports** - Shorter, cleaner import paths in application code
5. **Centralized configuration** - Apply project-wide admin settings in one place

## Current Components & Utilities

### Authentication Helpers (`auth-helpers.ts`)

Authorization utilities for verifying team membership and admin status:

- **verifyTeamMembership** - Check if user is a team member
- **verifyTeamAdmin** - Check if user is a team admin
- **verifyProjectTeamMembership** - Check if user is a member of a project's team
- **verifyProjectTeamAdmin** - Check if user is an admin of a project's team
- **verifyTaskTeamMembership** - Check if user is a member of a task's project's team
- **verifyCommentOwnership** - Check if user owns a comment
- **verifyTagTeamMembership** - Check if user is a member of a tag's team
- **verifyBulkTeamAccess** - Verify user has access to multiple items

### UI Components

- **Navigation** - Main navigation component with admin menu
- **NavigationWrapper** - Server component wrapper for Navigation
- **AccountDropdown** - User account dropdown with admin link

## Design Patterns

### Server Components First

Most admin utilities work with server components for better security:

```tsx
// Server component
import { auth } from '@/app/auth';
import { verifyTeamAdmin } from '@/lib/nextjs-admin';

export async function AdminPage({ teamId }: { teamId: string }) {
  const session = await auth();
  const isAdmin = await verifyTeamAdmin(parseInt(session.user.id), teamId);

  if (!isAdmin) {
    return <div>Unauthorized</div>;
  }

  return <div>Admin content</div>;
}
```

### Client Components for Interactivity

Client components handle user interactions:

```tsx
'use client';

import { useState } from 'react';

export function Navigation({ session, isAdmin }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // ... interactive UI
}
```

## Current Status

✅ **Core Functionality**

1. **Auth Helpers** - ✅ Complete set of authorization utilities
2. **Navigation** - ✅ Responsive navigation with mobile menu
3. **Account Dropdown** - ✅ User menu with admin link

## Contribution Guidelines

When adding or modifying components:

1. **Maintain NextJS patterns** - Use App Router conventions (server/client components)
2. **Minimize dependencies** - Only use Next.js core and essential utilities
3. **Use TypeScript** - All components must have proper type definitions
4. **Document props** - Add JSDoc comments for all component props
5. **Export types** - Export TypeScript interfaces/types for consumer usage
6. **Keep it generic** - Avoid project-specific business logic
7. **Test portability** - Ensure components work in any Next.js App Router environment

## Dependencies

Required peer dependencies:

- `next` (15.x) - Next.js framework
- `react` (19.x) - React library
- `next-auth` (5.x) - Authentication
- `drizzle-orm` - Database ORM
- `@heroicons/react` - Icons
- UI components from project's component library

## Example: Full Implementation

**Step 1: Copy admin utilities to your project**

```bash
# Copy lib/nextjs-admin/ directory to your project
cp -r src/lib/nextjs-admin new-project/src/lib/
```

**Step 2: Create project wrapper layer**

```tsx
// components/admin/Navigation.tsx
export { Navigation } from '@/lib/nextjs-admin';
export type { NavigationProps } from '@/lib/nextjs-admin';

// components/admin/AccountDropdown.tsx
export { AccountDropdown } from '@/lib/nextjs-admin';
export type { AccountDropdownProps } from '@/lib/nextjs-admin';
```

**Step 3: Use in application**

```tsx
import { Navigation } from '@/components/admin/Navigation';
import { auth } from '@/app/auth';

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html>
      <body>
        <Navigation session={session} isAdmin={session?.user?.admin ?? false} />
        {children}
      </body>
    </html>
  );
}
```

## Future Vision

Eventually, nextjs-admin should be:

- Published as a standalone npm package
- Compatible with any Next.js 15+ App Router project
- Used as a drop-in admin toolkit with zero configuration
- Customizable through configuration file
- Fully typed with comprehensive TypeScript definitions
- Documented with examples and guides

---

**Questions or issues?** The nextjs-admin library is actively evolving. Contributions and feedback are welcome!
