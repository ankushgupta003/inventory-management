import type { LucideIcon } from 'lucide-react';
import StatCard from '@/components/StatCard';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string; // tailwind bg class e.g. "bg-kpi-blue"
  change?: string;
}

export default function KPICard({ title, value, icon: Icon, color }: KPICardProps) {
  const tone =
    color.includes('green') ? 'green' :
    color.includes('orange') ? 'orange' :
    color.includes('purple') ? 'purple' :
    color.includes('teal') ? 'teal' :
    color.includes('red') ? 'rose' : 'blue';

  return <StatCard title={title} value={value} icon={Icon} tone={tone} />;
}
