import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, Printer, ReceiptText, RotateCcw, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import CompactSelect from '@/components/CompactSelect';
import { ListPageShell, ListTablePanel } from '@/components/list';
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

  const summary = useMemo(() => {
    const completed = records.filter((record) => record.status === 'completed').length;
    const partial = records.filter((record) => record.status === 'partial').length;
    const totalQty = records.reduce((sum, record) => sum + record.totalQuantity, 0);
    const totalAmount = records.reduce((sum, record) => sum + invoiceTotal(record), 0);

    return { completed, partial, totalQty, totalAmount };
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
        description={`${records.length.toLocaleString('en-IN')} invoices. ${summary.completed.toLocaleString('en-IN')} completed, ${summary.partial.toLocaleString('en-IN')} partial, billed amount INR ${summary.totalAmount.toLocaleString('en-IN')}.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Final Invoice' }]}
      />

      <ListTablePanel
  title="Invoice Records"
  description={`${filtered.length} records`}
  leftContent={
    <>
      <div className="table-toolbar-search">
        <Input
          placeholder="Search invoice no, PI no, or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <CompactSelect
        value={status}
        onChange={(value) => setStatus(value as 'all' | InvoiceStatus)}
        options={[
          { value: 'all', label: 'All Status' },
          ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        ]}
        className="table-toolbar-control"
      />

      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="table-toolbar-date"
      />

      <Input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="table-toolbar-date"
      />

      <Button
        variant="outline"
        className="table-toolbar-button"
        onClick={() => {
          setSearch('');
          setStatus('all');
          setDateFrom('');
          setDateTo('');
        }}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Clear
      </Button>
    </>
  }
  rightContent={
    <>
      <Button variant="outline" className="table-toolbar-button" onClick={exportCsv}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>

      {canCreateInvoice && (
        <Button className="table-toolbar-button" onClick={() => navigate('/invoices/create')}>
          <ReceiptText className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      )}
    </>
  }
>
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
