import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Factory,
  Gauge,
  PackageCheck,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import KpiRow from '@/components/KpiRow';
import ChartPanelHeader from '@/components/ChartPanelHeader';
import MetricSparkCard from '@/components/MetricSparkCard';
import CompactSelect from '@/components/CompactSelect';
import EmptyStatePanel from '@/components/EmptyStatePanel';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  buildDashboardSnapshot,
  fetchReportDataset,
  getFilterOptions,
  makeDefaultFilters,
  mapDatasetToRankedItems,
  mapSnapshotToMetricCards,
  mapSnapshotToTrendPanel,
  type DashboardSnapshot,
  type ReportDataset,
  type ReportFilters,
} from '@/modules/analytics';

const periodOptions = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function DashboardPage() {
  const [filters, setFilters] = useState<ReportFilters>(makeDefaultFilters());
  const [dataset, setDataset] = useState<ReportDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchReportDataset();
        if (!active) return;
        setDataset(data);
      } catch {
        if (!active) return;
        setDataset(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo(
    () => (dataset ? getFilterOptions(dataset) : { items: ['all'], batches: ['all'], parties: ['all'], statuses: ['all'] }),
    [dataset]
  );

  const snapshot: DashboardSnapshot | null = useMemo(() => {
    if (!dataset) return null;
    return buildDashboardSnapshot(dataset, filters);
  }, [dataset, filters]);

  const metricCards = useMemo(() => (snapshot ? mapSnapshotToMetricCards(snapshot) : []), [snapshot]);
  const trendPanel = useMemo(() => (snapshot ? mapSnapshotToTrendPanel(snapshot) : null), [snapshot]);
  const rankedItems = useMemo(() => (dataset ? mapDatasetToRankedItems(dataset) : []), [dataset]);

  const attentionRows = snapshot?.alerts.slice(0, 5) || [];
  const spotlightData = snapshot?.funnel.map((f) => ({ stage: f.label, value: f.count })) || [];

  return (
    <div className="min-w-0 space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Visual operations cockpit across procurement, production, quality, and sales."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <PanelCard
        className="bg-shell-surface-elevated/80"
        actions={(
          <div className="flex flex-wrap gap-2">
            <CompactSelect
              value={filters.itemName}
              onChange={(value) => setFilters((prev) => ({ ...prev, itemName: value }))}
              options={options.items.map((x) => ({ value: x, label: x === 'all' ? 'All Items' : x }))}
              className="w-36"
            />
            <CompactSelect
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              options={options.statuses.map((x) => ({ value: x, label: x === 'all' ? 'All Statuses' : x }))}
              className="w-36"
            />
            <CompactSelect
              value={period}
              onChange={setPeriod}
              options={periodOptions}
              className="w-28"
            />
          </div>
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card, idx) => (
            <MetricSparkCard
              key={card.id}
              model={card}
              icon={[Wallet, Boxes, ClipboardList, PackageCheck][idx] || Wallet}
            />
          ))}
        </div>
      </PanelCard>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard className="xl:col-span-2" bodyClassName="space-y-4">
          <ChartPanelHeader
            title="Revenue / Throughput"
            subtitle="Inventory movement vs dispatch quantity trend"
            controls={<CompactSelect value={period} onChange={setPeriod} options={periodOptions} className="w-28" />}
            stats={(
              <>
                <KpiRow label="Invoice Qty" value={(snapshot?.throughputTrend.reduce((s, p) => s + p.invoiceQty, 0) || 0).toLocaleString('en-IN')} icon={PackageCheck} tone="blue" />
                <KpiRow label="Movement Qty" value={(snapshot?.throughputTrend.reduce((s, p) => s + p.movementQty, 0) || 0).toLocaleString('en-IN')} icon={Gauge} tone="orange" />
              </>
            )}
          />
          <ChartContainer
            config={{
              primary: { label: 'Invoice Qty', color: 'hsl(var(--kpi-blue))' },
              secondary: { label: 'Movement Qty', color: 'hsl(var(--kpi-orange))' },
            }}
            className="h-72"
          >
            <LineChart data={(trendPanel?.points || []).map((point) => ({ label: point.label, primary: point.primary, secondary: point.secondary || 0 }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="primary" stroke="var(--color-primary)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="secondary" stroke="var(--color-secondary)" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </PanelCard>

        <PanelCard title="Quality Spotlight" subtitle="Critical checks and stage load" bodyClassName="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <KpiRow label="QA Pending" value={(snapshot?.kpis.qaPendingCount || 0).toLocaleString('en-IN')} icon={ClipboardList} tone="purple" />
            <KpiRow label="Blocked Batches" value={(snapshot?.kpis.blockedBatchCount || 0).toLocaleString('en-IN')} icon={ShieldAlert} tone="orange" />
            <KpiRow label="Open MRS" value={(snapshot?.kpis.openMrsCount || 0).toLocaleString('en-IN')} icon={Factory} tone="blue" />
          </div>
          <ChartContainer config={{ value: { label: 'Count', color: 'hsl(var(--kpi-purple))' } }} className="h-44">
            <BarChart data={spotlightData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} hide />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </PanelCard>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard title="Top Moving Items" subtitle="Highest movement volume in selected window">
          <div className="space-y-2">
            {rankedItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.metricLabel}</p>
                  <p className="text-base font-semibold">{item.metricValue}</p>
                </div>
              </div>
            ))}
            {!loading && rankedItems.length === 0 ? (
              <EmptyStatePanel icon={Boxes} title="No movement data" description="Top moving items will appear as stock movement records are created." />
            ) : null}
          </div>
        </PanelCard>

        <PanelCard title="Attention Queue" subtitle="Operational alerts and bottlenecks">
          <div className="space-y-2">
            {attentionRows.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                {alert.href ? <Link to={alert.href} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">Open</Link> : null}
              </div>
            ))}
            {!loading && attentionRows.length === 0 ? (
              <EmptyStatePanel icon={AlertTriangle} title="All clear" description="No major alerts currently in the filtered range." />
            ) : null}
          </div>
        </PanelCard>

        <PanelCard title="Workflow Funnel" subtitle="Stage-wise operational load">
          <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--kpi-teal))' } }} className="h-72">
            <BarChart data={(snapshot?.funnel || []).map((row) => ({ stage: row.label, count: row.count }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tickLine={false} axisLine={false} width={30} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </PanelCard>
      </div>

      <PanelCard title="Recent Critical Activity" subtitle="Latest high-impact movements, QA updates, and commercial events">
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(snapshot?.recentCriticalActivities || []).slice(0, 10).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="capitalize">{row.type}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.subtitle}</TableCell>
                  <TableCell className="text-right">{row.quantity?.toLocaleString('en-IN') || '-'}</TableCell>
                </TableRow>
              ))}
              {!loading && (!snapshot || snapshot.recentCriticalActivities.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No critical activity found</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </div>
  );
}
