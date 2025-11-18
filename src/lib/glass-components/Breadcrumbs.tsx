import * as React from 'react';
import { cn } from './utils';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface BreadcrumbItem {
  /**
   * Display label for the breadcrumb
   */
  label: string;

  /**
   * URL path for the breadcrumb link
   * If not provided, the breadcrumb will be rendered as plain text (current page)
   */
  href?: string;

  /**
   * Whether this is the home/root breadcrumb
   */
  isHome?: boolean;
}

export interface BreadcrumbsProps extends React.ComponentProps<'nav'> {
  /**
   * Array of breadcrumb items to display
   */
  items: BreadcrumbItem[];

  /**
   * Whether to show the home icon for the first item
   */
  showHomeIcon?: boolean;

  /**
   * Custom Link component for navigation (e.g., Next.js Link, React Router Link)
   * Defaults to a standard anchor tag if not provided
   *
   * @example With Next.js
   * ```tsx
   * import Link from 'next/link';
   * <Breadcrumbs items={items} LinkComponent={Link} />
   * ```
   *
   * @example With React Router
   * ```tsx
   * import { Link } from 'react-router-dom';
   * <Breadcrumbs items={items} LinkComponent={Link} />
   * ```
   */
  LinkComponent?: React.ElementType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

/**
 * Breadcrumbs - Framework-agnostic navigation breadcrumb component
 *
 * Displays a hierarchical navigation path showing the user's current location
 * in the application. Integrates well with the glass design system.
 *
 * This component is framework-agnostic. Pass a custom Link component for
 * client-side navigation (Next.js, React Router, etc.), or use the default
 * anchor tags for standard navigation.
 *
 * @example Basic usage (standard anchor tags)
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/', isHome: true },
 *     { label: 'Recipes', href: '/recipes' },
 *     { label: 'Pasta Carbonara' }
 *   ]}
 * />
 * ```
 *
 * @example With Next.js
 * ```tsx
 * import Link from 'next/link';
 *
 * <Breadcrumbs
 *   items={items}
 *   LinkComponent={Link}
 *   showHomeIcon
 * />
 * ```
 */
export function Breadcrumbs({
  className,
  items,
  showHomeIcon = true,
  LinkComponent = 'a',
  ...props
}: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2 text-sm', className)}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          const showIcon = isFirst && item.isHome && showHomeIcon;

          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <ChevronRightIcon
                  className="h-4 w-4 text-on-surface-variant"
                  aria-hidden="true"
                />
              )}

              {item.href && !isLast ? (
                <LinkComponent
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 hover:text-primary transition-colors',
                    isLast
                      ? 'text-on-surface font-medium cursor-default'
                      : 'text-on-surface-variant',
                  )}
                >
                  {showIcon && (
                    <HomeIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </LinkComponent>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    isLast
                      ? 'text-on-surface font-medium'
                      : 'text-on-surface-variant',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {showIcon && (
                    <HomeIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
