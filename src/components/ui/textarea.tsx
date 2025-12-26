import React from 'react';
import { GlassSurface } from '@tetrastack/react-glass';
import { cn } from '@tetrastack/react-glass/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Glass intensity - defaults to 'strong' for heavy blur
   */
  intensity?: 'light' | 'medium' | 'strong';
}

/**
 * Textarea component with glass-morphism styling
 *
 * Wraps GlassSurface configured as a textarea element.
 *
 * @example
 * ```tsx
 * <Textarea
 *   placeholder="Enter description..."
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   rows={4}
 * />
 * ```
 */
export function Textarea({
  intensity = 'strong',
  className,
  ...props
}: TextareaProps) {
  return (
    <GlassSurface<'textarea'>
      as="textarea"
      intensity={intensity}
      bordered
      shadowed
      className={cn(
        'w-full px-4 py-2 rounded-lg',
        'text-on-surface placeholder:text-on-surface-variant',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'resize-vertical min-h-[80px]',
        className,
      )}
      {...props}
    />
  );
}
