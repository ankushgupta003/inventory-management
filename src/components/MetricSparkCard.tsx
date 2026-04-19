import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { MetricCardViewModel } from '@/modules/analytics';

interface MetricSparkCardProps {
  model: MetricCardViewModel;
  icon: LucideIcon;
}

const toneStyles = {
  blue: {
    chip: 'bg-blue-100 text-blue-700',
    area: '#2563eb',
    fill: 'rgba(37,99,235,0.18)',
  },
  green: {
    chip: 'bg-emerald-100 text-emerald-700',
    area: '#10b981',
    fill: 'rgba(16,185,129,0.18)',
  },
  orange: {
    chip: 'bg-orange-100 text-orange-700',
    area: '#f97316',
    fill: 'rgba(249,115,22,0.2)',
  },
  purple: {
    chip: 'bg-violet-100 text-violet-700',
    area: '#8b5cf6',
    fill: 'rgba(139,92,246,0.2)',
  },
};

export default function MetricSparkCard({ model, icon: Icon }: MetricSparkCardProps) {
  const tone = toneStyles[model.tone];
  const chartData = model.spark.map((value, idx) => ({ idx, value }));

  return (
    <article className="rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-start justify-between gap-2">
        <span className={cn('grid h-11 w-11 place-content-center rounded-xl', tone.chip)}>
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            model.deltaPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          )}
        >
          {model.deltaPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {model.deltaLabel}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{model.title}</p>
      <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">{model.value}</p>
      <div className="mt-3 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area type="monotone" dataKey="value" stroke={tone.area} fill={tone.fill} strokeWidth={2.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

