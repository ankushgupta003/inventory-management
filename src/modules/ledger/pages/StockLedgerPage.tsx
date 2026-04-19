import { useMemo, useState } from 'react';
import { Printer, RotateCcw, BookOpen, ArrowDownUp, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListPagination, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { useLedger } from '../hooks/useLedger';
import type { ItemCategory, TransactionType } from '../types';

const TYPE_LABELS: Record<TransactionType, string> = {
  purchase: 'Purchase',
  issue: 'Issue',
  production: 'Production',
  invoice: 'Invoice',
  return: 'Return',
  transfer: 'Transfer',
  sampling: 'Sampling',
};

const TYPE_COLORS: Record<TransactionType, string> = {
  purchase: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  issue: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  invoice: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  return: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  transfer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  sampling: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const TAB_LABELS: Record<ItemCategory, string> = {
  RAW: 'Raw Material Ledger',
  FINISHED: 'Finished Goods Ledger',
};

function isExpiryNear(expiryDate: string) {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function LedgerTable({ category }: { category: ItemCategory }) {
  const {
    entries,
    filteredEntries,
    totalEntries,
    filters,
    applyFilters,
    resetFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    items,
    batches,
  } = useLedger(category);

  const kpis: ListPageKpi[] = useMemo(() => {
    const receipt = filteredEntries.reduce((sum, e) => sum + e.receiptQty, 0);
    const issue = filteredEntries.reduce((sum, e) => sum + e.issueQty, 0);
    const value = filteredEntries.reduce((sum, e) => sum + e.value, 0);
    return [
      { id: 'rows', label: 'Entries', value: totalEntries.toLocaleString('en-IN'), icon: BookOpen, tone: 'blue' },
      { id: 'in', label: 'Total Receipt', value: receipt.toLocaleString('en-IN'), icon: PackageCheck, tone: 'green' },
      { id: 'out', label: 'Total Issue', value: issue.toLocaleString('en-IN'), icon: ArrowDownUp, tone: 'orange' },
      { id: 'value', label: 'Ledger Value', value: `INR ${value.toLocaleString('en-IN')}`, icon: BookOpen, tone: 'purple' },
    ];
  }, [filteredEntries, totalEntries]);

  const exportCsv = () => {
    exportCsvFile(`stock-ledger-${category.toLowerCase()}-${csvDateSuffix()}.csv`, [
      ['Date', 'Ref No', 'Type', 'Item', 'Batch', 'Receipt', 'Issue', 'Balance', 'Rate', 'Value'],
      ...filteredEntries.map((e) => [
        e.date,
        e.referenceNo,
        TYPE_LABELS[e.type],
        e.itemName,
        e.batchNo,
        e.receiptQty,
        e.issueQty,
        e.balanceQty,
        e.rate,
        e.value,
      ]),
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" className="rounded-xl" onClick={exportCsv}>Export CSV</Button>
      </div>

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <Select value={filters.itemId} onValueChange={(value) => applyFilters({ itemId: value })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Items" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {items.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.batchNo} onValueChange={(value) => applyFilters({ batchNo: value })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch} value={batch}>{batch}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input type="date" value={filters.dateFrom} onChange={(e) => applyFilters({ dateFrom: e.target.value })} className="w-[160px]" />
        <Input type="date" value={filters.dateTo} onChange={(e) => applyFilters({ dateTo: e.target.value })} className="w-[160px]" />

        <Select value={filters.type} onValueChange={(value) => applyFilters({ type: value as typeof filters.type })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="rounded-xl" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" /> Clear
        </Button>
      </ListFilterBar>

      <ListTablePanel title="Ledger Entries" description={`${totalEntries} entries`}>
        <div className="max-h-[calc(100vh-360px)] overflow-auto rounded-xl border border-border print:max-h-none print:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted print:bg-transparent">
              <TableRow className="border-b-2 border-border">
                <TableHead className="min-w-[90px] text-xs font-semibold">Date</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Ref No</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Type</TableHead>
                <TableHead className="min-w-[160px] text-xs font-semibold">Particulars</TableHead>
                <TableHead className="min-w-[130px] text-xs font-semibold">Item Name</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Batch No</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">MFG Date</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Expiry</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Receipt (IN)</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Issue (OUT)</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Balance</TableHead>
                <TableHead className="min-w-[70px] text-right text-xs font-semibold">Rate</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Value</TableHead>
                <TableHead className="min-w-[100px] text-xs font-semibold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                    No ledger entries found. Adjust filters and try again.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const nearExpiry = isExpiryNear(entry.expiryDate);
                  const negativeStock = entry.balanceQty < 0;
                  return (
                    <TableRow
                      key={entry.id}
                      className={
                        negativeStock
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : nearExpiry
                            ? 'bg-warning/5 hover:bg-warning/10'
                            : ''
                      }
                    >
                      <TableCell className="whitespace-nowrap text-xs">{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.referenceNo}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] ${TYPE_COLORS[entry.type]}`}>
                          {TYPE_LABELS[entry.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{entry.particulars}</TableCell>
                      <TableCell className="text-xs font-medium">{entry.itemName}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.batchNo}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {entry.mfgDate ? new Date(entry.mfgDate).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className={`whitespace-nowrap text-xs ${nearExpiry ? 'font-semibold text-warning' : ''}`}>
                        {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {entry.receiptQty > 0 ? entry.receiptQty.toLocaleString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-orange-600 dark:text-orange-400">
                        {entry.issueQty > 0 ? entry.issueQty.toLocaleString('en-IN') : '-'}
                      </TableCell>
                      <TableCell className={`text-right text-xs font-bold ${negativeStock ? 'text-destructive' : ''}`}>
                        {entry.balanceQty.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right text-xs">Rs {entry.rate.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-xs">Rs {entry.value.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.remarks || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </ListTablePanel>

      <div className="print:hidden">
        <ListPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalRows={totalEntries}
          startRow={totalEntries === 0 ? 0 : (page - 1) * pageSize + 1}
          endRow={Math.min(page * pageSize, totalEntries)}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
}

export default function StockLedgerPage() {
  const [activeTab, setActiveTab] = useState<ItemCategory>('RAW');

  return (
    <div className="space-y-7">
      <ListPageShell
        title="Stock Ledger"
        description="Track inventory transactions across raw and finished categories with audit-ready entries."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Stock Ledger' }]}
        extraActions={(
          <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Ledger
          </Button>
        )}
      />

      <div className="mb-4 hidden text-center print:block">
        <h1 className="text-xl font-bold">{TAB_LABELS[activeTab]}</h1>
        <p className="text-sm">Generated on {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ItemCategory)} className="space-y-5">
        <TabsList className="rounded-xl print:hidden">
          <TabsTrigger value="RAW">Raw Material</TabsTrigger>
          <TabsTrigger value="FINISHED">Finished Goods</TabsTrigger>
        </TabsList>

        <TabsContent value="RAW"><LedgerTable category="RAW" /></TabsContent>
        <TabsContent value="FINISHED"><LedgerTable category="FINISHED" /></TabsContent>
      </Tabs>
    </div>
  );
}
