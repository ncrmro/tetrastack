import { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
import { cn } from './utils';

export interface GlassNavProps
  extends Omit<
    GlassSurfaceProps,
    'bordered' | 'shadowed' | 'intensity' | 'variant'
  > {
  /**
   * Whether the nav is sticky at the top
   */
  sticky?: boolean;

  /**
   * Glass intensity - defaults to 'light' for subtle effect
   */
  intensity?: 'light' | 'medium' | 'strong';

  /**
   * Color variant for tinting
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | 'error';
}

/**
 * GlassNav - Navigation bar component with glass-morphism effect
 *
 * A navigation container that uses a glass effect matching card backgrounds
 * while allowing background content to show through. Designed for top navigation bars.
 *
 * Example usage:
 * ```tsx
 * <GlassNav sticky>
 *   <div className="container mx-auto flex items-center justify-between">
 *     <Logo />
 *     <NavLinks />
 *   </div>
 * </GlassNav>
 * ```
 */
export function GlassNav({
  className,
  sticky = false,
  intensity = 'strong',
  variant,
  children,
  ...props
}: GlassNavProps) {
  return (
    <GlassSurface
      as="nav"
      intensity={intensity}
      variant={variant}
      bordered={false}
      shadowed
      className={cn(
        'border-b border-white/20 dark:border-white/10',
        sticky && 'sticky top-0 z-50',
        className,
      )}
      {...props}
    >
      {children}
    </GlassSurface>
  );
}
