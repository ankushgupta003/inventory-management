import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SurfaceCardVariant = 'default' | 'muted' | 'accent';
type SurfaceCardPadding = 'none' | 'sm' | 'md' | 'lg';

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
  variant?: SurfaceCardVariant;
  padding?: SurfaceCardPadding;
  interactive?: boolean;
}

const variantStyles: Record<SurfaceCardVariant, string> = {
  default: 'bg-card border-border',
  muted: 'bg-shell-surface-muted border-border',
  accent: 'bg-shell-surface-elevated border-border',
};

const paddingStyles: Record<SurfaceCardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function SurfaceCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  interactive = false,
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border',
        variantStyles[variant],
        paddingStyles[padding],
        interactive && 'transition-colors duration-200 hover:border-primary/40 hover:bg-muted/10',
        className,
      )}
    >
      {children}
    </div>
  );
}
