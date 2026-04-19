import type { ReactNode } from 'react';
import PanelCard from '@/components/PanelCard';
import { cn } from '@/lib/utils';
import type { ListVisualPreset } from './types';

interface ListFilterBarProps {
  title?: string;
  children: ReactNode;
  preset?: ListVisualPreset;
}

export default function ListFilterBar({ title = 'Filters', children, preset = 'premium' }: ListFilterBarProps) {
  return (
    <PanelCard
      title={title}
      className={cn(preset === 'premium' && 'list-filter-shell')}
      bodyClassName={cn('pt-3', preset === 'premium' && 'border-t border-border/70')}
    >
      <div className={cn('flex flex-wrap items-end gap-3', preset === 'premium' && 'list-filter-grid')}>{children}</div>
    </PanelCard>
  );
}
