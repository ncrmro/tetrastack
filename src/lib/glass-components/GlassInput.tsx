import React from 'react';
import { cn } from './utils';
import { GlassSurface } from './GlassSurface';

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Glass intensity - defaults to 'strong' for heavy blur
   */
  intensity?: 'light' | 'medium' | 'strong';
}

/**
 * GlassInput component with glass-morphism styling
 *
 * Features:
 * - Heavy glass effect with backdrop blur
 * - Semi-transparent background with theme colors
 * - Focus states with ring
 * - Accessible with proper ARIA support
 *
 * @example
 * ```tsx
 * <GlassInput
 *   type="text"
 *   placeholder="Search..."
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 * />
 * ```
 */
export function GlassInput({
  intensity = 'strong',
  className,
  ...props
}: GlassInputProps) {
  return (
    <GlassSurface<'input'>
      as="input"
      intensity={intensity}
      bordered
      shadowed
      className={cn(
        'w-full px-4 py-2 rounded-lg',
        'text-on-surface placeholder:text-on-surface-variant',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}
