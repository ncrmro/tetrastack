import type * as React from 'react';
import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
import { cn } from './utils';

export interface GlassCardProps
  extends Omit<GlassSurfaceProps, 'bordered' | 'shadowed'> {
  /**
   * Whether to add padding to the card
   */
  padded?: boolean;

  /**
   * Corner radius variant
   */
  rounded?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Color variant for the card
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'error';
}

/**
 * GlassCard - Card component with glass-morphism effect
 *
 * A container component that uses the glass background effect with sensible defaults
 * for card layouts. Perfect for displaying content with a modern, elevated appearance.
 *
 * Example usage:
 * ```tsx
 * <GlassCard intensity="medium" padded rounded="xl">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 *
 * For cards with consistent heights and bottom-aligned actions:
 * ```tsx
 * <GlassCard className="flex flex-col" padded={false} rounded="lg">
 *   <div className="p-6 flex-1">
 *     <h3>Card Title</h3>
 *     <p>Content that varies in length...</p>
 *   </div>
 *   <GlassCardFooter>
 *     <button>Action</button>
 *   </GlassCardFooter>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  className,
  padded = true,
  rounded = 'xl',
  intensity = 'medium',
  variant = 'default',
  children,
  ...props
}: GlassCardProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
  };

  return (
    <GlassSurface
      intensity={intensity}
      variant={variant}
      bordered
      shadowed
      className={cn(roundedClasses[rounded], padded && 'p-6', className)}
      {...props}
    >
      {children}
    </GlassSurface>
  );
}

export type GlassCardHeaderProps = React.ComponentProps<'div'>;

export function GlassCardHeader({ className, ...props }: GlassCardHeaderProps) {
  return <div className={cn('mb-4', className)} {...props} />;
}

type GlassCardTitleOwnProps = {
  /**
   * The HTML element to render as
   * @default 'h3'
   */
  as?: React.ElementType;
};

export type GlassCardTitleProps<T extends React.ElementType = 'h3'> =
  GlassCardTitleOwnProps &
    Omit<React.ComponentPropsWithoutRef<T>, keyof GlassCardTitleOwnProps>;

export function GlassCardTitle<T extends React.ElementType = 'h3'>({
  as,
  className,
  ...props
}: GlassCardTitleProps<T>) {
  const Component = as || 'h3';
  return (
    <Component
      className={cn('text-2xl font-semibold text-on-surface', className)}
      {...props}
    />
  );
}

export type GlassCardDescriptionProps = React.ComponentProps<'p'>;

export function GlassCardDescription({
  className,
  ...props
}: GlassCardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-on-surface-variant mt-1', className)}
      {...props}
    />
  );
}

export type GlassCardContentProps = React.ComponentProps<'div'>;

export function GlassCardContent({
  className,
  ...props
}: GlassCardContentProps) {
  return <div className={cn('', className)} {...props} />;
}

export type GlassCardFooterProps = React.ComponentProps<'div'>;

export function GlassCardFooter({ className, ...props }: GlassCardFooterProps) {
  return (
    <div
      className={cn('mt-auto pt-4 flex items-center gap-2', className)}
      {...props}
    />
  );
}
