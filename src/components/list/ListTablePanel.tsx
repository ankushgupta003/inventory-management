import type { ReactNode } from 'react';
import PanelCard from '@/components/PanelCard';
import { cn } from '@/lib/utils';
import type { ListVisualPreset } from './types';

interface ListTablePanelProps {
  title: string;
  description?: string;

  leftContent?: ReactNode;
  rightContent?: ReactNode;
  toolbar?: ReactNode;
  headerActions?: ReactNode;

  children: ReactNode;
  preset?: ListVisualPreset;
}

export default function ListTablePanel({
  title,
  description,
  leftContent,
  rightContent,
  toolbar,
  headerActions,
  children,
  preset = 'simple',
}: ListTablePanelProps) {
  const resolvedToolbar = toolbar ?? (
    leftContent ? (
      <div className="table-toolbar-inline w-full">
        {leftContent}
      </div>
    ) : null
  );
  const resolvedHeaderActions = headerActions ?? (
    rightContent ? (
      <div className="table-panel-header-actions">
        {rightContent}
      </div>
    ) : null
  );

  return (
    <PanelCard
      title={title}
      subtitle={description}
      actions={resolvedHeaderActions}
      className={cn(preset === 'premium' && 'list-table-shell')}
      bodyClassName="pt-4"
    >
      <div className="space-y-4">
        {resolvedToolbar ? (
          <div className="border-b border-border/70 pb-4">
            {resolvedToolbar}
          </div>
        ) : null}
        {children}
      </div>
    </PanelCard>
  );
}
