import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SurfaceCard from '@/components/SurfaceCard';

interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

export default function FilterBar({ children, className }: FilterBarProps) {
  return (
    <SurfaceCard variant="muted" className={cn('section-rhythm', className)} padding="sm">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
    </SurfaceCard>
  );
}
