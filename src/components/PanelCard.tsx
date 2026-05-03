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
    <section className={cn('rounded-xl border border-border bg-card', className)}>
      {(title || actions) && (
        <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? <h3 className="text-base font-semibold text-foreground">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="min-w-0 shrink-0">{actions}</div> : null}
        </header>
      )}
      <div className={cn('px-4 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
