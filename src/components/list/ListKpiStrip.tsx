import type { ListPageKpi } from './types';
import KpiRow from '@/components/KpiRow';

interface ListKpiStripProps {
  items: ListPageKpi[];
  preset?: 'standard' | 'premium';
}

export default function ListKpiStrip({ items, preset = 'premium' }: ListKpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiRow
          key={item.id}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
          secondary={item.secondary}
          delta={item.delta}
          deltaTone={item.deltaTone}
          preset={preset}
        />
      ))}
    </div>
  );
}
