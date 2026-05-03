import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Download, Filter, Printer } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import KpiRow from '@/components/KpiRow';
import ChartPanelHeader from '@/components/ChartPanelHeader';
import CompactSelect from '@/components/CompactSelect';
import EmptyStatePanel from '@/components/EmptyStatePanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  buildDashboardSnapshot,
  buildReportView,
  fetchReportDataset,
  getFilterOptions,
  makeDefaultFilters,
  type ReportDataset,
  type ReportFilters,
} from '@/modules/analytics';

const exportCsv = (fileName: string, rows: string[][]) => {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState<ReportFilters>(makeDefaultFilters());
  const [dataset, setDataset] = useState<ReportDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchReportDataset();
        if (!active) return;
        setDataset(data);
        setError('');
      } catch {
        if (!active) return;
        setDataset(null);
        setError('Unable to load live reporting data right now.');
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
  const reportView = useMemo(() => (dataset ? buildReportView(dataset, filters) : null), [dataset, filters]);
  const snapshot = useMemo(() => (dataset ? buildDashboardSnapshot(dataset, filters) : null), [dataset, filters]);

  const movementByType = useMemo(() => {
    const rows = reportView?.movementRows || [];
    const byType = new Map<string, number>();
    rows.forEach((row) => byType.set(row.type, (byType.get(row.type) || 0) + row.quantity));
    return Array.from(byType.entries()).map(([type, qty]) => ({ type, qty }));
  }, [reportView]);

  const piDistribution = useMemo(() => {
    const rows = reportView?.piRows || [];
    const map = new Map<string, number>();
    rows.forEach((row) => map.set(row.status, (map.get(row.status) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [reportView]);

  const qualityFlowTrend = useMemo(() => {
    const map = new Map<string, { qa: number; mrs: number }>();

    (reportView?.qaRows || []).forEach((row) => {
      const current = map.get(row.date) || { qa: 0, mrs: 0 };
      current.qa += 1;
      map.set(row.date, current);
    });

    (reportView?.openMrsRows || []).forEach((row) => {
      const current = map.get(row.date) || { qa: 0, mrs: 0 };
      current.mrs += 1;
      map.set(row.date, current);
    });

    return Array.from(map.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, counts]) => ({
        date,
        label: date.slice(5),
        qa: counts.qa,
        mrs: counts.mrs,
      }))
      .slice(-10);
  }, [reportView]);

  const salesTrend = useMemo(() => {
    const map = new Map<string, { amount: number }>();

    (reportView?.invoiceRows || []).forEach((row) => {
      const current = map.get(row.date) || { amount: 0 };
      current.amount += row.totalAmount || 0;
      map.set(row.date, current);
    });

    return Array.from(map.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, metrics]) => ({
        date,
        label: date.slice(5),
        amount: metrics.amount,
      }))
      .slice(-10);
  }, [reportView]);

  const stockHighlights = useMemo(
    () => [...(reportView?.stockRows || [])].sort((left, right) => right.qty - left.qty).slice(0, 5),
    [reportView]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        description="KPI-first analytics for inventory, production, QA, and sales."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <PanelCard
        className="bg-shell-surface-elevated/80"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilters(makeDefaultFilters())}>Reset</Button>
          </div>
        )}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="h-4 w-4" />
          Global Filters
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <CompactSelect value={filters.dateWindow} onChange={(value) => setFilters((prev) => ({ ...prev, dateWindow: value as ReportFilters['dateWindow'] }))} options={periodOptions} />
          <CompactSelect value={filters.itemName} onChange={(value) => setFilters((prev) => ({ ...prev, itemName: value }))} options={options.items.map((x) => ({ value: x, label: x === 'all' ? 'All Items' : x }))} />
          <CompactSelect value={filters.batchNo} onChange={(value) => setFilters((prev) => ({ ...prev, batchNo: value }))} options={options.batches.map((x) => ({ value: x, label: x === 'all' ? 'All Batches' : x }))} />
          <CompactSelect value={filters.partyName} onChange={(value) => setFilters((prev) => ({ ...prev, partyName: value }))} options={options.parties.map((x) => ({ value: x, label: x === 'all' ? 'All Parties' : x }))} />
          <CompactSelect value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={options.statuses.map((x) => ({ value: x, label: x === 'all' ? 'All Statuses' : x }))} />
        </div>
        {filters.dateWindow === 'custom' && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
            <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
          </div>
        )}
      </PanelCard>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start gap-1 overflow-x-auto flex-nowrap rounded-xl bg-muted p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Health</TabsTrigger>
          <TabsTrigger value="production">Production & QA</TabsTrigger>
          <TabsTrigger value="sales">Sales Fulfillment</TabsTrigger>
          <TabsTrigger value="movement">Movement Analysis</TabsTrigger>
          <TabsTrigger value="print">Print Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiRow label="Inventory Value" value={`INR ${(snapshot?.kpis.inventoryValue || 0).toLocaleString('en-IN')}`} />
            <KpiRow label="Open MRS" value={(snapshot?.kpis.openMrsCount || 0).toLocaleString('en-IN')} />
            <KpiRow label="QA Pending" value={(snapshot?.kpis.qaPendingCount || 0).toLocaleString('en-IN')} />
            <KpiRow label="Pending PI Qty" value={(snapshot?.kpis.pendingPiQty || 0).toLocaleString('en-IN')} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <PanelCard className="xl:col-span-2" bodyClassName="space-y-4">
              <ChartPanelHeader
                title="Workflow Funnel"
                controls={<Button variant="outline" size="sm" onClick={() => exportCsv('workflow-funnel.csv', [['Stage', 'Count'], ...(snapshot?.funnel || []).map((f) => [f.label, String(f.count)])])}><Download className="mr-1 h-3.5 w-3.5" />Export CSV</Button>}
              />
              <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--kpi-blue))' } }} className="h-64">
                <BarChart data={(snapshot?.funnel || []).map((row) => ({ label: row.label, count: row.count }))}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={34} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </PanelCard>
            <PanelCard title="Bottleneck Summary">
              <div className="space-y-2">
                {(snapshot?.alerts || []).slice(0, 6).map((a) => (
                  <div key={a.id} className="rounded-xl border border-border/70 px-3 py-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                ))}
                {!loading && (snapshot?.alerts.length || 0) === 0 ? <EmptyStatePanel icon={Filter} title="No bottlenecks" description="No critical bottlenecks in current filters." /> : null}
              </div>
            </PanelCard>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiRow label="Stock Rows" value={(reportView?.stockRows.length || 0).toLocaleString('en-IN')} />
            <KpiRow label="Expired" value={(reportView?.expiryBuckets.expired || 0).toLocaleString('en-IN')} />
            <KpiRow label="Expiring 30d" value={(reportView?.expiryBuckets.expiring30 || 0).toLocaleString('en-IN')} />
            <KpiRow label="Safe" value={(reportView?.expiryBuckets.safe || 0).toLocaleString('en-IN')} />
          </div>
          <PanelCard bodyClassName="space-y-4">
            <ChartPanelHeader title="Expiry Distribution" controls={<Button variant="outline" size="sm" onClick={() => exportCsv('inventory-health.csv', [['Item', 'Batch', 'Qty', 'Value'], ...(reportView?.stockRows || []).map((r) => [r.itemName, r.batchNo, String(r.qty), String(r.value)])])}><Download className="mr-1 h-3.5 w-3.5" />Export CSV</Button>} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ChartContainer config={{ count: { label: 'Count', color: 'hsl(var(--kpi-orange))' } }} className="h-56">
                  <BarChart data={[
                    { bucket: 'Expired', count: reportView?.expiryBuckets.expired || 0 },
                    { bucket: '0-30 Days', count: reportView?.expiryBuckets.expiring30 || 0 },
                    { bucket: '31-90 Days', count: reportView?.expiryBuckets.expiring90 || 0 },
                    { bucket: 'Safe', count: reportView?.expiryBuckets.safe || 0 },
                  ]}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="bucket" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={34} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
              <div className="space-y-2">
                {stockHighlights.map((row) => (
                  <div key={row.key} className="rounded-xl border border-border/70 px-3 py-2">
                    <p className="text-sm font-semibold">{row.itemName}</p>
                    <p className="text-xs text-muted-foreground">{row.batchNo}</p>
                    <p className="mt-1 text-sm font-semibold">Qty {row.qty.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          </PanelCard>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiRow label="Open MRS" value={(reportView?.openMrsRows.length || 0).toLocaleString('en-IN')} />
            <KpiRow label="QA Requests" value={(reportView?.qaRows.length || 0).toLocaleString('en-IN')} />
            <KpiRow label="Blocked Batches" value={(snapshot?.kpis.blockedBatchCount || 0).toLocaleString('en-IN')} />
            <KpiRow label="Production Batches" value={((snapshot?.funnel.find((row) => row.stage === 'production')?.count) || 0).toLocaleString('en-IN')} />
          </div>
          <PanelCard bodyClassName="space-y-4">
            <ChartPanelHeader title="Batch and QA Flow" />
            <ChartContainer
              config={{
                qa: { label: 'QA Requests', color: 'hsl(var(--kpi-purple))' },
                mrs: { label: 'Open MRS', color: 'hsl(var(--kpi-blue))' },
              }}
              className="h-56"
            >
              <LineChart data={qualityFlowTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="qa" stroke="var(--color-qa)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="mrs" stroke="var(--color-mrs)" strokeWidth={3} dot={false} />
              </LineChart>
            </ChartContainer>
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Batch</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(reportView?.qaRows || []).slice(0, 12).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.batchNo}</TableCell>
                      <TableCell className="capitalize">{row.status.replace('_', ' ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PanelCard>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiRow label="Invoice Amount" value={`INR ${(reportView?.totalInvoiceAmount || 0).toLocaleString('en-IN')}`} />
            <KpiRow label="Pending PI Qty" value={(reportView?.totalPendingPiQty || 0).toLocaleString('en-IN')} />
            <KpiRow label="PI Records" value={(reportView?.piRows.length || 0).toLocaleString('en-IN')} />
            <KpiRow label="Invoice Records" value={(reportView?.invoiceRows.length || 0).toLocaleString('en-IN')} />
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <PanelCard className="xl:col-span-2" bodyClassName="space-y-4">
              <ChartPanelHeader title="Sales Fulfillment Trend" controls={<Button variant="outline" size="sm" onClick={() => exportCsv('sales-fulfillment.csv', [['PI No', 'Customer', 'Status'], ...(reportView?.piRows || []).map((row) => [row.piNo, row.customerName, row.status])])}><Download className="mr-1 h-3.5 w-3.5" />Export CSV</Button>} />
              <ChartContainer config={{ amount: { label: 'Amount', color: 'hsl(var(--kpi-green))' } }} className="h-56">
                <BarChart data={salesTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={36} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </PanelCard>
            <PanelCard title="PI Status Mix">
              <ChartContainer config={{ value: { label: 'Count', color: 'hsl(var(--kpi-purple))' } }} className="h-56">
                <PieChart>
                  <Pie data={piDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} fill="hsl(var(--kpi-purple))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </PanelCard>
          </div>
        </TabsContent>

        <TabsContent value="movement" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <KpiRow label="Total Movement Qty" value={(reportView?.totalMovementQty || 0).toLocaleString('en-IN')} />
            <KpiRow label="Issue Records" value={(reportView?.movementRows.filter((x) => x.type === 'issue').length || 0).toLocaleString('en-IN')} />
            <KpiRow label="Sampling Records" value={(reportView?.movementRows.filter((x) => x.type === 'sampling').length || 0).toLocaleString('en-IN')} />
            <KpiRow label="Transfer Records" value={(reportView?.movementRows.filter((x) => x.type === 'transfer').length || 0).toLocaleString('en-IN')} />
          </div>
          <PanelCard bodyClassName="space-y-4">
            <ChartPanelHeader title="Movement Pattern and Exceptions" controls={<Button variant="outline" size="sm" onClick={() => exportCsv('movement-analysis.csv', [['Movement No', 'Type', 'Item', 'Qty'], ...(reportView?.movementRows || []).map((row) => [row.movementNo, row.type, row.itemName, String(row.quantity)])])}><Download className="mr-1 h-3.5 w-3.5" />Export CSV</Button>} />
            <ChartContainer config={{ qty: { label: 'Qty', color: 'hsl(var(--kpi-orange))' } }} className="h-56">
              <BarChart data={movementByType}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="type" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="qty" fill="var(--color-qty)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Movement</TableHead><TableHead>Type</TableHead><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(reportView?.movementRows || []).slice(0, 12).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.movementNo}</TableCell>
                      <TableCell className="capitalize">{row.type}</TableCell>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell className="text-right">{row.quantity.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PanelCard>
        </TabsContent>

        <TabsContent value="print" className="space-y-4">
          <PanelCard title="Print Summary" subtitle="Lightweight KPI summary for reviews">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <KpiRow label="Inventory Value" value={`INR ${(snapshot?.kpis.inventoryValue || 0).toLocaleString('en-IN')}`} />
              <KpiRow label="QA Pending" value={(snapshot?.kpis.qaPendingCount || 0).toLocaleString('en-IN')} />
              <KpiRow label="Pending PI Qty" value={(snapshot?.kpis.pendingPiQty || 0).toLocaleString('en-IN')} />
            </div>
            <div className="mt-4 flex gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}><Printer className="mr-1 h-3.5 w-3.5" />Print Summary</Button>
              <Button variant="outline" onClick={() => exportCsv('print-summary.csv', [['Metric', 'Value'], ['Inventory Value', String(snapshot?.kpis.inventoryValue || 0)], ['QA Pending', String(snapshot?.kpis.qaPendingCount || 0)], ['Pending PI Qty', String(snapshot?.kpis.pendingPiQty || 0)]])}><Download className="mr-1 h-3.5 w-3.5" />Export CSV</Button>
            </div>
          </PanelCard>
        </TabsContent>
      </Tabs>

      {loading && (
        <PanelCard>
          <div className="py-6 text-center text-sm text-muted-foreground">Loading report datasets...</div>
        </PanelCard>
      )}

      {!loading && error && (
        <PanelCard>
          <div className="py-4 text-center text-sm text-destructive">{error}</div>
        </PanelCard>
      )}
    </div>
  );
}
