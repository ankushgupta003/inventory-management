import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Download, Eye, PackageCheck, Plus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListPageShell, ListTablePanel } from '@/components/list';
import CompactSelect from '@/components/CompactSelect';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { useMRSList } from '../hooks/useMRS';
import type { MRSRecord, MRSStatus } from '../types';
import { getMRSProgress } from '../utils/mrsProgress';

export default function MRSListPage() {
  const navigate = useNavigate();
  const { records, filters, setFilters, updateStatus } = useMRSList();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approved' | 'issued' } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    updateStatus(confirmAction.id, confirmAction.action);
    toast.success(`MRS ${confirmAction.action === 'approved' ? 'approved' : 'marked as issued'} successfully`);
    setConfirmAction(null);
  };

  const summary = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending').length;
    const approved = records.filter((r) => r.status === 'approved').length;
    const issued = records.filter((r) => r.status === 'issued').length;
    const qty = records.reduce((sum, r) => sum + r.items.reduce((s, i) => s + (i.qtyRequested || 0), 0), 0);
    return { pending, approved, issued, qty };
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`mrs-list-${csvDateSuffix()}.csv`, [
      ['MRS No', 'Date', 'Department', 'Batch', 'Total Items', 'Status'],
      ...records.map((r) => [
        r.mrsNo,
        r.date,
        r.department,
        r.productionBatchNo || '-',
        r.items.length,
        getMRSProgress(r.items).status,
      ]),
    ]);
  };

  const columns = [
    { key: 'mrsNo', header: 'MRS No', render: (r: MRSRecord) => <span className="font-medium text-primary">{r.mrsNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'department', header: 'Department' },
    { key: 'productionBatchNo', header: 'Production Batch', render: (r: MRSRecord) => <span className="font-mono text-xs">{r.productionBatchNo || '-'}</span> },
    { key: 'items', header: 'Total Items', render: (r: MRSRecord) => r.items.length },
    {
      key: 'status',
      header: 'Status',
      render: (r: MRSRecord) => {
        const progress = getMRSProgress(r.items);
        const label = progress.status.charAt(0).toUpperCase() + progress.status.slice(1);
        return <StatusBadge status={progress.status} label={label} />;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Material Requisition Slip"
        description={`${records.length.toLocaleString('en-IN')} MRS records. ${summary.pending.toLocaleString('en-IN')} pending, ${summary.approved.toLocaleString('en-IN')} approved, ${summary.issued.toLocaleString('en-IN')} issued.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'MRS' }]}
      />

      <ListTablePanel
        title="MRS Records"
        description={`${records.length} records`}
        leftContent={(
          <>
            <div className="table-toolbar-search">
              <Input
                placeholder="Search MRS no or department"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <CompactSelect
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value as MRSStatus | 'all' })}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'issued', label: 'Issued' },
              ]}
              className="table-toolbar-control-sm"
            />
            <Button className="table-toolbar-button" variant="outline" onClick={() => setFilters({ search: '', status: 'all' })}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </>
        )}
        rightContent={(
          <>
            <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="table-toolbar-button" onClick={() => navigate('/mrs/create')}>
              <Plus className="mr-2 h-4 w-4" /> Create MRS
            </Button>
          </>
        )}
      >
        <DataTable<MRSRecord>
          columns={columns}
          data={records}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/mrs/${row.id}`)} />
              {row.status === 'pending' && (
                <TableActionButton
                  label="Approve"
                  icon={CheckCircle}
                  tone="emerald"
                  onClick={() => setConfirmAction({ id: row.id, action: 'approved' })}
                />
              )}
              {row.status === 'approved' && (
                <TableActionButton label="Issue" icon={PackageCheck} tone="emerald" onClick={() => navigate(`/mrs/${row.id}/issue`)} />
              )}
            </div>
          )}
        />
      </ListTablePanel>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Approve MRS"
        description="Are you sure you want to approve this Material Requisition Slip?"
      />
    </div>
  );
}
