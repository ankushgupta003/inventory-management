import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { piApi } from '../services/piApi';
import { invoiceAPI } from '@/services/api';
import type { ProformaInvoiceRecord, PIStatus } from '../types';

const STATUS_LABELS: Record<PIStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  closed: 'Closed',
};

const statusColors: Record<PIStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-700',
};

const pageSize = 10;
const useMock = import.meta.env.DEV;

const mockPI: ProformaInvoiceRecord[] = [
  {
    id: 'pi-1',
    piNo: 'PI-240401-101',
    date: '2026-04-01',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21, Industrial Area\nPune, MH 411019',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', quantity: 50, rate: 4500, amount: 225000 },
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, rate: 8200, amount: 164000 },
    ],
    totalQuantity: 70,
    totalAmount: 389000,
    status: 'partial',
    createdAt: '2026-04-01',
  },
  {
    id: 'pi-2',
    piNo: 'PI-240402-114',
    date: '2026-04-02',
    customerId: 'c-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Warehouse Road\nAhmedabad, GJ 380015',
    items: [
      { itemId: 'fg-3', itemName: 'Packing Box Large', quantity: 200, rate: 45, amount: 9000 },
    ],
    totalQuantity: 200,
    totalAmount: 9000,
    status: 'pending',
    createdAt: '2026-04-02',
  },
];

export default function PIListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<ProformaInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PIStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await piApi.getAll();
        if (active) {
          if (useMock && data.length === 0) {
            setRecords(mockPI);
          } else {
            setRecords(data);
          }
        }
      } catch {
        if (active) setRecords(useMock ? mockPI : []);
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
      if (status !== 'all' && r.status !== status) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (!q) return true;
      const text = `${r.piNo} ${r.customerName}`.toLowerCase();
      return text.includes(q);
    });
  }, [records, search, status, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status, dateFrom, dateTo]);

  const handleClose = async (record: ProformaInvoiceRecord) => {
    try {
      await piApi.updateStatus(record.id, 'closed');
      setRecords((prev) => prev.map((r) => (r.id === record.id ? { ...r, status: 'closed' } : r)));
      toast.success('PI closed');
    } catch {
      toast.error('Failed to close PI');
    }
  };

  const handleConvert = async (record: ProformaInvoiceRecord) => {
    try {
      await invoiceAPI.createFromPI(record.id, {});
      toast.success('Invoice created from PI');
    } catch {
      toast.error('Failed to convert to invoice');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Proforma Invoice (PI)</h1>
        <Button onClick={() => navigate('/proforma-invoices/create')}>
          <Plus className="h-4 w-4 mr-2" /> Create PI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-border rounded-lg p-4">
        <Input
          placeholder="Search by customer or PI no"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onValueChange={(v) => setStatus(v as 'all' | PIStatus)}>
          <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">PI No</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[180px]">Customer Name</TableHead>
                <TableHead className="min-w-[120px] text-right">Total Items</TableHead>
                <TableHead className="min-w-[140px] text-right">Total Quantity</TableHead>
                <TableHead className="min-w-[140px] text-right">Total Amount</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="min-w-[220px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Loading PI records...
                  </TableCell>
                </TableRow>
              )}
              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No PI records found.
                  </TableCell>
                </TableRow>
              )}
              {paginated.map((record) => {
                const totalItems = record.items?.length ?? 0;
                const totalQty = record.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.piNo}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.customerName}</TableCell>
                    <TableCell className="text-right">{totalItems}</TableCell>
                    <TableCell className="text-right">{totalQty}</TableCell>
                    <TableCell className="text-right font-medium">₹{record.totalAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${statusColors[record.status]}`}>
                        {STATUS_LABELS[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/proforma-invoices/${record.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        {record.status === 'pending' ? (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/proforma-invoices/${record.id}`)}>
                            Edit
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" disabled>
                            Edit
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleConvert(record)}>
                          <FileCheck className="h-4 w-4 mr-1" /> Convert
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={record.status === 'closed'}
                          onClick={() => handleClose(record)}
                        >
                          <Lock className="h-4 w-4 mr-1" /> Close
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
