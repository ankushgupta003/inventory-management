import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileCheck, Lock, ReceiptText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import CompactSelect from '@/components/CompactSelect';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { piApi } from '../services/piApi';
import { invoiceAPI } from '@/services/api';
import type { PIStatus, ProformaInvoiceRecord } from '../types';

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

const useMock = import.meta.env.DEV;

const mockPI: ProformaInvoiceRecord[] = [
  {
    id: 'pi-1',
    piNo: 'PI-240401-101',
    date: '2026-04-01',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21',
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
    customerAddress: 'Ring Road',
    items: [{ itemId: 'fg-3', itemName: 'Packing Box Large', quantity: 200, rate: 45, amount: 9000 }],
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await piApi.getAll();
        if (!active) return;
        setRecords(useMock && data.length === 0 ? mockPI : data);
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
      return `${r.piNo} ${r.customerName}`.toLowerCase().includes(q);
    });
  }, [records, search, status, dateFrom, dateTo]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending').length;
    const partial = records.filter((r) => r.status === 'partial').length;
    const completed = records.filter((r) => r.status === 'completed').length;
    const totalAmount = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    return [
      { id: 'all', label: 'Total PI', value: records.length.toLocaleString('en-IN'), icon: ReceiptText, tone: 'blue' },
      { id: 'pending', label: 'Pending', value: pending.toLocaleString('en-IN'), icon: Lock, tone: 'orange' },
      { id: 'partial', label: 'Partial', value: partial.toLocaleString('en-IN'), icon: FileCheck, tone: 'purple' },
      { id: 'amount', label: 'Total Amount', value: `INR ${totalAmount.toLocaleString('en-IN')}`, icon: Users, tone: 'green' },
      { id: 'completed', label: 'Completed', value: completed.toLocaleString('en-IN'), icon: FileCheck, tone: 'green' },
    ].slice(0, 4);
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`proforma-invoice-list-${csvDateSuffix()}.csv`, [
      ['PI No', 'Date', 'Customer', 'Total Items', 'Total Qty', 'Total Amount', 'Status'],
      ...filtered.map((r) => [r.piNo, r.date, r.customerName, r.items.length, r.totalQuantity, r.totalAmount, STATUS_LABELS[r.status]]),
    ]);
  };

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
      toast.error('Failed to convert PI');
    }
  };

  const columns = [
    { key: 'piNo', header: 'PI No', render: (r: ProformaInvoiceRecord) => <span className="font-medium text-primary">{r.piNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'totalItems', header: 'Total Items', className: 'text-right', render: (r: ProformaInvoiceRecord) => r.items.length },
    { key: 'totalQuantity', header: 'Total Qty', className: 'text-right' },
    { key: 'totalAmount', header: 'Total Amount', className: 'text-right', render: (r: ProformaInvoiceRecord) => `INR ${r.totalAmount.toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: (r: ProformaInvoiceRecord) => <Badge variant="secondary" className={statusColors[r.status]}>{STATUS_LABELS[r.status]}</Badge> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Proforma Invoice"
        description="Manage PI lifecycle before invoice conversion."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Proforma Invoice' }]}
        addLabel="Create PI"
        onAdd={() => navigate('/proforma-invoices/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[220px] flex-1">
          <Input placeholder="Search PI no or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <CompactSelect
          value={status}
          onChange={(value) => setStatus(value as 'all' | PIStatus)}
          options={[{ value: 'all', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))]}
          className="w-40"
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setDateFrom(''); setDateTo(''); }}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="PI Records" description={`${filtered.length} records`}>
        <DataTable<ProformaInvoiceRecord>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/proforma-invoices/${row.id}`)}><Eye className="mr-1 h-4 w-4" /> View</Button>
              <Button variant="ghost" size="sm" onClick={() => handleConvert(row)}><FileCheck className="mr-1 h-4 w-4" /> Convert</Button>
              <Button variant="ghost" size="sm" disabled={row.status === 'closed'} onClick={() => handleClose(row)}><Lock className="mr-1 h-4 w-4" /> Close</Button>
            </div>
          )}
        />
      </ListTablePanel>
    </div>
  );
}

