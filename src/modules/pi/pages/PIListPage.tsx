import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, FileCheck, Lock, Pencil, Plus, RotateCcw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import CompactSelect from '@/components/CompactSelect';
import { ListPageShell, ListTablePanel } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { piApi } from '../services/piApi';
import type { PIStatus, ProformaInvoiceRecord } from '../types';

const STATUS_LABELS: Record<PIStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  closed: 'Closed',
};

const statusColors: Record<PIStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
};

const remainingQtyForRecord = (record: ProformaInvoiceRecord) =>
  record.items.reduce((sum, item) => sum + (item.remainingQty || 0), 0);

const canEditRecord = (record: ProformaInvoiceRecord) =>
  record.status === 'pending' && record.items.every((item) => (item.invoicedQty || 0) <= 0);

export default function PIListPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState<ProformaInvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | PIStatus>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const canCreatePi = hasPermission('proforma_invoices.create');
  const canEditPi = hasPermission('proforma_invoices.edit');
  const canCreateInvoice = hasPermission('invoices.create');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await piApi.getAll();
        if (active) {
          setRecords(data);
        }
      } catch {
        if (active) {
          setRecords([]);
          toast.error('Failed to load proforma invoices');
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
      return `${record.piNo} ${record.customerName}`.toLowerCase().includes(query);
    });
  }, [dateFrom, dateTo, records, search, status]);

  const summary = useMemo(() => {
    const totalAmount = records.reduce((sum, record) => sum + record.totalAmount, 0);
    const pendingCount = records.filter((record) => record.status === 'pending').length;
    const partialCount = records.filter((record) => record.status === 'partial').length;
    const openQty = records
      .filter((record) => record.status === 'pending' || record.status === 'partial')
      .reduce((sum, record) => sum + remainingQtyForRecord(record), 0);

    return { totalAmount, pendingCount, partialCount, openQty };
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`proforma-invoice-list-${csvDateSuffix()}.csv`, [
      ['PI No', 'Date', 'Customer', 'Total Items', 'Total Qty', 'Remaining Qty', 'Total Amount', 'Status'],
      ...filtered.map((record) => [
        record.piNo,
        record.date,
        record.customerName,
        record.items.length,
        record.totalQuantity,
        remainingQtyForRecord(record),
        record.totalAmount,
        STATUS_LABELS[record.status],
      ]),
    ]);
  };

  const handleClose = async (record: ProformaInvoiceRecord) => {
    try {
      const updated = await piApi.close(record.id);
      setRecords((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      toast.success('PI closed');
    } catch {
      toast.error('Failed to close PI');
    }
  };

  const columns = [
    { key: 'piNo', header: 'PI No', render: (record: ProformaInvoiceRecord) => <span className="font-medium text-primary">{record.piNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'customerName', header: 'Customer' },
    { key: 'itemCount', header: 'Lines', className: 'text-right', render: (record: ProformaInvoiceRecord) => record.items.length },
    { key: 'totalQuantity', header: 'Ordered Qty', className: 'text-right' },
    { key: 'remainingQty', header: 'Remaining Qty', className: 'text-right', render: (record: ProformaInvoiceRecord) => remainingQtyForRecord(record).toLocaleString('en-IN') },
    { key: 'totalAmount', header: 'Amount', className: 'text-right', render: (record: ProformaInvoiceRecord) => `INR ${record.totalAmount.toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: (record: ProformaInvoiceRecord) => <Badge variant="secondary" className={statusColors[record.status]}>{STATUS_LABELS[record.status]}</Badge> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Proforma Invoice"
        description={`${records.length.toLocaleString('en-IN')} PI records. ${summary.pendingCount.toLocaleString('en-IN')} pending, ${summary.partialCount.toLocaleString('en-IN')} partial, open qty ${summary.openQty.toLocaleString('en-IN')}.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Proforma Invoice' }]}
      />

      <ListTablePanel
        title="PI Records"
        description={`${filtered.length} records`}
        leftContent={(
          <>
            <div className="table-toolbar-search">
              <Input placeholder="Search PI no or customer" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <CompactSelect
              value={status}
              onChange={(value) => setStatus(value as 'all' | PIStatus)}
              options={[{ value: 'all', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
              className="table-toolbar-control-sm"
            />
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="table-toolbar-date" />
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="table-toolbar-date" />
            <Button className="table-toolbar-button" variant="outline" onClick={() => { setSearch(''); setStatus('all'); setDateFrom(''); setDateTo(''); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </>
        )}
        rightContent={(
          <>
            <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            {canCreatePi ? (
              <Button className="table-toolbar-button" onClick={() => navigate('/proforma-invoices/create')}>
                <Plus className="mr-2 h-4 w-4" /> Create PI
              </Button>
            ) : null}
          </>
        )}
      >
        <DataTable<ProformaInvoiceRecord>
          columns={columns}
          data={filtered}
          isLoading={loading}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => {
            const canConvert = row.status !== 'completed' && row.status !== 'closed' && remainingQtyForRecord(row) > 0;
            const canClose = row.status !== 'completed' && row.status !== 'closed';

            return (
              <div className="flex items-center justify-end gap-1">
                <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/proforma-invoices/${row.id}`)} />
                {canEditPi && canEditRecord(row) ? (
                  <TableActionButton label="Edit" icon={Pencil} tone="indigo" onClick={() => navigate(`/proforma-invoices/${row.id}/edit`)} />
                ) : null}
                {canCreateInvoice ? (
                  <TableActionButton
                    label="Convert"
                    icon={FileCheck}
                    tone="emerald"
                    disabled={!canConvert}
                    onClick={() => navigate(`/invoices/create?piId=${row.id}`)}
                  />
                ) : null}
                {canEditPi ? (
                  <TableActionButton
                    label="Close"
                    icon={Lock}
                    tone="rose"
                    disabled={!canClose}
                    onClick={() => handleClose(row)}
                  />
                ) : null}
              </div>
            );
          }}
        />
      </ListTablePanel>
    </div>
  );
}
