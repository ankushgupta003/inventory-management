import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ListVisualPreset } from '@/components/list';

interface KpiRowProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: 'blue' | 'green' | 'orange' | 'purple';
  secondary?: string;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
  preset?: ListVisualPreset;
}

const toneStyles = {
  blue: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  green: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  orange: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  purple: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200',
};

const deltaToneStyles = {
  positive: 'text-emerald-600',
  negative: 'text-rose-600',
  neutral: 'text-muted-foreground',
};

export default function KpiRow({
  label,
  value,
  icon: Icon,
  tone = 'blue',
  secondary,
  delta,
  deltaTone = 'neutral',
  preset = 'premium',
}: KpiRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-2xl border px-4 py-3.5 transition-all',
        preset === 'premium'
          ? 'list-kpi-card shadow-[var(--shadow-surface)]'
          : 'border-border/70 bg-muted/40'
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon ? (
          <span className={cn('grid h-9 w-9 shrink-0 place-content-center rounded-xl', toneStyles[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {secondary ? <p className="mt-0.5 truncate text-xs text-muted-foreground/90">{secondary}</p> : null}
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold leading-tight text-foreground">{value}</p>
        {delta ? <p className={cn('mt-1 text-xs font-semibold', deltaToneStyles[deltaTone])}>{delta}</p> : null}
      </div>
    </div>
  );
}
