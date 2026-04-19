import type { ReactNode } from 'react';
import PanelCard from '@/components/PanelCard';
import { cn } from '@/lib/utils';
import type { ListVisualPreset } from './types';

interface ListTablePanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  preset?: ListVisualPreset;
}

export default function ListTablePanel({
  title,
  description,
  actions,
  children,
  preset = 'premium',
}: ListTablePanelProps) {
  return (
    <PanelCard
      title={title}
      subtitle={description}
      actions={actions}
      className={cn(preset === 'premium' && 'list-table-shell')}
      bodyClassName={cn('pt-3', preset === 'premium' && 'pt-4')}
    >
      {children}
    </PanelCard>
  );
}
