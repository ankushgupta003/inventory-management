import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileCheck, Printer, ReceiptText, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import CompactSelect from '@/components/CompactSelect';
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
  partial: 'bg-blue-100 text-blue-800',
};

const invoiceTotal = (record: InvoiceRecord) => record.grandTotal ?? (record.totalAmount + record.taxAmount);

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | InvoiceStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const canCreateInvoice = hasPermission('invoices.create');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await invoiceApi.getAll();
        if (active) {
          setRecords(data);
        }
      } catch {
        if (active) {
          setRecords([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (status !== 'all' && record.status !== status) return false;
      if (dateFrom && record.date < dateFrom) return false;
      if (dateTo && record.date > dateTo) return false;
      if (!query) return true;
      return `${record.invoiceNo} ${record.customerName} ${record.piNo || ''}`.toLowerCase().includes(query);
    });
  }, [dateFrom, dateTo, records, search, status]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const completed = records.filter((record) => record.status === 'completed').length;
    const partial = records.filter((record) => record.status === 'partial').length;
    const totalQty = records.reduce((sum, record) => sum + record.totalQuantity, 0);
    const totalAmount = records.reduce((sum, record) => sum + invoiceTotal(record), 0);

    return [
      { id: 'total', label: 'Total Invoices', value: records.length.toLocaleString('en-IN'), icon: ReceiptText, tone: 'blue' },
      { id: 'completed', label: 'Completed', value: completed.toLocaleString('en-IN'), icon: FileCheck, tone: 'green' },
      { id: 'partial', label: 'Partial', value: partial.toLocaleString('en-IN'), icon: FileCheck, tone: 'orange' },
      { id: 'amount', label: 'Billed Amount', value: `INR ${totalAmount.toLocaleString('en-IN')}`, icon: Wallet, tone: 'purple' },
      { id: 'qty', label: 'Invoice Qty', value: totalQty.toLocaleString('en-IN'), icon: Wallet, tone: 'blue' },
    ].slice(0, 4);
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`invoice-list-${csvDateSuffix()}.csv`, [
      ['Invoice No', 'Date', 'Customer', 'PI No', 'Qty', 'Subtotal', 'Tax', 'Grand Total', 'Status'],
      ...filtered.map((record) => [
        record.invoiceNo,
        record.date,
        record.customerName,
        record.piNo || record.piId,
        record.totalQuantity,
        record.totalAmount,
        record.taxAmount,
        invoiceTotal(record),
        STATUS_LABELS[record.status],
      ]),
    ]);
  };

  const columns = [
    { key: 'invoiceNo', header: 'Invoice No', render: (record: InvoiceRecord) => <span className="font-medium text-primary">{record.invoiceNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'piNo', header: 'PI No', render: (record: InvoiceRecord) => record.piNo || record.piId },
    { key: 'totalQuantity', header: 'Qty', className: 'text-right' },
    { key: 'totalAmount', header: 'Amount', className: 'text-right', render: (record: InvoiceRecord) => `INR ${invoiceTotal(record).toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: (record: InvoiceRecord) => <Badge variant="secondary" className={statusColors[record.status]}>{STATUS_LABELS[record.status]}</Badge> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Final Invoice"
        description="Track immutable invoices created from PIs and open the print-ready saved records."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Final Invoice' }]}
        addLabel={canCreateInvoice ? 'Create Invoice' : undefined}
        onAdd={canCreateInvoice ? () => navigate('/invoices/create') : undefined}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[220px] flex-1">
          <Input placeholder="Search invoice no, PI no, or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <CompactSelect
          value={status}
          onChange={(value) => setStatus(value as 'all' | InvoiceStatus)}
          options={[{ value: 'all', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
          className="w-40"
        />
        <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-[150px]" />
        <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-[150px]" />
        <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); setDateFrom(''); setDateTo(''); }}>
          Clear
        </Button>
      </ListFilterBar>

      <ListTablePanel title="Invoice Records" description={`${filtered.length} records`}>
        <DataTable<InvoiceRecord>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/invoices/${row.id}`)} />
              <TableActionButton label="Print" icon={Printer} tone="indigo" onClick={() => window.open(`/invoices/${row.id}`, '_blank')} />
            </div>
          )}
        />
      </ListTablePanel>
    </div>
  );
}
