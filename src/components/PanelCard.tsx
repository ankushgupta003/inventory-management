import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function PanelCard({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: PanelCardProps) {
  return (
    <section className={cn('rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-surface)]', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            {title ? <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
