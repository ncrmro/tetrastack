import * as React from 'react';

export {
  GlassCard as Card,
  GlassCardHeader as CardHeader,
  GlassCardTitle as CardTitle,
  GlassCardDescription as CardDescription,
  GlassCardContent as CardContent,
  GlassCardFooter as CardFooter,
} from '@/lib/glass-components/GlassCard';

// CardAction is a simple wrapper for action buttons/elements in the card header
export type CardActionProps = React.ComponentProps<'div'>;

export function CardAction({ className, ...props }: CardActionProps) {
  return <div className={className} {...props} />;
}
