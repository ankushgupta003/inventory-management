
import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import PageHeader from '@/components/PageHeader';
import api, { USE_MOCK } from '@/services/api';

const useMock = USE_MOCK || import.meta.env.DEV;
const pageSize = 10;
const COMPANY_NAME = 'Inventory Management Co.';

type StockSummaryRow = { itemName: string; totalQty: number; totalValue: number; unit: string };
type BatchRow = { itemName: string; batchNo: string; mfgDate: string; expiryDate: string; availableQty: number; rate: number; value: number };
type LedgerRow = { date: string; type: string; reference: string; itemName: string; batchNo: string; inQty: number; outQty: number; balance: number };
type PurchaseRow = { date: string; vendor: string; itemName: string; batchNo: string; qtyAccepted: number; rate: number; value: number };
type IssueRow = { date: string; type: string; itemName: string; batchNo: string; qty: number };
type SalesRow = { date: string; customer: string; invoiceNo: string; itemName: string; batchNo: string; qty: number; amount: number };
type PIStatusRow = { piNo: string; customer: string; itemName: string; orderedQty: number; invoicedQty: number; remainingQty: number; status: string };

const mockStockSummary: StockSummaryRow[] = [
  { itemName: 'Steel Rod 10mm', totalQty: 520, totalValue: 286000, unit: 'kg' },
  { itemName: 'Copper Wire 2mm', totalQty: 180, totalValue: 147600, unit: 'kg' },
  { itemName: 'Motor Assembly A1', totalQty: 120, totalValue: 540000, unit: 'pcs' },
];

const mockBatch: BatchRow[] = [
  { itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', mfgDate: '2026-01-15', expiryDate: '2028-01-15', availableQty: 320, rate: 55, value: 17600 },
  { itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', mfgDate: '2026-02-10', expiryDate: '2027-04-25', availableQty: 180, rate: 82, value: 14760 },
  { itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', mfgDate: '2026-04-01', expiryDate: '2028-04-01', availableQty: 120, rate: 4500, value: 540000 },
];

const mockLedger: LedgerRow[] = [
  { date: '2026-04-01', type: 'GIN', reference: 'GIN-001', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', inQty: 500, outQty: 0, balance: 500 },
  { date: '2026-04-03', type: 'Issue', reference: 'ISS-240403-112', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', inQty: 0, outQty: 80, balance: 420 },
  { date: '2026-04-04', type: 'Invoice', reference: 'INV-240404-502', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', inQty: 0, outQty: 40, balance: 80 },
];

const mockPurchase: PurchaseRow[] = [
  { date: '2026-04-01', vendor: 'ABC Steel Suppliers', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', qtyAccepted: 480, rate: 55, value: 26400 },
  { date: '2026-04-02', vendor: 'CopperWorks India', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', qtyAccepted: 200, rate: 82, value: 16400 },
];

const mockIssue: IssueRow[] = [
  { date: '2026-04-03', type: 'Production', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', qty: 80 },
  { date: '2026-04-03', type: 'Damage', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', qty: 5 },
];

const mockSales: SalesRow[] = [
  { date: '2026-04-03', customer: 'XYZ Industries', invoiceNo: 'INV-240403-501', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', qty: 40, amount: 212400 },
  { date: '2026-04-04', customer: 'PQR Trading Co.', invoiceNo: 'INV-240404-502', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', qty: 20, amount: 193520 },
];

const mockPIStatus: PIStatusRow[] = [
  { piNo: 'PI-240401-101', customer: 'XYZ Industries', itemName: 'Motor Assembly A1', orderedQty: 50, invoicedQty: 40, remainingQty: 10, status: 'partial' },
  { piNo: 'PI-240402-114', customer: 'PQR Trading Co.', itemName: 'Gear Box GB-200', orderedQty: 20, invoicedQty: 20, remainingQty: 0, status: 'completed' },
];
function isExpired(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isExpiringSoon(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  const diff = d.getTime() - today.getTime();
  return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

function paginate<T>(rows: T[], page: number) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function PageControls({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}

function ReportHeader({ title, filters }: { title: string; filters: string[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 print:border-0 print:bg-transparent">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">Generated on {new Date().toLocaleDateString('en-IN')}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground print:text-black">
          <div className="font-semibold">{COMPANY_NAME}</div>
          <div>Report</div>
        </div>
      </div>
      {filters.length > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Filters:</span> {filters.join(' | ')}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('stock-summary');

  const [stockSummary, setStockSummary] = useState<StockSummaryRow[]>([]);
  const [batchReport, setBatchReport] = useState<BatchRow[]>([]);
  const [ledgerReport, setLedgerReport] = useState<LedgerRow[]>([]);
  const [purchaseReport, setPurchaseReport] = useState<PurchaseRow[]>([]);
  const [issueReport, setIssueReport] = useState<IssueRow[]>([]);
  const [salesReport, setSalesReport] = useState<SalesRow[]>([]);
  const [piReport, setPiReport] = useState<PIStatusRow[]>([]);

  const [searchStock, setSearchStock] = useState('');
  const [stockSort, setStockSort] = useState<'qty' | 'value'>('qty');

  const [batchItem, setBatchItem] = useState('all');

  const [ledgerItem, setLedgerItem] = useState('all');
  const [ledgerBatch, setLedgerBatch] = useState('all');
  const [ledgerFrom, setLedgerFrom] = useState('');
  const [ledgerTo, setLedgerTo] = useState('');

  const [purchaseVendor, setPurchaseVendor] = useState('all');
  const [purchaseFrom, setPurchaseFrom] = useState('');
  const [purchaseTo, setPurchaseTo] = useState('');

  const [issueType, setIssueType] = useState('all');
  const [issueFrom, setIssueFrom] = useState('');
  const [issueTo, setIssueTo] = useState('');

  const [salesCustomer, setSalesCustomer] = useState('all');
  const [salesFrom, setSalesFrom] = useState('');
  const [salesTo, setSalesTo] = useState('');

  const [piStatus, setPiStatus] = useState('all');
  const [piCustomer, setPiCustomer] = useState('all');

  const [stockPage, setStockPage] = useState(1);
  const [batchPage, setBatchPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [purchasePage, setPurchasePage] = useState(1);
  const [issuePage, setIssuePage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [piPage, setPiPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (useMock) {
        setStockSummary(mockStockSummary);
        setBatchReport(mockBatch);
        setLedgerReport(mockLedger);
        setPurchaseReport(mockPurchase);
        setIssueReport(mockIssue);
        setSalesReport(mockSales);
        setPiReport(mockPIStatus);
        return;
      }
      try {
        const [stock, batch, ledger, purchase, issue, sales, pi] = await Promise.all([
          api.get<StockSummaryRow[]>('/reports/stock-summary').then((r) => r.data),
          api.get<BatchRow[]>('/reports/batch').then((r) => r.data),
          api.get<LedgerRow[]>('/reports/ledger').then((r) => r.data),
          api.get<PurchaseRow[]>('/reports/purchase').then((r) => r.data),
          api.get<IssueRow[]>('/reports/issue').then((r) => r.data),
          api.get<SalesRow[]>('/reports/sales').then((r) => r.data),
          api.get<PIStatusRow[]>('/reports/pi').then((r) => r.data),
        ]);
        if (!active) return;
        setStockSummary(stock);
        setBatchReport(batch);
        setLedgerReport(ledger);
        setPurchaseReport(purchase);
        setIssueReport(issue);
        setSalesReport(sales);
        setPiReport(pi);
      } catch {
        if (!active) return;
        setStockSummary([]);
        setBatchReport([]);
        setLedgerReport([]);
        setPurchaseReport([]);
        setIssueReport([]);
        setSalesReport([]);
        setPiReport([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [useMock]);

  const filteredStock = useMemo(() => {
    const q = searchStock.trim().toLowerCase();
    const list = stockSummary.filter((r) => !q || r.itemName.toLowerCase().includes(q));
    const sorted = [...list].sort((a, b) => stockSort === 'qty' ? b.totalQty - a.totalQty : b.totalValue - a.totalValue);
    return sorted;
  }, [stockSummary, searchStock, stockSort]);

  const stockTotalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize));
  const stockRows = useMemo(() => paginate(filteredStock, stockPage), [filteredStock, stockPage]);
  const stockTotals = useMemo(() => {
    const totalQty = filteredStock.reduce((s, r) => s + r.totalQty, 0);
    const totalValue = filteredStock.reduce((s, r) => s + r.totalValue, 0);
    return { totalQty, totalValue };
  }, [filteredStock]);

  const batchItems = useMemo(() => ['all', ...Array.from(new Set(batchReport.map((b) => b.itemName)))], [batchReport]);
  const filteredBatch = useMemo(() => {
    return batchReport.filter((r) => batchItem === 'all' || r.itemName === batchItem);
  }, [batchReport, batchItem]);

  const batchTotalPages = Math.max(1, Math.ceil(filteredBatch.length / pageSize));
  const batchRows = useMemo(() => paginate(filteredBatch, batchPage), [filteredBatch, batchPage]);
  const batchCounts = useMemo(() => {
    const expired = filteredBatch.filter((b) => isExpired(b.expiryDate)).length;
    const expSoon = filteredBatch.filter((b) => isExpiringSoon(b.expiryDate)).length;
    return { expired, expSoon };
  }, [filteredBatch]);

  const ledgerItems = useMemo(() => ['all', ...Array.from(new Set(ledgerReport.map((r) => r.itemName)))], [ledgerReport]);
  const ledgerBatches = useMemo(() => ['all', ...Array.from(new Set(ledgerReport.map((r) => r.batchNo)))], [ledgerReport]);
  const filteredLedger = useMemo(() => {
    return ledgerReport.filter((r) => {
      if (ledgerItem !== 'all' && r.itemName !== ledgerItem) return false;
      if (ledgerBatch !== 'all' && r.batchNo !== ledgerBatch) return false;
      if (ledgerFrom && r.date < ledgerFrom) return false;
      if (ledgerTo && r.date > ledgerTo) return false;
      return true;
    });
  }, [ledgerReport, ledgerItem, ledgerBatch, ledgerFrom, ledgerTo]);

  const ledgerTotalPages = Math.max(1, Math.ceil(filteredLedger.length / pageSize));
  const ledgerRows = useMemo(() => paginate(filteredLedger, ledgerPage), [filteredLedger, ledgerPage]);
  const ledgerTotals = useMemo(() => {
    const inTotal = filteredLedger.reduce((s, r) => s + (r.inQty || 0), 0);
    const outTotal = filteredLedger.reduce((s, r) => s + (r.outQty || 0), 0);
    return { inTotal, outTotal };
  }, [filteredLedger]);

  const vendors = useMemo(() => ['all', ...Array.from(new Set(purchaseReport.map((r) => r.vendor)))], [purchaseReport]);
  const filteredPurchase = useMemo(() => {
    return purchaseReport.filter((r) => {
      if (purchaseVendor !== 'all' && r.vendor !== purchaseVendor) return false;
      if (purchaseFrom && r.date < purchaseFrom) return false;
      if (purchaseTo && r.date > purchaseTo) return false;
      return true;
    });
  }, [purchaseReport, purchaseVendor, purchaseFrom, purchaseTo]);

  const purchaseTotalPages = Math.max(1, Math.ceil(filteredPurchase.length / pageSize));
  const purchaseRows = useMemo(() => paginate(filteredPurchase, purchasePage), [filteredPurchase, purchasePage]);
  const purchaseTotals = useMemo(() => {
    const qty = filteredPurchase.reduce((s, r) => s + r.qtyAccepted, 0);
    const value = filteredPurchase.reduce((s, r) => s + r.value, 0);
    return { qty, value };
  }, [filteredPurchase]);

  const filteredIssue = useMemo(() => {
    return issueReport.filter((r) => {
      if (issueType !== 'all' && r.type !== issueType) return false;
      if (issueFrom && r.date < issueFrom) return false;
      if (issueTo && r.date > issueTo) return false;
      return true;
    });
  }, [issueReport, issueType, issueFrom, issueTo]);

  const issueTotalPages = Math.max(1, Math.ceil(filteredIssue.length / pageSize));
  const issueRows = useMemo(() => paginate(filteredIssue, issuePage), [filteredIssue, issuePage]);
  const issueTotals = useMemo(() => {
    const qty = filteredIssue.reduce((s, r) => s + r.qty, 0);
    return { qty };
  }, [filteredIssue]);

  const customers = useMemo(() => ['all', ...Array.from(new Set(salesReport.map((r) => r.customer)))], [salesReport]);
  const filteredSales = useMemo(() => {
    return salesReport.filter((r) => {
      if (salesCustomer !== 'all' && r.customer !== salesCustomer) return false;
      if (salesFrom && r.date < salesFrom) return false;
      if (salesTo && r.date > salesTo) return false;
      return true;
    });
  }, [salesReport, salesCustomer, salesFrom, salesTo]);

  const salesTotalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const salesRows = useMemo(() => paginate(filteredSales, salesPage), [filteredSales, salesPage]);
  const salesTotals = useMemo(() => {
    const qty = filteredSales.reduce((s, r) => s + r.qty, 0);
    const amount = filteredSales.reduce((s, r) => s + r.amount, 0);
    return { qty, amount };
  }, [filteredSales]);

  const piCustomers = useMemo(() => ['all', ...Array.from(new Set(piReport.map((r) => r.customer)))], [piReport]);
  const filteredPi = useMemo(() => {
    return piReport.filter((r) => {
      if (piStatus !== 'all' && r.status !== piStatus) return false;
      if (piCustomer !== 'all' && r.customer !== piCustomer) return false;
      return true;
    });
  }, [piReport, piStatus, piCustomer]);

  const piTotalPages = Math.max(1, Math.ceil(filteredPi.length / pageSize));
  const piRows = useMemo(() => paginate(filteredPi, piPage), [filteredPi, piPage]);
  const piTotals = useMemo(() => {
    const ordered = filteredPi.reduce((s, r) => s + r.orderedQty, 0);
    const invoiced = filteredPi.reduce((s, r) => s + r.invoicedQty, 0);
    const remaining = filteredPi.reduce((s, r) => s + r.remainingQty, 0);
    return { ordered, invoiced, remaining };
  }, [filteredPi]);

  useEffect(() => setStockPage(1), [searchStock, stockSort]);
  useEffect(() => setBatchPage(1), [batchItem]);
  useEffect(() => setLedgerPage(1), [ledgerItem, ledgerBatch, ledgerFrom, ledgerTo]);
  useEffect(() => setPurchasePage(1), [purchaseVendor, purchaseFrom, purchaseTo]);
  useEffect(() => setIssuePage(1), [issueType, issueFrom, issueTo]);
  useEffect(() => setSalesPage(1), [salesCustomer, salesFrom, salesTo]);
  useEffect(() => setPiPage(1), [piStatus, piCustomer]);

  const exportStockCsv = () => downloadCsv('stock-summary.csv', [
    ['Item Name', 'Total Qty', 'Total Value', 'Unit'],
    ...filteredStock.map((r) => [r.itemName, r.totalQty, r.totalValue, r.unit]),
  ]);
  const exportBatchCsv = () => downloadCsv('batch-wise.csv', [
    ['Item Name', 'Batch No', 'MFG Date', 'Expiry Date', 'Available Qty', 'Rate', 'Value'],
    ...filteredBatch.map((r) => [r.itemName, r.batchNo, r.mfgDate, r.expiryDate, r.availableQty, r.rate, r.value]),
  ]);
  const exportLedgerCsv = () => downloadCsv('ledger-report.csv', [
    ['Date', 'Type', 'Reference', 'Item', 'Batch', 'IN', 'OUT', 'Balance'],
    ...filteredLedger.map((r) => [r.date, r.type, r.reference, r.itemName, r.batchNo, r.inQty, r.outQty, r.balance]),
  ]);
  const exportPurchaseCsv = () => downloadCsv('purchase-report.csv', [
    ['Date', 'Vendor', 'Item', 'Batch', 'Qty (Accepted)', 'Rate', 'Value'],
    ...filteredPurchase.map((r) => [r.date, r.vendor, r.itemName, r.batchNo, r.qtyAccepted, r.rate, r.value]),
  ]);
  const exportIssueCsv = () => downloadCsv('issue-report.csv', [
    ['Date', 'Type', 'Item', 'Batch', 'Qty'],
    ...filteredIssue.map((r) => [r.date, r.type, r.itemName, r.batchNo, r.qty]),
  ]);
  const exportSalesCsv = () => downloadCsv('sales-report.csv', [
    ['Date', 'Customer', 'Invoice No', 'Item', 'Batch', 'Qty', 'Amount'],
    ...filteredSales.map((r) => [r.date, r.customer, r.invoiceNo, r.itemName, r.batchNo, r.qty, r.amount]),
  ]);
  const exportPiCsv = () => downloadCsv('pi-status-report.csv', [
    ['PI No', 'Customer', 'Item', 'Ordered Qty', 'Invoiced Qty', 'Remaining Qty', 'Status'],
    ...filteredPi.map((r) => [r.piNo, r.customer, r.itemName, r.orderedQty, r.invoicedQty, r.remainingQty, r.status]),
  ]);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Reports' },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start gap-1 overflow-x-auto flex-nowrap">
          <TabsTrigger value="stock-summary" className="whitespace-nowrap">Stock Summary</TabsTrigger>
          <TabsTrigger value="batch" className="whitespace-nowrap">Batch-wise Stock</TabsTrigger>
          <TabsTrigger value="ledger" className="whitespace-nowrap">Ledger</TabsTrigger>
          <TabsTrigger value="purchase" className="whitespace-nowrap">Purchase</TabsTrigger>
          <TabsTrigger value="issue" className="whitespace-nowrap">Issue</TabsTrigger>
          <TabsTrigger value="sales" className="whitespace-nowrap">Sales</TabsTrigger>
          <TabsTrigger value="pi" className="whitespace-nowrap">PI Status</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-summary" className="mt-4 space-y-4">
          <ReportHeader
            title="Stock Summary Report"
            filters={[`Search: ${searchStock || 'All'}`, `Sort: ${stockSort}`]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportStockCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{stockTotals.totalQty}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Value</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">?{stockTotals.totalValue.toLocaleString('en-IN')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredStock.length}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ value: { label: 'Value', color: 'hsl(var(--primary))' } }} className="h-48 w-full aspect-auto">
            <BarChart data={filteredStock.slice(0, 6).map((r) => ({ name: r.itemName, value: r.totalValue }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Input placeholder="Search item" value={searchStock} onChange={(e) => setSearchStock(e.target.value)} />
            <Select value={stockSort} onValueChange={(v) => setStockSort(v as 'qty' | 'value')}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="qty">Sort by Qty</SelectItem>
                <SelectItem value="value">Sort by Value</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockRows.map((r) => (
                  <TableRow key={r.itemName}>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="text-right">{r.totalQty}</TableCell>
                    <TableCell className="text-right">?{r.totalValue.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{r.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={stockPage}
            totalPages={stockTotalPages}
            onPrev={() => setStockPage(stockPage - 1)}
            onNext={() => setStockPage(stockPage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="batch" className="mt-4 space-y-4">
          <ReportHeader
            title="Batch-wise Stock Report"
            filters={[`Item: ${batchItem === 'all' ? 'All' : batchItem}`]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportBatchCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Batches</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredBatch.length}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Expiring Soon</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{batchCounts.expSoon}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Expired</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{batchCounts.expired}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ count: { label: 'Batches', color: 'hsl(var(--primary))' } }} className="h-40 w-full aspect-auto">
            <LineChart data={[{ name: 'Expiring Soon', count: batchCounts.expSoon }, { name: 'Expired', count: batchCounts.expired }]}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot />
            </LineChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={batchItem} onValueChange={setBatchItem}>
              <SelectTrigger><SelectValue placeholder="Filter by item" /></SelectTrigger>
              <SelectContent>
                {batchItems.map((i) => <SelectItem key={i} value={i}>{i === 'all' ? 'All Items' : i}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Batch No</TableHead>
                  <TableHead>MFG Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Available Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchRows.map((r) => {
                  const expired = isExpired(r.expiryDate);
                  const expSoon = isExpiringSoon(r.expiryDate);
                  return (
                    <TableRow key={`${r.itemName}-${r.batchNo}`} className={expired ? 'bg-destructive/10' : expSoon ? 'bg-warning/10' : ''}>
                      <TableCell className="font-medium">{r.itemName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.batchNo}</TableCell>
                      <TableCell>{r.mfgDate}</TableCell>
                      <TableCell>{r.expiryDate}</TableCell>
                      <TableCell className="text-right">{r.availableQty}</TableCell>
                      <TableCell className="text-right">?{r.rate.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">?{r.value.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={batchPage}
            totalPages={batchTotalPages}
            onPrev={() => setBatchPage(batchPage - 1)}
            onNext={() => setBatchPage(batchPage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4 space-y-4">
          <ReportHeader
            title="Ledger Report"
            filters={[
              `Item: ${ledgerItem === 'all' ? 'All' : ledgerItem}`,
              `Batch: ${ledgerBatch === 'all' ? 'All' : ledgerBatch}`,
              `Date: ${ledgerFrom || 'Any'} to ${ledgerTo || 'Any'}`,
            ]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportLedgerCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">IN Total</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{ledgerTotals.inTotal}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">OUT Total</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{ledgerTotals.outTotal}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Entries</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredLedger.length}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ inQty: { label: 'IN', color: 'hsl(var(--primary))' }, outQty: { label: 'OUT', color: 'hsl(var(--destructive))' } }} className="h-40 w-full aspect-auto">
            <BarChart data={[{ name: 'IN', inQty: ledgerTotals.inTotal }, { name: 'OUT', outQty: ledgerTotals.outTotal }]}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="inQty" fill="var(--color-inQty)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outQty" fill="var(--color-outQty)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={ledgerItem} onValueChange={setLedgerItem}>
              <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
              <SelectContent>
                {ledgerItems.map((i) => <SelectItem key={i} value={i}>{i === 'all' ? 'All Items' : i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={ledgerBatch} onValueChange={setLedgerBatch}>
              <SelectTrigger><SelectValue placeholder="Batch" /></SelectTrigger>
              <SelectContent>
                {ledgerBatches.map((b) => <SelectItem key={b} value={b}>{b === 'all' ? 'All Batches' : b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={ledgerFrom} onChange={(e) => setLedgerFrom(e.target.value)} />
            <Input type="date" value={ledgerTo} onChange={(e) => setLedgerTo(e.target.value)} />
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">IN</TableHead>
                  <TableHead className="text-right">OUT</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerRows.map((r, idx) => (
                  <TableRow key={`${r.reference}-${idx}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.batchNo}</TableCell>
                    <TableCell className="text-right">{r.inQty || '-'}</TableCell>
                    <TableCell className="text-right">{r.outQty || '-'}</TableCell>
                    <TableCell className="text-right">{r.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={ledgerPage}
            totalPages={ledgerTotalPages}
            onPrev={() => setLedgerPage(ledgerPage - 1)}
            onNext={() => setLedgerPage(ledgerPage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchase" className="mt-4 space-y-4">
          <ReportHeader
            title="Purchase Report"
            filters={[
              `Vendor: ${purchaseVendor === 'all' ? 'All' : purchaseVendor}`,
              `Date: ${purchaseFrom || 'Any'} to ${purchaseTo || 'Any'}`,
            ]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportPurchaseCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{purchaseTotals.qty}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Value</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">?{purchaseTotals.value.toLocaleString('en-IN')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Entries</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredPurchase.length}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ value: { label: 'Value', color: 'hsl(var(--primary))' } }} className="h-40 w-full aspect-auto">
            <BarChart data={filteredPurchase.slice(0, 6).map((r) => ({ name: r.vendor, value: r.value }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={purchaseVendor} onValueChange={setPurchaseVendor}>
              <SelectTrigger><SelectValue placeholder="Vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => <SelectItem key={v} value={v}>{v === 'all' ? 'All Vendors' : v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={purchaseFrom} onChange={(e) => setPurchaseFrom(e.target.value)} />
            <Input type="date" value={purchaseTo} onChange={(e) => setPurchaseTo(e.target.value)} />
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Qty (Accepted)</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRows.map((r, idx) => (
                  <TableRow key={`${r.vendor}-${idx}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.vendor}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.batchNo}</TableCell>
                    <TableCell className="text-right">{r.qtyAccepted}</TableCell>
                    <TableCell className="text-right">?{r.rate.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">?{r.value.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={purchasePage}
            totalPages={purchaseTotalPages}
            onPrev={() => setPurchasePage(purchasePage - 1)}
            onNext={() => setPurchasePage(purchasePage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="issue" className="mt-4 space-y-4">
          <ReportHeader
            title="Issue Report"
            filters={[
              `Type: ${issueType === 'all' ? 'All' : issueType}`,
              `Date: ${issueFrom || 'Any'} to ${issueTo || 'Any'}`,
            ]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportIssueCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{issueTotals.qty}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Entries</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredIssue.length}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Types</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{Array.from(new Set(filteredIssue.map((i) => i.type))).length}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ qty: { label: 'Qty', color: 'hsl(var(--primary))' } }} className="h-40 w-full aspect-auto">
            <BarChart data={Array.from(new Set(filteredIssue.map((i) => i.type))).map((t) => ({ name: t, qty: filteredIssue.filter((i) => i.type === t).reduce((s, i) => s + i.qty, 0) }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="qty" fill="var(--color-qty)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Damage">Damage</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={issueFrom} onChange={(e) => setIssueFrom(e.target.value)} />
            <Input type="date" value={issueTo} onChange={(e) => setIssueTo(e.target.value)} />
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issueRows.map((r, idx) => (
                  <TableRow key={`${r.itemName}-${idx}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.batchNo}</TableCell>
                    <TableCell className="text-right">{r.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={issuePage}
            totalPages={issueTotalPages}
            onPrev={() => setIssuePage(issuePage - 1)}
            onNext={() => setIssuePage(issuePage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="mt-4 space-y-4">
          <ReportHeader
            title="Sales Report"
            filters={[
              `Customer: ${salesCustomer === 'all' ? 'All' : salesCustomer}`,
              `Date: ${salesFrom || 'Any'} to ${salesTo || 'Any'}`,
            ]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportSalesCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{salesTotals.qty}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Amount</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">?{salesTotals.amount.toLocaleString('en-IN')}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{filteredSales.length}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ amount: { label: 'Amount', color: 'hsl(var(--primary))' } }} className="h-40 w-full aspect-auto">
            <BarChart data={filteredSales.slice(0, 6).map((r) => ({ name: r.customer, amount: r.amount }))}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} hide />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={salesCustomer} onValueChange={setSalesCustomer}>
              <SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? 'All Customers' : c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={salesFrom} onChange={(e) => setSalesFrom(e.target.value)} />
            <Input type="date" value={salesTo} onChange={(e) => setSalesTo(e.target.value)} />
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesRows.map((r, idx) => (
                  <TableRow key={`${r.invoiceNo}-${idx}`}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell className="font-mono text-xs">{r.invoiceNo}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="font-mono text-xs">{r.batchNo}</TableCell>
                    <TableCell className="text-right">{r.qty}</TableCell>
                    <TableCell className="text-right">?{r.amount.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={salesPage}
            totalPages={salesTotalPages}
            onPrev={() => setSalesPage(salesPage - 1)}
            onNext={() => setSalesPage(salesPage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pi" className="mt-4 space-y-4">
          <ReportHeader
            title="PI Status Report"
            filters={[
              `Status: ${piStatus === 'all' ? 'All' : piStatus}`,
              `Customer: ${piCustomer === 'all' ? 'All' : piCustomer}`,
            ]}
          />
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={exportPiCsv}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Ordered</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{piTotals.ordered}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Invoiced</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{piTotals.invoiced}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Remaining</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{piTotals.remaining}</CardContent>
            </Card>
          </div>
          <ChartContainer config={{ qty: { label: 'Qty', color: 'hsl(var(--primary))' } }} className="h-40 w-full aspect-auto">
            <BarChart data={[{ name: 'Ordered', qty: piTotals.ordered }, { name: 'Invoiced', qty: piTotals.invoiced }, { name: 'Remaining', qty: piTotals.remaining }]}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="qty" fill="var(--color-qty)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-card border border-border rounded-lg p-4 print:hidden">
            <Select value={piStatus} onValueChange={setPiStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={piCustomer} onValueChange={setPiCustomer}>
              <SelectTrigger><SelectValue placeholder="Customer" /></SelectTrigger>
              <SelectContent>
                {piCustomers.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? 'All Customers' : c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PI No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Ordered Qty</TableHead>
                  <TableHead className="text-right">Invoiced Qty</TableHead>
                  <TableHead className="text-right">Remaining Qty</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piRows.map((r, idx) => (
                  <TableRow key={`${r.piNo}-${idx}`}>
                    <TableCell className="font-mono text-xs">{r.piNo}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell className="font-medium">{r.itemName}</TableCell>
                    <TableCell className="text-right">{r.orderedQty}</TableCell>
                    <TableCell className="text-right">{r.invoicedQty}</TableCell>
                    <TableCell className="text-right">{r.remainingQty}</TableCell>
                    <TableCell>{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PageControls
            page={piPage}
            totalPages={piTotalPages}
            onPrev={() => setPiPage(piPage - 1)}
            onNext={() => setPiPage(piPage + 1)}
          />
          <div className="grid grid-cols-2 gap-6 text-sm print:mt-8">
            <div>
              <div className="border-t border-slate-300 pt-2">Prepared By</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 text-right">Authorized Signatory</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
