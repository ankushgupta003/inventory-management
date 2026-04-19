import type {
  DashboardSnapshot,
  MetricCardViewModel,
  RankedListItemViewModel,
  ReportDataset,
  TrendPanelViewModel,
} from './types';

const buildSpark = (base: number, variance: number) => {
  const seed = Math.max(10, Math.round(base / 8));
  return [
    seed,
    Math.max(5, seed - variance),
    seed + Math.round(variance / 2),
    Math.max(6, seed - Math.round(variance / 3)),
    seed + variance,
    seed + Math.round(variance / 1.5),
  ];
};

export const mapSnapshotToMetricCards = (snapshot: DashboardSnapshot): MetricCardViewModel[] => {
  const kpi = snapshot.kpis;
  return [
    {
      id: 'inventory',
      title: 'Inventory Value',
      value: `INR ${kpi.inventoryValue.toLocaleString('en-IN')}`,
      deltaLabel: '+2.4%',
      deltaPositive: true,
      tone: 'green',
      spark: buildSpark(Math.max(20, Math.round(kpi.inventoryValue / 5000)), 6),
    },
    {
      id: 'movements',
      title: 'Movement Throughput',
      value: kpi.availableStockQty.toLocaleString('en-IN'),
      deltaLabel: '+1.1%',
      deltaPositive: true,
      tone: 'orange',
      spark: buildSpark(Math.max(18, Math.round(kpi.availableStockQty / 100)), 5),
    },
    {
      id: 'qa',
      title: 'QA Pending',
      value: kpi.qaPendingCount.toLocaleString('en-IN'),
      deltaLabel: '-0.8%',
      deltaPositive: false,
      tone: 'purple',
      spark: buildSpark(Math.max(12, kpi.qaPendingCount * 2), 4),
    },
    {
      id: 'pi',
      title: 'Pending PI Qty',
      value: kpi.pendingPiQty.toLocaleString('en-IN'),
      deltaLabel: '+1.7%',
      deltaPositive: true,
      tone: 'blue',
      spark: buildSpark(Math.max(14, Math.round(kpi.pendingPiQty / 50)), 5),
    },
  ];
};

export const mapSnapshotToTrendPanel = (snapshot: DashboardSnapshot): TrendPanelViewModel => ({
  id: 'throughput',
  title: 'Revenue / Throughput',
  subtitle: 'Order flow and shipment trend',
  points: snapshot.throughputTrend.map((point) => ({
    label: point.day,
    primary: point.invoiceQty,
    secondary: point.movementQty,
  })),
  primaryLabel: 'Invoice Qty',
  secondaryLabel: 'Movement Qty',
});

export const mapDatasetToRankedItems = (dataset: ReportDataset): RankedListItemViewModel[] => {
  const usage = new Map<string, { qty: number; count: number }>();
  dataset.stockMovements.forEach((row) => {
    const prev = usage.get(row.itemName) || { qty: 0, count: 0 };
    usage.set(row.itemName, { qty: prev.qty + row.quantity, count: prev.count + 1 });
  });
  return Array.from(usage.entries())
    .map(([itemName, metrics]) => ({
      id: itemName,
      title: itemName,
      subtitle: `${metrics.count} movement record(s)`,
      metricLabel: 'Moved',
      metricValue: metrics.qty.toLocaleString('en-IN'),
      href: '/stock-movement',
    }))
    .sort((a, b) => Number(b.metricValue.replace(/,/g, '')) - Number(a.metricValue.replace(/,/g, '')))
    .slice(0, 6);
};

