import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import CompactSelect from '@/components/CompactSelect';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  buildDashboardSnapshot,
  fetchReportDataset,
  getFilterOptions,
  makeDefaultFilters,
  mapDatasetToRankedItems,
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
    void load();
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo(
    () => (dataset ? getFilterOptions(dataset) : { items: ['all'], batches: ['all'], parties: ['all'], statuses: ['all'] }),
    [dataset],
  );

  const snapshot: DashboardSnapshot | null = useMemo(() => {
    if (!dataset) return null;
    return buildDashboardSnapshot(dataset, filters);
  }, [dataset, filters]);

  const rankedItems = useMemo(() => (dataset ? mapDatasetToRankedItems(dataset) : []), [dataset]);
  const attentionRows = snapshot?.alerts.slice(0, 6) || [];
  const recentActivity = snapshot?.recentCriticalActivities.slice(0, 10) || [];
  const throughputSummary = useMemo(() => ({
    invoiceQty: snapshot?.throughputTrend.reduce((sum, point) => sum + point.invoiceQty, 0) || 0,
    movementQty: snapshot?.throughputTrend.reduce((sum, point) => sum + point.movementQty, 0) || 0,
  }), [snapshot]);

  return (
    <div className="min-w-0 space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Daily operations summary across inventory, production, quality, and dispatch."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="simple-status-summary">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <CompactSelect
              value={filters.itemName}
              onChange={(value) => setFilters((prev) => ({ ...prev, itemName: value }))}
              options={options.items.map((value) => ({ value, label: value === 'all' ? 'All Items' : value }))}
              className="w-40"
            />
            <CompactSelect
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              options={options.statuses.map((value) => ({ value, label: value === 'all' ? 'All Statuses' : value }))}
              className="w-40"
            />
            <CompactSelect value={period} onChange={setPeriod} options={periodOptions} className="w-32" />
          </div>
          <div className="table-toolbar-actions">
            <Button variant="outline" onClick={() => setFilters(makeDefaultFilters())}>Reset Filters</Button>
          </div>
        </div>
      </div>

      <div className="simple-status-grid">
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Inventory Value</div>
          <div className="mt-2 text-2xl font-semibold">INR {(snapshot?.kpis.inventoryValue || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Open MRS</div>
          <div className="mt-2 text-2xl font-semibold">{(snapshot?.kpis.openMrsCount || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">QA Pending</div>
          <div className="mt-2 text-2xl font-semibold">{(snapshot?.kpis.qaPendingCount || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Pending PI Qty</div>
          <div className="mt-2 text-2xl font-semibold">{(snapshot?.kpis.pendingPiQty || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="What Needs Attention" subtitle="Use this list to decide the next action.">
          <div className="space-y-3">
            {attentionRows.length ? attentionRows.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                {alert.href ? (
                  <Link to={alert.href} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                    Open record
                  </Link>
                ) : null}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">{loading ? 'Loading alerts...' : 'No major alerts in the selected view.'}</p>
            )}
          </div>
        </PanelCard>

        <PanelCard title="Throughput Summary" subtitle="Quick quantity view for the selected window.">
          <div className="space-y-3">
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Invoice Qty</div>
              <div className="mt-2 text-2xl font-semibold">{throughputSummary.invoiceQty.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Movement Qty</div>
              <div className="mt-2 text-2xl font-semibold">{throughputSummary.movementQty.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-lg border border-border px-3 py-3">
              <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Blocked Batches</div>
              <div className="mt-2 text-2xl font-semibold">{(snapshot?.kpis.blockedBatchCount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard title="Top Moving Items" subtitle="Highest movement volume in the selected view.">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedItems.slice(0, 8).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.subtitle}</TableCell>
                    <TableCell className="text-right">{item.metricValue}</TableCell>
                  </TableRow>
                ))}
                {!loading && rankedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">No movement data found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </PanelCard>

        <PanelCard title="Workflow Summary" subtitle="Current record count at each major stage.">
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(snapshot?.funnel || []).map((row) => (
                  <TableRow key={row.stage}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right">{row.count.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
                {!loading && (!snapshot || snapshot.funnel.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">No workflow data available.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Recent Critical Activity" subtitle="Latest movements, quality actions, and commercial events.">
        <div className="overflow-x-auto rounded-lg border border-border">
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
              {recentActivity.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="capitalize">{row.type}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.subtitle}</TableCell>
                  <TableCell className="text-right">{row.quantity?.toLocaleString('en-IN') || '-'}</TableCell>
                </TableRow>
              ))}
              {!loading && recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No critical activity found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </PanelCard>
    </div>
  );
}
