import type * as React from 'react';
import { type BreadcrumbItem, Breadcrumbs } from './Breadcrumbs';
import { GlassCard } from './GlassCard';
import { cn } from './utils';

export interface DefaultLayoutProps extends React.ComponentProps<'div'> {
  /**
   * Breadcrumb items for navigation
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Page title to display
   */
  title?: string;

  /**
   * Page description/subtitle
   */
  description?: string;

  /**
   * Actions to display in the header (e.g., buttons)
   */
  headerActions?: React.ReactNode;

  /**
   * Whether to wrap content in a GlassCard
   */
  useCard?: boolean;

  /**
   * Maximum width constraint
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
}

/**
 * DefaultLayout - Standard page layout with breadcrumbs and glass styling
 *
 * Provides a consistent layout structure for single record pages and other content pages.
 * Includes breadcrumbs, page title, description, and optional header actions.
 *
 * Example usage:
 * ```tsx
 * <DefaultLayout
 *   breadcrumbs={[
 *     { label: 'Home', href: '/', isHome: true },
 *     { label: 'Recipes', href: '/recipes' },
 *     { label: recipeName }
 *   ]}
 *   title={recipeName}
 *   description="View and edit recipe details"
 *   headerActions={<EditButton />}
 *   useCard
 * >
 *   <RecipeDetails />
 * </DefaultLayout>
 * ```
 */
export function DefaultLayout({
  className,
  breadcrumbs,
  title,
  description,
  headerActions,
  useCard = true,
  maxWidth = '7xl',
  children,
  ...props
}: DefaultLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const content = (
    <>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {/* Page Header */}
      {(title || description || headerActions) && (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-3xl font-bold text-on-surface mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-on-surface-variant">{description}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0">{headerActions}</div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div>{children}</div>
    </>
  );

  return (
    <div
      className={cn(
        'container mx-auto px-4 py-8',
        maxWidthClasses[maxWidth],
        className,
      )}
      {...props}
    >
      {useCard ? <GlassCard intensity="medium">{content}</GlassCard> : content}
    </div>
  );
}
