# NextJS Admin Utilities

A reusable NextJS admin utilities and components library for building admin interfaces with authentication and authorization.

## Overview

This library provides a set of utilities and components specifically designed for building admin interfaces in Next.js applications. It includes authorization helpers, navigation components, and user account management UI.

## Features

- ✨ **Authorization Helpers**: Verify team membership and admin status
- 🔐 **Authentication Ready**: Works with NextAuth.js out of the box
- 🎨 **Pre-built Components**: Navigation, account dropdown with admin links
- 📱 **Responsive Design**: Mobile-friendly navigation with hamburger menu
- 🎯 **Type-Safe**: Full TypeScript support with exported types
- 🔧 **Customizable**: Easy to extend and customize for your project

## Components

### Navigation

Main navigation component with admin menu support.

**Features:**

- Responsive design with mobile menu
- Conditional admin link
- Theme toggle integration
- User account dropdown
- Sign in/out functionality

**Usage:**

```tsx
import { Navigation } from '@/lib/nextjs-admin';

<Navigation
  session={session}
  isAdmin={isAdmin}
  signIn={signInAction}
  signOut={signOutAction}
/>;
```

### NavigationWrapper

Server component wrapper that fetches session and renders Navigation.

**Usage:**

```tsx
import { NavigationWrapper } from '@/lib/nextjs-admin';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NavigationWrapper />
        {children}
      </body>
    </html>
  );
}
```

### AccountDropdown

User account dropdown menu with admin link.

**Features:**

- User avatar with fallback
- Account settings link
- Conditional admin link
- Sign out functionality

**Usage:**

```tsx
import { AccountDropdown } from '@/lib/nextjs-admin';

<AccountDropdown session={session} isAdmin={isAdmin} signOut={signOutAction} />;
```

## Authorization Helpers

### verifyTeamMembership

Check if a user is a member of a team.

```tsx
import { verifyTeamMembership } from '@/lib/nextjs-admin';

const isMember = await verifyTeamMembership(userId, teamId);
```

### verifyTeamAdmin

Check if a user is an admin of a team.

```tsx
import { verifyTeamAdmin } from '@/lib/nextjs-admin';

const isAdmin = await verifyTeamAdmin(userId, teamId);
```

### verifyProjectTeamMembership

Check if a user is a member of a project's team.

```tsx
import { verifyProjectTeamMembership } from '@/lib/nextjs-admin';

const isMember = await verifyProjectTeamMembership(userId, projectId);
```

### verifyProjectTeamAdmin

Check if a user is an admin of a project's team.

```tsx
import { verifyProjectTeamAdmin } from '@/lib/nextjs-admin';

const isAdmin = await verifyProjectTeamAdmin(userId, projectId);
```

### verifyTaskTeamMembership

Check if a user is a member of a task's project's team.

```tsx
import { verifyTaskTeamMembership } from '@/lib/nextjs-admin';

const isMember = await verifyTaskTeamMembership(userId, taskId);
```

### verifyCommentOwnership

Check if a user owns a comment.

```tsx
import { verifyCommentOwnership } from '@/lib/nextjs-admin';

const isOwner = await verifyCommentOwnership(userId, commentId);
```

### verifyTagTeamMembership

Check if a user is a member of a tag's team.

```tsx
import { verifyTagTeamMembership } from '@/lib/nextjs-admin';

const isMember = await verifyTagTeamMembership(userId, tagId);
```

### verifyBulkTeamAccess

Verify user has access to multiple items by checking their team membership.

```tsx
import {
  verifyBulkTeamAccess,
  verifyProjectTeamMembership,
} from '@/lib/nextjs-admin';

const hasAccess = await verifyBulkTeamAccess(
  userId,
  tasks,
  (task) => task.projectId,
  verifyProjectTeamMembership,
);
```

## Dependencies

This library requires the following peer dependencies:

- `next` (15.x)
- `react` (19.x)
- `next-auth` (5.x)
- `drizzle-orm`
- `@heroicons/react`
- UI components from your project's component library:
  - `@/components/ui/button`
  - `@/components/ui/nav`
  - `@/components/ui/avatar`
  - `@/components/ui/dropdown-menu`
  - `@/components/ui/ThemeToggle`

## Project Structure

```
src/lib/nextjs-admin/
├── AGENTS.md              # Documentation for AI agents
├── README.md              # This file
├── index.ts               # Main exports
├── auth-helpers.ts        # Authorization utilities
├── Navigation.tsx         # Navigation component
├── NavigationWrapper.tsx  # Server component wrapper
└── AccountDropdown.tsx    # Account dropdown component
```

## Best Practices

1. **Don't import directly in application code** - Create a wrapper layer in your `components/` directory
2. **Customize for your project** - Override defaults and add project-specific features in your wrappers
3. **Use server components** - Leverage Next.js server components for better security
4. **Type everything** - Take advantage of exported TypeScript types

## Example: Protecting an Admin Route

```tsx
import { auth } from '@/app/auth';
import { verifyTeamAdmin } from '@/lib/nextjs-admin';
import { redirect } from 'next/navigation';

export default async function AdminPage({
  params,
}: {
  params: { teamId: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const isAdmin = await verifyTeamAdmin(
    parseInt(session.user.id),
    params.teamId,
  );

  if (!isAdmin) {
    redirect('/unauthorized');
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </div>
  );
}
```

## Contributing

When contributing to this library:

1. Maintain Next.js App Router patterns
2. Keep components framework-agnostic where possible
3. Export all TypeScript types
4. Add JSDoc comments for all functions and components
5. Update this README with any new features

## License

Part of the Tetrastack project.
