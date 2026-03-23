import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // tailwind bg class e.g. "bg-kpi-blue"
  change?: string;
}

export default function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  return (
    <div className="bg-card rounded-lg border p-5 flex items-start gap-4 animate-fade-in">
      <div className={cn('p-2.5 rounded-lg text-primary-foreground', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
