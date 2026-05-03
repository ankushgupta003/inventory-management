import type { ReactNode } from 'react';
import { Download, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ListVisualPreset } from './types';

interface ListPageShellProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  addLabel?: string;
  onAdd?: () => void;
  onExport?: () => void;
  extraActions?: ReactNode;
  preset?: ListVisualPreset;
}

export default function ListPageShell({
  title,
  description,
  breadcrumbs,
  addLabel,
  onAdd,
  onExport,
  extraActions,
  preset = 'simple',
}: ListPageShellProps) {
  const hasActions = onExport || (onAdd && addLabel) || extraActions;

  return (
    <PageHeader
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      action={hasActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onExport ? (
            <Button
              variant="outline"
              className={cn(
                'rounded-lg px-3',
                preset === 'premium' && 'border-border/80 bg-card/90 shadow-[var(--shadow-surface)] hover:bg-muted/70'
              )}
              onClick={onExport}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          ) : null}
          {onAdd && addLabel ? (
            <Button
              className={cn(
                'rounded-lg px-3',
                preset === 'premium' && 'bg-gradient-to-r from-[#2d63ff] to-[#6f61ff] text-white shadow-[0_16px_28px_-18px_rgba(45,99,255,0.95)] hover:opacity-95'
              )}
              onClick={onAdd}
            >
              <Plus className="mr-2 h-4 w-4" /> {addLabel}
            </Button>
          ) : null}
          {extraActions}
        </div>
      ) : undefined}
    />
  );
}
