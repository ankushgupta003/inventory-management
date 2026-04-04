import { useState, useRef } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLedger } from '../hooks/useLedger';
import type { TransactionType, ItemCategory } from '../types';

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

function isExpiryNear(expiryDate: string) {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

const TAB_LABELS: Record<ItemCategory, string> = {
  RAW: 'Raw Material Ledger',
  FINISHED: 'Finished Goods Ledger',
};

function LedgerTable({ category }: { category: ItemCategory }) {
  const {
    entries, totalEntries, filters, applyFilters, resetFilters,
    page, setPage, totalPages, items, batches,
  } = useLedger(category);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 border border-border rounded-lg bg-card print:hidden">
        <Select value={filters.itemId} onValueChange={(v) => applyFilters({ itemId: v })}>
          <SelectTrigger><SelectValue placeholder="All Items" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {items.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.batchNo} onValueChange={(v) => applyFilters({ batchNo: v })}>
          <SelectTrigger><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input type="date" value={filters.dateFrom} onChange={(e) => applyFilters({ dateFrom: e.target.value })} placeholder="From Date" />
        <Input type="date" value={filters.dateTo} onChange={(e) => applyFilters({ dateTo: e.target.value })} placeholder="To Date" />

        <Select value={filters.type} onValueChange={(v) => applyFilters({ type: v as any })}>
          <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button variant="ghost" onClick={resetFilters} className="gap-1">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <p className="text-sm text-muted-foreground print:hidden">{totalEntries} entries</p>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-auto max-h-[calc(100vh-340px)] print:max-h-none print:overflow-visible">
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
              <TableHead className="min-w-[80px] text-xs font-semibold text-right">Receipt (IN)</TableHead>
              <TableHead className="min-w-[80px] text-xs font-semibold text-right">Issue (OUT)</TableHead>
              <TableHead className="min-w-[80px] text-xs font-semibold text-right">Balance</TableHead>
              <TableHead className="min-w-[70px] text-xs font-semibold text-right">Rate</TableHead>
              <TableHead className="min-w-[80px] text-xs font-semibold text-right">Value</TableHead>
              <TableHead className="min-w-[100px] text-xs font-semibold">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
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
                    <TableCell className="text-xs whitespace-nowrap">{new Date(entry.date).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-xs font-mono">{entry.referenceNo}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[entry.type]}`}>
                        {TYPE_LABELS[entry.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{entry.particulars}</TableCell>
                    <TableCell className="text-xs font-medium">{entry.itemName}</TableCell>
                    <TableCell className="text-xs font-mono">{entry.batchNo}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{entry.mfgDate ? new Date(entry.mfgDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                    <TableCell className={`text-xs whitespace-nowrap ${nearExpiry ? 'text-warning font-semibold' : ''}`}>
                      {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {entry.receiptQty > 0 ? entry.receiptQty.toLocaleString('en-IN') : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-medium text-orange-600 dark:text-orange-400">
                      {entry.issueQty > 0 ? entry.issueQty.toLocaleString('en-IN') : '-'}
                    </TableCell>
                    <TableCell className={`text-xs text-right font-bold ${negativeStock ? 'text-destructive' : ''}`}>
                      {entry.balanceQty.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs text-right">₹{entry.rate.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-xs text-right">₹{entry.value.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.remarks || '-'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground print:hidden">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockLedgerPage() {
  const [activeTab, setActiveTab] = useState<ItemCategory>('RAW');

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-foreground">Stock Ledger</h1>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> Print Ledger
        </Button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">{TAB_LABELS[activeTab]}</h1>
        <p className="text-sm">Generated on {new Date().toLocaleDateString('en-IN')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ItemCategory)}>
        <TabsList className="print:hidden">
          <TabsTrigger value="RAW">Raw Material</TabsTrigger>
          <TabsTrigger value="FINISHED">Finished Goods</TabsTrigger>
        </TabsList>
        <TabsContent value="RAW">
          <LedgerTable category="RAW" />
        </TabsContent>
        <TabsContent value="FINISHED">
          <LedgerTable category="FINISHED" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
