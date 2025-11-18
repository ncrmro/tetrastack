/**
 * Glass Components Design System
 *
 * A minimal, modern design system featuring glass-morphism effects.
 *
 * ## Core Components
 *
 * - **GlassSurface**: Base component for glass-morphism effect
 * - **GlassCard**: Card component with glass styling
 * - **GlassNav**: Navigation bar with glass effect
 * - **GlassButton**: Button component with glass styling
 * - **Breadcrumbs**: Navigation breadcrumb component
 * - **DefaultLayout**: Standard page layout with breadcrumbs
 *
 * ## Color Palette
 *
 * The design system uses a minimal color palette optimized for glass effects:
 * - Primary: Soft teal/cyan (sky-500, cyan-500)
 * - Secondary: Muted purple (violet-500, purple-500)
 * - Tertiary: Soft rose (pink-500, pink-400)
 * - Surface: Slate colors for glass backgrounds
 *
 * ## Usage Example
 *
 * ```tsx
 * import { DefaultLayout, GlassCard } from '@/lib/glass-components';
 *
 * export default function MyPage() {
 *   return (
 *     <DefaultLayout
 *       breadcrumbs={[
 *         { label: 'Home', href: '/', isHome: true },
 *         { label: 'Current Page' }
 *       ]}
 *       title="Page Title"
 *       useCard
 *     >
 *       <p>Page content goes here</p>
 *     </DefaultLayout>
 *   );
 * }
 * ```
 */

export { GlassSurface } from './GlassSurface';
export type { GlassSurfaceProps } from './GlassSurface';

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from './GlassCard';
export type {
  GlassCardProps,
  GlassCardHeaderProps,
  GlassCardTitleProps,
  GlassCardDescriptionProps,
  GlassCardContentProps,
  GlassCardFooterProps,
} from './GlassCard';

export { GlassNav } from './GlassNav';
export type { GlassNavProps } from './GlassNav';

export { GlassButton, GlassButtonLink } from './GlassButton';
export type { GlassButtonProps, GlassButtonLinkProps } from './GlassButton';

export { GlassLink } from './GlassLink';
export type { GlassLinkProps } from './GlassLink';

export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs';

export { DefaultLayout } from './DefaultLayout';
export type { DefaultLayoutProps } from './DefaultLayout';

export { default as GlassIncrementor } from './GlassIncrementor';
