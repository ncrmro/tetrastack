import type * as React from 'react'

export {
  GlassCard as Card,
  GlassCardContent as CardContent,
  GlassCardDescription as CardDescription,
  GlassCardFooter as CardFooter,
  GlassCardHeader as CardHeader,
  GlassCardTitle as CardTitle,
} from '@/lib/glass-components/GlassCard'

// CardAction is a simple wrapper for action buttons/elements in the card header
export type CardActionProps = React.ComponentProps<'div'>

export function CardAction({ className, ...props }: CardActionProps) {
  return <div className={className} {...props} />
}
