import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SurfaceCard from '@/components/SurfaceCard';

interface FormSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function FormSection({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <SurfaceCard className={cn('section-rhythm', className)} padding="none">
      <div className="flex flex-col gap-2 border-b border-border/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className={cn('space-y-4 p-5', contentClassName)}>
        {children}
      </div>
    </SurfaceCard>
  );
}
