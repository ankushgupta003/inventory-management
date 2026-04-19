import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileCheck, Printer, ReceiptText, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
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

const useMock = import.meta.env.DEV;

const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-240403-501',
    date: '2026-04-03',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21',
    piId: 'pi-1',
    piNo: 'PI-240401-101',
    items: [{ itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', quantity: 40, rate: 4500, taxPercent: 18, amount: 180000 }],
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
    customerAddress: 'Ring Road',
    piId: 'pi-2',
    piNo: 'PI-240402-114',
    items: [{ itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', quantity: 20, rate: 8200, taxPercent: 18, amount: 164000 }],
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await invoiceApi.getAll();
        if (!active) return;
        setRecords(useMock && data.length === 0 ? mockInvoices : data);
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
      return `${r.invoiceNo} ${r.customerName}`.toLowerCase().includes(q);
    });
  }, [records, search, dateFrom, dateTo]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const completed = records.filter((r) => r.status === 'completed').length;
    const partial = records.filter((r) => r.status === 'partial').length;
    const totalQty = records.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
    const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    return [
      { id: 'total', label: 'Total Invoices', value: records.length.toLocaleString('en-IN'), icon: ReceiptText, tone: 'blue' },
      { id: 'completed', label: 'Completed', value: completed.toLocaleString('en-IN'), icon: FileCheck, tone: 'green' },
      { id: 'partial', label: 'Partial', value: partial.toLocaleString('en-IN'), icon: FileCheck, tone: 'orange' },
      { id: 'amount', label: 'Total Amount', value: `INR ${totalAmount.toLocaleString('en-IN')}`, icon: Users, tone: 'purple' },
      { id: 'qty', label: 'Total Qty', value: totalQty.toLocaleString('en-IN'), icon: Users, tone: 'blue' },
    ].slice(0, 4);
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`invoice-list-${csvDateSuffix()}.csv`, [
      ['Invoice No', 'Date', 'Customer', 'PI No', 'Total Qty', 'Total Amount', 'Status'],
      ...filtered.map((r) => [r.invoiceNo, r.date, r.customerName, r.piNo || r.piId, r.totalQuantity, r.totalAmount, STATUS_LABELS[r.status]]),
    ]);
  };

  const columns = [
    { key: 'invoiceNo', header: 'Invoice No', render: (r: InvoiceRecord) => <span className="font-medium text-primary">{r.invoiceNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'piNo', header: 'PI No', render: (r: InvoiceRecord) => r.piNo || r.piId },
    { key: 'totalQuantity', header: 'Total Qty', className: 'text-right' },
    { key: 'totalAmount', header: 'Total Amount', className: 'text-right', render: (r: InvoiceRecord) => `INR ${r.totalAmount.toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: (r: InvoiceRecord) => <Badge variant="secondary" className={statusColors[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Final Invoice"
        description="Track final billed records with print-ready history."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Final Invoice' }]}
        addLabel="Create Invoice"
        onAdd={() => navigate('/invoices/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[220px] flex-1">
          <Input placeholder="Search invoice no or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        <Button variant="outline" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="Invoice Records" description={`${filtered.length} records`}>
        <DataTable<InvoiceRecord>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${row.id}`)}>
                <Eye className="mr-1 h-4 w-4" /> View
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.open(`/invoices/${row.id}`, '_blank')}>
                <Printer className="mr-1 h-4 w-4" /> Print
              </Button>
            </div>
          )}
        />
      </ListTablePanel>
    </div>
  );
}

