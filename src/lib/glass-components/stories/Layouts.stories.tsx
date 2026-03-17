import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassButton,
  GlassButtonLink,
  GlassInput,
  GlassSelect,
  GlassLink,
  GlassNav,
  DefaultLayout,
} from '../index';

/**
 * Composition stories demonstrating real-world page layouts
 * built from glass components. These represent the 80% use cases:
 * authentication, content listings, entity detail pages, and data tables.
 */

/* ------------------------------------------------------------------ */
/*  SignInForm                                                         */
/* ------------------------------------------------------------------ */

function SignInFormLayout() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <GlassCard className="w-full max-w-md" intensity="medium">
        <GlassCardHeader>
          <GlassCardTitle as="h1" className="text-center">
            Sign In
          </GlassCardTitle>
          <GlassCardDescription className="text-center">
            Enter your credentials to access your account
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Email
            </label>
            <GlassInput type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">
              Password
            </label>
            <GlassInput type="password" placeholder="Enter your password" />
          </div>
        </GlassCardContent>
        <GlassCardFooter className="flex-col gap-3">
          <GlassButton variant="primary" className="w-full">
            Sign In
          </GlassButton>
          <GlassLink href="#" variant="secondary" size="small">
            Forgot password?
          </GlassLink>
        </GlassCardFooter>
      </GlassCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BlogIndex                                                          */
/* ------------------------------------------------------------------ */

const blogPosts = [
  {
    title: 'Getting Started with Glass Components',
    excerpt:
      'Learn how to build modern UIs with glass-morphism effects using our component library.',
    date: 'Mar 15, 2026',
    author: 'Alice Chen',
  },
  {
    title: 'Design Systems at Scale',
    excerpt:
      'How we built a consistent design system that serves multiple products and teams.',
    date: 'Mar 12, 2026',
    author: 'Bob Martinez',
  },
  {
    title: 'Server Components & Glass UI',
    excerpt:
      'Combining React Server Components with client-side glass effects for optimal performance.',
    date: 'Mar 8, 2026',
    author: 'Carol Park',
  },
  {
    title: 'Accessibility in Glass Design',
    excerpt:
      'Ensuring glass-morphism effects remain accessible across all devices and user needs.',
    date: 'Mar 3, 2026',
    author: 'David Kim',
  },
];

function BlogIndexLayout() {
  return (
    <DefaultLayout
      breadcrumbs={[
        { label: 'Home', href: '#', isHome: true },
        { label: 'Blog' },
      ]}
      title="Blog"
      description="Latest articles and updates from the team"
      useCard={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogPosts.map((post) => (
          <GlassCard
            key={post.title}
            className="flex flex-col"
            padded={false}
          >
            <div className="p-6 flex-1">
              <GlassCardHeader>
                <GlassCardTitle as="h2" className="text-xl">
                  {post.title}
                </GlassCardTitle>
                <GlassCardDescription>{post.excerpt}</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm text-on-surface-variant">
                  {post.author} &middot; {post.date}
                </p>
              </GlassCardContent>
            </div>
            <GlassCardFooter className="px-6 pb-6">
              <GlassButtonLink href="#" variant="primary" size="small">
                Read more
              </GlassButtonLink>
            </GlassCardFooter>
          </GlassCard>
        ))}
      </div>
    </DefaultLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  EntityDetail                                                       */
/* ------------------------------------------------------------------ */

const entityTabs = ['Overview', 'Tasks', 'Members', 'Settings'];

function EntityDetailLayout() {
  return (
    <DefaultLayout
      breadcrumbs={[
        { label: 'Home', href: '#', isHome: true },
        { label: 'Projects', href: '#' },
        { label: 'Tetrastack' },
      ]}
      title="Tetrastack"
      description="Full-stack TypeScript boilerplate with glass UI"
      headerActions={
        <div className="flex gap-2">
          <GlassButton variant="secondary" size="small">
            Edit
          </GlassButton>
          <GlassButton variant="primary" size="small">
            Deploy
          </GlassButton>
        </div>
      }
      useCard={false}
    >
      <GlassNav className="mb-6 px-4 py-2 rounded-xl">
        <div className="flex gap-4">
          {entityTabs.map((tab, i) => (
            <a
              key={tab}
              href="#"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                i === 0
                  ? 'bg-primary/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </a>
          ))}
        </div>
      </GlassNav>

      <GlassCard>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-on-surface-variant mb-1">
                Status
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                Active
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-on-surface-variant mb-1">
                Priority
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                High
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-on-surface-variant mb-1">
                Created
              </h3>
              <p className="text-on-surface">Feb 6, 2026</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-on-surface-variant mb-1">
                Members
              </h3>
              <p className="text-on-surface">5 team members</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </DefaultLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  DataTable                                                          */
/* ------------------------------------------------------------------ */

const tableRows = [
  {
    name: 'Auth middleware rewrite',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Alice Chen',
  },
  {
    name: 'Add Storybook to glass components',
    status: 'In Progress',
    priority: 'Medium',
    assignee: 'Bob Martinez',
  },
  {
    name: 'Database migration tooling',
    status: 'Done',
    priority: 'High',
    assignee: 'Carol Park',
  },
  {
    name: 'E2E test coverage for admin',
    status: 'Todo',
    priority: 'Low',
    assignee: 'David Kim',
  },
  {
    name: 'Deploy pipeline optimization',
    status: 'Todo',
    priority: 'Medium',
    assignee: 'Alice Chen',
  },
];

function DataTableLayout() {
  return (
    <DefaultLayout
      breadcrumbs={[
        { label: 'Home', href: '#', isHome: true },
        { label: 'Projects', href: '#' },
        { label: 'Tasks' },
      ]}
      title="Tasks"
      description="Manage and track project tasks"
      useCard={false}
    >
      <GlassCard padded={false}>
        <div className="p-4 border-b border-outline flex flex-col sm:flex-row gap-3">
          <GlassInput
            type="text"
            placeholder="Search tasks..."
            className="sm:max-w-xs"
          />
          <GlassSelect className="sm:max-w-[180px]">
            <option value="all">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </GlassSelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline">
                <th className="px-4 py-3 text-sm font-medium text-on-surface-variant">
                  Task
                </th>
                <th className="px-4 py-3 text-sm font-medium text-on-surface-variant">
                  Status
                </th>
                <th className="px-4 py-3 text-sm font-medium text-on-surface-variant">
                  Priority
                </th>
                <th className="px-4 py-3 text-sm font-medium text-on-surface-variant">
                  Assignee
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-outline/50 hover:bg-primary/5 transition-colors"
                >
                  <td className="px-4 py-3 text-on-surface font-medium">
                    {row.name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Done'
                          ? 'bg-primary/20 text-primary'
                          : row.status === 'In Progress'
                            ? 'bg-secondary/20 text-secondary'
                            : 'bg-outline/30 text-on-surface-variant'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {row.priority}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {row.assignee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DefaultLayout>
  );
}

/* ------------------------------------------------------------------ */
/*  Storybook Meta & Exports                                           */
/* ------------------------------------------------------------------ */

const meta: Meta = {
  title: 'Layouts',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

export const SignInForm: Story = {
  render: () => <SignInFormLayout />,
};

export const BlogIndex: Story = {
  render: () => <BlogIndexLayout />,
};

export const EntityDetail: Story = {
  render: () => <EntityDetailLayout />,
};

export const DataTable: Story = {
  render: () => <DataTableLayout />,
};
