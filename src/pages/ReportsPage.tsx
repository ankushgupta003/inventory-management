import { useEffect, useMemo, useState } from 'react';
import { Download, Printer, RotateCcw } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import CompactSelect from '@/components/CompactSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    void load();
    return () => {
      active = false;
    };
  }, []);

  const options = useMemo(
    () => (dataset ? getFilterOptions(dataset) : { items: ['all'], batches: ['all'], parties: ['all'], statuses: ['all'] }),
    [dataset],
  );
  const reportView = useMemo(() => (dataset ? buildReportView(dataset, filters) : null), [dataset, filters]);
  const snapshot = useMemo(() => (dataset ? buildDashboardSnapshot(dataset, filters) : null), [dataset, filters]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        description="Operational reports with simple summaries and export-ready tables."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <div className="simple-status-summary">
        <div className="table-toolbar">
          <div className="table-toolbar-filters">
            <CompactSelect value={filters.dateWindow} onChange={(value) => setFilters((prev) => ({ ...prev, dateWindow: value as ReportFilters['dateWindow'] }))} options={periodOptions} className="w-40" />
            <CompactSelect value={filters.itemName} onChange={(value) => setFilters((prev) => ({ ...prev, itemName: value }))} options={options.items.map((value) => ({ value, label: value === 'all' ? 'All Items' : value }))} className="w-40" />
            <CompactSelect value={filters.batchNo} onChange={(value) => setFilters((prev) => ({ ...prev, batchNo: value }))} options={options.batches.map((value) => ({ value, label: value === 'all' ? 'All Batches' : value }))} className="w-40" />
            <CompactSelect value={filters.partyName} onChange={(value) => setFilters((prev) => ({ ...prev, partyName: value }))} options={options.parties.map((value) => ({ value, label: value === 'all' ? 'All Parties' : value }))} className="w-40" />
            <CompactSelect value={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} options={options.statuses.map((value) => ({ value, label: value === 'all' ? 'All Statuses' : value }))} className="w-40" />
            {filters.dateWindow === 'custom' ? (
              <>
                <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} className="w-[150px]" />
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} className="w-[150px]" />
              </>
            ) : null}
          </div>
          <div className="table-toolbar-actions">
            <Button variant="outline" onClick={() => setFilters(makeDefaultFilters())}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print Summary
            </Button>
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

      <PanelCard
        title="Inventory Health"
        subtitle={`${reportView?.stockRows.length || 0} stock rows in the current view`}
        actions={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv('inventory-health.csv', [['Item', 'Batch', 'Qty', 'Value'], ...(reportView?.stockRows || []).map((row) => [row.itemName, row.batchNo, String(row.qty), String(row.value)])])}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        )}
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reportView?.stockRows || []).slice(0, 12).map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.itemName}</TableCell>
                  <TableCell>{row.batchNo}</TableCell>
                  <TableCell className="text-right">{row.qty.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-right">INR {row.value.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              {!loading && (reportView?.stockRows.length || 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No stock rows found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelCard
          title="Production and QA"
          subtitle={`${reportView?.qaRows.length || 0} QA rows, ${reportView?.openMrsRows.length || 0} open MRS rows`}
          actions={(
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv('production-qa.csv', [['Date', 'Item', 'Batch', 'Status'], ...(reportView?.qaRows || []).map((row) => [row.date, row.itemName, row.batchNo, row.status])])}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          )}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportView?.qaRows || []).slice(0, 10).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="font-medium">{row.itemName}</TableCell>
                    <TableCell>{row.batchNo}</TableCell>
                    <TableCell className="capitalize">{row.status.replace('_', ' ')}</TableCell>
                  </TableRow>
                ))}
                {!loading && (reportView?.qaRows.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No QA rows found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </PanelCard>

        <PanelCard
          title="Sales Fulfillment"
          subtitle={`${reportView?.invoiceRows.length || 0} invoice rows, ${reportView?.piRows.length || 0} PI rows`}
          actions={(
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv('sales-fulfillment.csv', [['PI No', 'Customer', 'Status'], ...(reportView?.piRows || []).map((row) => [row.piNo, row.customerName, row.status])])}
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          )}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice / PI</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportView?.invoiceRows || []).slice(0, 10).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.invoiceNo}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell className="text-right">INR {(row.totalAmount || 0).toLocaleString('en-IN')}</TableCell>
                    <TableCell>Completed</TableCell>
                  </TableRow>
                ))}
                {!loading && (reportView?.invoiceRows.length || 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No invoice rows found.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Movement Analysis"
        subtitle={`${reportView?.movementRows.length || 0} movement rows in the current view`}
        actions={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv('movement-analysis.csv', [['Movement No', 'Type', 'Item', 'Qty'], ...(reportView?.movementRows || []).map((row) => [row.movementNo, row.type, row.itemName, String(row.quantity)])])}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        )}
      >
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Movement No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(reportView?.movementRows || []).slice(0, 12).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="font-medium">{row.movementNo}</TableCell>
                  <TableCell className="capitalize">{row.type}</TableCell>
                  <TableCell>{row.itemName}</TableCell>
                  <TableCell className="text-right">{row.quantity.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              {!loading && (reportView?.movementRows.length || 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No movement rows found.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </PanelCard>

      {loading ? (
        <PanelCard>
          <div className="py-6 text-center text-sm text-muted-foreground">Loading report datasets...</div>
        </PanelCard>
      ) : null}

      {!loading && error ? (
        <PanelCard>
          <div className="py-4 text-center text-sm text-destructive">{error}</div>
        </PanelCard>
      ) : null}
    </div>
  );
}
