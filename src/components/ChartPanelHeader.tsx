import type { ReactNode } from 'react';

interface ChartPanelHeaderProps {
  title: string;
  subtitle?: string;
  controls?: ReactNode;
  stats?: ReactNode;
}

export default function ChartPanelHeader({ title, subtitle, controls, stats }: ChartPanelHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {controls}
      </div>
      {stats ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{stats}</div> : null}
    </div>
  );
}

