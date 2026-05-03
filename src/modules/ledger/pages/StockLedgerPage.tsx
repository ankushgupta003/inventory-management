import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownUp, BookOpen, Boxes, PackageCheck, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListPagination, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { useLedger } from '../hooks/useLedger';
import type { ItemCategory, LedgerEntry, LedgerTransaction, TransactionType } from '../types';

type LedgerTab = 'TRANSACTIONS' | ItemCategory;

type StockLedgerFilters = {
  search: string;
  itemId: string;
  batchNo: string;
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
};

type TransactionFilters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
  itemCategory: 'all' | ItemCategory;
};

type StockLedgerRow = LedgerEntry & {
  balanceQty: number;
  value: number;
};

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
  invoice: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  return: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  transfer: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  sampling: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const TAB_LABELS: Record<LedgerTab, string> = {
  TRANSACTIONS: 'Transaction Register',
  RAW: 'Raw Material Ledger',
  FINISHED: 'Finished Goods Ledger',
};

const defaultStockFilters: StockLedgerFilters = {
  search: '',
  itemId: 'all',
  batchNo: 'all',
  dateFrom: '',
  dateTo: '',
  type: 'all',
};

const defaultTransactionFilters: TransactionFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  type: 'all',
  itemCategory: 'all',
};

function roundQty(value: number) {
  return Number(value.toFixed(3));
}

function formatQuantity(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 3,
    maximumFractionDigits: 3,
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleDateString('en-IN') : '-';
}

function isExpiryNear(expiryDate: string) {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
}

function matchesDate(date: string, dateFrom: string, dateTo: string) {
  if (dateFrom && date < dateFrom) return false;
  if (dateTo && date > dateTo) return false;
  return true;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function buildTransactionRows(entries: LedgerEntry[]) {
  const grouped = new Map<string, LedgerTransaction>();

  entries.forEach((entry) => {
    const sourceKey = entry.sourceId || `${entry.type}:${entry.referenceNo}`;
    const key = `${entry.type}:${entry.referenceNo}:${sourceKey}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: key,
        date: entry.date,
        referenceNo: entry.referenceNo,
        type: entry.type,
        particulars: entry.particulars,
        itemCategory: entry.itemCategory,
        itemCategories: [entry.itemCategory],
        itemNames: [entry.itemName],
        batchNos: [entry.batchNo],
        receiptQty: entry.receiptQty,
        issueQty: entry.issueQty,
        netQty: roundQty(entry.receiptQty - entry.issueQty),
        transactionValue: entry.transactionValue,
        lineCount: 1,
        itemCount: 1,
        remarks: entry.remarks ? [entry.remarks] : [],
        sourceModule: entry.sourceModule,
        sourceId: entry.sourceId,
        sourcePath: entry.sourcePath,
        sourceLabel: entry.sourceLabel,
      });
      return;
    }

    const itemCategories = new Set([...existing.itemCategories, entry.itemCategory]);
    const itemNames = new Set([...existing.itemNames, entry.itemName]);
    const batchNos = new Set([...existing.batchNos, entry.batchNo]);
    const remarks = new Set([...existing.remarks, ...(entry.remarks ? [entry.remarks] : [])]);

    grouped.set(key, {
      ...existing,
      itemCategory: itemCategories.size === 1 ? [...itemCategories][0] : 'MIXED',
      itemCategories: [...itemCategories],
      itemNames: [...itemNames],
      batchNos: [...batchNos],
      receiptQty: roundQty(existing.receiptQty + entry.receiptQty),
      issueQty: roundQty(existing.issueQty + entry.issueQty),
      netQty: roundQty(existing.netQty + entry.receiptQty - entry.issueQty),
      transactionValue: Number((existing.transactionValue + entry.transactionValue).toFixed(2)),
      lineCount: existing.lineCount + 1,
      itemCount: itemNames.size,
      remarks: [...remarks],
    });
  });

  return [...grouped.values()].sort((a, b) => (
    b.date.localeCompare(a.date) ||
    b.referenceNo.localeCompare(a.referenceNo) ||
    b.id.localeCompare(a.id)
  ));
}

function buildStockRows(entries: LedgerEntry[], category: ItemCategory, filters: StockLedgerFilters) {
  const search = normalizeSearch(filters.search);
  const categoryEntries = entries.filter((entry) => entry.itemCategory === category);
  const itemOptions = [...new Set(categoryEntries.map((entry) => entry.itemName))].sort((a, b) => a.localeCompare(b));
  const batchOptions = [...new Set(categoryEntries.map((entry) => entry.batchNo))].sort((a, b) => a.localeCompare(b));
  const balances = new Map<string, number>();
  const filteredRows: StockLedgerRow[] = [];

  categoryEntries.forEach((entry) => {
    const key = `${entry.itemId || entry.itemName}:${entry.batchNo}`;
    const previous = balances.get(key) ?? 0;
    const balanceQty = roundQty(previous + entry.receiptQty - entry.issueQty);
    balances.set(key, balanceQty);

    const searchText = [
      entry.referenceNo,
      entry.particulars,
      entry.itemName,
      entry.batchNo,
      entry.remarks,
      entry.sourceLabel,
    ].join(' ').toLowerCase();

    const matches =
      (!search || searchText.includes(search)) &&
      (filters.itemId === 'all' || entry.itemName === filters.itemId) &&
      (filters.batchNo === 'all' || entry.batchNo === filters.batchNo) &&
      (filters.type === 'all' || entry.type === filters.type) &&
      matchesDate(entry.date, filters.dateFrom, filters.dateTo);

    if (matches) {
      filteredRows.push({
        ...entry,
        balanceQty,
        value: entry.transactionValue,
      });
    }
  });

  return {
    rows: filteredRows,
    itemOptions,
    batchOptions,
  };
}

function buildSourceRef(entry: Pick<LedgerEntry, 'referenceNo' | 'sourcePath' | 'sourceLabel'>) {
  if (!entry.sourcePath) {
    return <span className="font-mono text-xs">{entry.referenceNo}</span>;
  }

  return (
    <Link to={entry.sourcePath} className="font-mono text-xs font-semibold text-primary hover:underline">
      {entry.referenceNo}
    </Link>
  );
}

function TransactionsTable({ entries }: { entries: LedgerEntry[] }) {
  const [filters, setFilters] = useState<TransactionFilters>(defaultTransactionFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const transactions = useMemo(() => buildTransactionRows(entries), [entries]);

  const filteredTransactions = useMemo(() => {
    const search = normalizeSearch(filters.search);

    return transactions.filter((transaction) => {
      const searchText = [
        transaction.referenceNo,
        transaction.particulars,
        transaction.itemNames.join(' '),
        transaction.batchNos.join(' '),
        transaction.remarks.join(' '),
        transaction.sourceLabel,
      ].join(' ').toLowerCase();

      return (
        (!search || searchText.includes(search)) &&
        (filters.type === 'all' || transaction.type === filters.type) &&
        (filters.itemCategory === 'all' || transaction.itemCategories.includes(filters.itemCategory)) &&
        matchesDate(transaction.date, filters.dateFrom, filters.dateTo)
      );
    });
  }, [filters, transactions]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const receipt = filteredTransactions.reduce((sum, entry) => sum + entry.receiptQty, 0);
    const issue = filteredTransactions.reduce((sum, entry) => sum + entry.issueQty, 0);
    const neutral = filteredTransactions.filter((entry) => entry.receiptQty === 0 && entry.issueQty === 0).length;

    return [
      { id: 'transactions', label: 'Transactions', value: filteredTransactions.length.toLocaleString('en-IN'), icon: BookOpen, tone: 'blue' },
      { id: 'in', label: 'Total Receipt', value: formatQuantity(receipt), icon: PackageCheck, tone: 'green' },
      { id: 'out', label: 'Total Issue', value: formatQuantity(issue), icon: ArrowDownUp, tone: 'orange' },
      { id: 'neutral', label: 'Neutral Docs', value: neutral.toLocaleString('en-IN'), icon: Boxes, tone: 'purple' },
    ];
  }, [filteredTransactions]);

  const exportCsv = () => {
    exportCsvFile(`ledger-transactions-${csvDateSuffix()}.csv`, [
      ['Date', 'Ref No', 'Type', 'Particulars', 'Items', 'Batches', 'Receipt', 'Issue', 'Net', 'Value', 'Source'],
      ...filteredTransactions.map((transaction) => [
        transaction.date,
        transaction.referenceNo,
        TYPE_LABELS[transaction.type],
        transaction.particulars,
        transaction.itemNames.join(', '),
        transaction.batchNos.join(', '),
        transaction.receiptQty,
        transaction.issueQty,
        transaction.netQty,
        transaction.transactionValue,
        transaction.sourceLabel,
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
        <Input
          value={filters.search}
          onChange={(event) => {
            setFilters((current) => ({ ...current, search: event.target.value }));
            setPage(1);
          }}
          placeholder="Search ref, party, item, batch"
          className="w-[240px]"
        />

        <Select
          value={filters.type}
          onValueChange={(value) => {
            setFilters((current) => ({ ...current, type: value as TransactionFilters['type'] }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.itemCategory}
          onValueChange={(value) => {
            setFilters((current) => ({ ...current, itemCategory: value as TransactionFilters['itemCategory'] }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="RAW">Raw Material</SelectItem>
            <SelectItem value="FINISHED">Finished Goods</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => {
            setFilters((current) => ({ ...current, dateFrom: event.target.value }));
            setPage(1);
          }}
          className="w-[160px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(event) => {
            setFilters((current) => ({ ...current, dateTo: event.target.value }));
            setPage(1);
          }}
          className="w-[160px]"
        />

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setFilters(defaultTransactionFilters);
            setPage(1);
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Clear
        </Button>
      </ListFilterBar>

      <ListTablePanel title="Transaction Register" description={`${filteredTransactions.length} grouped transactions`}>
        <div className="max-h-[calc(100vh-360px)] overflow-auto rounded-xl border border-border print:max-h-none print:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted print:bg-transparent">
              <TableRow className="border-b-2 border-border">
                <TableHead className="min-w-[90px] text-xs font-semibold">Date</TableHead>
                <TableHead className="min-w-[120px] text-xs font-semibold">Ref No</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Type</TableHead>
                <TableHead className="min-w-[180px] text-xs font-semibold">Particulars</TableHead>
                <TableHead className="min-w-[220px] text-xs font-semibold">Coverage</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Receipt</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Issue</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Net</TableHead>
                <TableHead className="min-w-[90px] text-right text-xs font-semibold">Value</TableHead>
                <TableHead className="min-w-[110px] text-xs font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                    No transactions found. Adjust filters and try again.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {buildSourceRef(transaction)}
                        <div className="text-[11px] text-muted-foreground">{transaction.sourceLabel}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] ${TYPE_COLORS[transaction.type]}`}>
                        {TYPE_LABELS[transaction.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{transaction.particulars}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{transaction.itemNames.slice(0, 2).join(', ')}</div>
                      <div className="text-muted-foreground">
                        {transaction.itemCount} item{transaction.itemCount === 1 ? '' : 's'} | {transaction.batchNos.length} batch{transaction.batchNos.length === 1 ? '' : 'es'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {transaction.receiptQty > 0 ? formatQuantity(transaction.receiptQty) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium text-orange-600 dark:text-orange-400">
                      {transaction.issueQty > 0 ? formatQuantity(transaction.issueQty) : '-'}
                    </TableCell>
                    <TableCell className={`text-right text-xs font-bold ${transaction.netQty < 0 ? 'text-destructive' : transaction.netQty > 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {formatQuantity(transaction.netQty)}
                    </TableCell>
                    <TableCell className="text-right text-xs">Rs {formatCurrency(transaction.transactionValue)}</TableCell>
                    <TableCell className="text-xs">
                      {transaction.sourcePath ? (
                        <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg px-2">
                          <Link to={transaction.sourcePath}>Open</Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
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
          totalRows={filteredTransactions.length}
          startRow={filteredTransactions.length === 0 ? 0 : (page - 1) * pageSize + 1}
          endRow={Math.min(page * pageSize, filteredTransactions.length)}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
}

function StockLedgerTable({ category, entries }: { category: ItemCategory; entries: LedgerEntry[] }) {
  const [filters, setFilters] = useState<StockLedgerFilters>(defaultStockFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const stockView = useMemo(() => buildStockRows(entries, category, filters), [category, entries, filters]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return stockView.rows.slice(start, start + pageSize);
  }, [page, pageSize, stockView.rows]);

  const totalPages = Math.max(1, Math.ceil(stockView.rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const receipt = stockView.rows.reduce((sum, row) => sum + row.receiptQty, 0);
    const issue = stockView.rows.reduce((sum, row) => sum + row.issueQty, 0);
    const closingByBatch = new Map<string, number>();
    stockView.rows.forEach((row) => {
      closingByBatch.set(`${row.itemId || row.itemName}:${row.batchNo}`, row.balanceQty);
    });
    const closingQty = [...closingByBatch.values()].reduce((sum, value) => sum + value, 0);

    return [
      { id: 'rows', label: 'Entries', value: stockView.rows.length.toLocaleString('en-IN'), icon: BookOpen, tone: 'blue' },
      { id: 'closing', label: 'Closing Qty', value: formatQuantity(closingQty), icon: Boxes, tone: 'purple' },
      { id: 'in', label: 'Total Receipt', value: formatQuantity(receipt), icon: PackageCheck, tone: 'green' },
      { id: 'out', label: 'Total Issue', value: formatQuantity(issue), icon: ArrowDownUp, tone: 'orange' },
    ];
  }, [stockView.rows]);

  const exportCsv = () => {
    exportCsvFile(`stock-ledger-${category.toLowerCase()}-${csvDateSuffix()}.csv`, [
      ['Date', 'Ref No', 'Type', 'Particulars', 'Item', 'Batch', 'Receipt', 'Issue', 'Balance', 'Rate', 'Value'],
      ...stockView.rows.map((row) => [
        row.date,
        row.referenceNo,
        TYPE_LABELS[row.type],
        row.particulars,
        row.itemName,
        row.batchNo,
        row.receiptQty,
        row.issueQty,
        row.balanceQty,
        row.rate,
        row.value,
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
        <Input
          value={filters.search}
          onChange={(event) => {
            setFilters((current) => ({ ...current, search: event.target.value }));
            setPage(1);
          }}
          placeholder="Search ref, item, batch, remarks"
          className="w-[240px]"
        />

        <Select
          value={filters.itemId}
          onValueChange={(value) => {
            setFilters((current) => ({ ...current, itemId: value }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Items" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {stockView.itemOptions.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.batchNo}
          onValueChange={(value) => {
            setFilters((current) => ({ ...current, batchNo: value }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {stockView.batchOptions.map((batch) => (
              <SelectItem key={batch} value={batch}>{batch}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => {
            setFilters((current) => ({ ...current, type: value as StockLedgerFilters['type'] }));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => {
            setFilters((current) => ({ ...current, dateFrom: event.target.value }));
            setPage(1);
          }}
          className="w-[160px]"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(event) => {
            setFilters((current) => ({ ...current, dateTo: event.target.value }));
            setPage(1);
          }}
          className="w-[160px]"
        />

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setFilters(defaultStockFilters);
            setPage(1);
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Clear
        </Button>
      </ListFilterBar>

      <ListTablePanel title="Ledger Entries" description={`${stockView.rows.length} entries`}>
        <div className="max-h-[calc(100vh-360px)] overflow-auto rounded-xl border border-border print:max-h-none print:overflow-visible">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted print:bg-transparent">
              <TableRow className="border-b-2 border-border">
                <TableHead className="min-w-[90px] text-xs font-semibold">Date</TableHead>
                <TableHead className="min-w-[120px] text-xs font-semibold">Ref No</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Type</TableHead>
                <TableHead className="min-w-[160px] text-xs font-semibold">Particulars</TableHead>
                <TableHead className="min-w-[140px] text-xs font-semibold">Item Name</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Batch No</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">MFG Date</TableHead>
                <TableHead className="min-w-[90px] text-xs font-semibold">Expiry</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Receipt</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Issue</TableHead>
                <TableHead className="min-w-[80px] text-right text-xs font-semibold">Balance</TableHead>
                <TableHead className="min-w-[70px] text-right text-xs font-semibold">Rate</TableHead>
                <TableHead className="min-w-[90px] text-right text-xs font-semibold">Value</TableHead>
                <TableHead className="min-w-[120px] text-xs font-semibold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                    No ledger entries found. Adjust filters and try again.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((entry) => {
                  const nearExpiry = isExpiryNear(entry.expiryDate);
                  const negativeStock = entry.balanceQty < 0;

                  return (
                    <TableRow
                      key={entry.id}
                      className={
                        negativeStock
                          ? 'bg-destructive/5 hover:bg-destructive/10'
                          : nearExpiry
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : ''
                      }
                    >
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {buildSourceRef(entry)}
                          <div className="text-[11px] text-muted-foreground">{entry.sourceLabel}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] ${TYPE_COLORS[entry.type]}`}>
                          {TYPE_LABELS[entry.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{entry.particulars}</TableCell>
                      <TableCell className="text-xs font-medium">{entry.itemName}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.batchNo}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(entry.mfgDate)}</TableCell>
                      <TableCell className={`whitespace-nowrap text-xs ${nearExpiry ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}`}>
                        {formatDate(entry.expiryDate)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {entry.receiptQty > 0 ? formatQuantity(entry.receiptQty) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium text-orange-600 dark:text-orange-400">
                        {entry.issueQty > 0 ? formatQuantity(entry.issueQty) : '-'}
                      </TableCell>
                      <TableCell className={`text-right text-xs font-bold ${negativeStock ? 'text-destructive' : ''}`}>
                        {formatQuantity(entry.balanceQty)}
                      </TableCell>
                      <TableCell className="text-right text-xs">Rs {formatCurrency(entry.rate)}</TableCell>
                      <TableCell className="text-right text-xs">Rs {formatCurrency(entry.value)}</TableCell>
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
          totalRows={stockView.rows.length}
          startRow={stockView.rows.length === 0 ? 0 : (page - 1) * pageSize + 1}
          endRow={Math.min(page * pageSize, stockView.rows.length)}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>
    </div>
  );
}

export default function StockLedgerPage() {
  const [activeTab, setActiveTab] = useState<LedgerTab>('TRANSACTIONS');
  const { entries } = useLedger();

  return (
    <div className="space-y-7">
      <ListPageShell
        title="Ledger"
        description="Review grouped transactions and line-level stock movements across purchases, production, stock movements, and invoices."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ledger' }]}
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LedgerTab)} className="space-y-5">
        <TabsList className="rounded-xl print:hidden">
          <TabsTrigger value="TRANSACTIONS">Transactions</TabsTrigger>
          <TabsTrigger value="RAW">Raw Materials</TabsTrigger>
          <TabsTrigger value="FINISHED">Finished Goods</TabsTrigger>
        </TabsList>

        <TabsContent value="TRANSACTIONS">
          <TransactionsTable entries={entries} />
        </TabsContent>
        <TabsContent value="RAW">
          <StockLedgerTable category="RAW" entries={entries} />
        </TabsContent>
        <TabsContent value="FINISHED">
          <StockLedgerTable category="FINISHED" entries={entries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
