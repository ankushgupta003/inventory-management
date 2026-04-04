import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { invoiceApi } from '../services/invoiceApi';
import type { InvoiceRecord, InvoiceStatus } from '../types';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  completed: 'Completed',
  partial: 'Partial',
};

const statusColors: Record<InvoiceStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-yellow-100 text-yellow-800',
};

const pageSize = 10;
const useMock = import.meta.env.DEV;

const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-240403-501',
    date: '2026-04-03',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21, Industrial Area\nPune, MH 411019',
    piId: 'pi-1',
    piNo: 'PI-240401-101',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', quantity: 40, rate: 4500, taxPercent: 18, amount: 180000 },
    ],
    totalQuantity: 40,
    totalAmount: 212400,
    taxAmount: 32400,
    status: 'partial',
    createdAt: '2026-04-03',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-240404-502',
    date: '2026-04-04',
    customerId: 'c-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Warehouse Road\nAhmedabad, GJ 380015',
    piId: 'pi-2',
    piNo: 'PI-240402-114',
    items: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', quantity: 20, rate: 8200, taxPercent: 18, amount: 164000 },
    ],
    totalQuantity: 20,
    totalAmount: 193520,
    taxAmount: 29520,
    status: 'completed',
    createdAt: '2026-04-04',
  },
];

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await invoiceApi.getAll();
        if (active) {
          if (useMock && data.length === 0) {
            setRecords(mockInvoices);
          } else {
            setRecords(data);
          }
        }
      } catch {
        if (active) setRecords(useMock ? mockInvoices : []);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (!q) return true;
      const text = `${r.invoiceNo} ${r.customerName}`.toLowerCase();
      return text.includes(q);
    });
  }, [records, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Final Invoice</h1>
        <Button onClick={() => navigate('/invoices/create')}>
          <Plus className="h-4 w-4 mr-2" /> Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search by invoice no or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Invoice No</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[180px]">Customer Name</TableHead>
                <TableHead className="min-w-[140px]">PI No</TableHead>
                <TableHead className="min-w-[140px] text-right">Total Qty</TableHead>
                <TableHead className="min-w-[160px] text-right">Total Amount</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="min-w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.invoiceNo}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>{record.piNo || record.piId}</TableCell>
                  <TableCell className="text-right">{record.totalQuantity}</TableCell>
                  <TableCell className="text-right font-medium">₹{record.totalAmount.toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[record.status]}`}>
                      {STATUS_LABELS[record.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${record.id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/invoices/${record.id}`, '_blank')}
                      >
                        <Printer className="h-4 w-4 mr-1" /> Print
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
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
