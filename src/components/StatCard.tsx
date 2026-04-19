import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import SurfaceCard from '@/components/SurfaceCard';

type StatTone = 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'rose';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  meta?: string;
  action?: ReactNode;
  className?: string;
}

const toneStyles: Record<StatTone, string> = {
  blue: 'bg-kpi-blue/12 text-kpi-blue',
  green: 'bg-kpi-green/12 text-kpi-green',
  orange: 'bg-kpi-orange/12 text-kpi-orange',
  purple: 'bg-kpi-purple/12 text-kpi-purple',
  teal: 'bg-kpi-teal/12 text-kpi-teal',
  rose: 'bg-kpi-red/12 text-kpi-red',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  tone = 'blue',
  meta,
  action,
  className,
}: StatCardProps) {
  return (
    <SurfaceCard className={cn('relative overflow-hidden', className)} padding="md" interactive>
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/5" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn('rounded-xl p-2.5', toneStyles[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative mt-5 space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-4xl font-semibold tracking-tight text-foreground">{value}</p>
        {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </SurfaceCard>
  );
}
