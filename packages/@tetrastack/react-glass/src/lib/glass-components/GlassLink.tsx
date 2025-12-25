import React from 'react';
import { cn } from './utils';
import { GlassSurface } from './GlassSurface';

export interface GlassLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * The variant of the link button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
  /**
   * The size of the link button
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * The URL to link to
   */
  href: string;
  /**
   * Link content
   */
  children: React.ReactNode;
}

/**
 * GlassLink component - A styled anchor component with glass-morphism effect
 *
 * Features:
 * - Glass effect with backdrop blur (using GlassSurface)
 * - Multiple color variants (primary, secondary, tertiary, error)
 * - Multiple sizes (small, medium, large)
 * - Hover and active states
 * - Standard anchor element - compatible with any routing library
 * - Accessible with proper focus styles
 *
 * Note: This is a standard anchor tag. For client-side navigation in Next.js,
 * wrap your Next.js Link component around GlassLink or use Next.js Link with custom styling.
 *
 * @example
 * ```tsx
 * <GlassLink href="/about" variant="primary">About Us</GlassLink>
 * <GlassLink href="/contact" variant="secondary" size="small">Contact</GlassLink>
 * ```
 *
 * @example With Next.js Link
 * ```tsx
 * import Link from 'next/link';
 *
 * <Link href="/about" passHref legacyBehavior>
 *   <GlassLink as="a">About Us</GlassLink>
 * </Link>
 * ```
 */
export function GlassLink({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  href,
  ...props
}: GlassLinkProps) {
  const variantStyles = {
    primary:
      'bg-primary/20 text-primary hover:bg-primary/30 active:bg-primary/40',
    secondary:
      'bg-secondary/20 text-secondary hover:bg-secondary/30 active:bg-secondary/40',
    tertiary:
      'bg-tertiary/20 text-tertiary hover:bg-tertiary/30 active:bg-tertiary/40',
    error: 'bg-error/20 text-error hover:bg-error/30 active:bg-error/40',
  };

  const sizeStyles = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <GlassSurface<'a'>
      as="a"
      href={href}
      intensity="medium"
      bordered
      shadowed={false}
      className={cn(
        'inline-block rounded-lg font-medium transition-all duration-200 no-underline text-center',
        variantStyles[variant],
        sizeStyles[size],
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    >
      {children}
    </GlassSurface>
  );
}
