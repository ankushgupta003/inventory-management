import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ClipboardList, Eye, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/DataTable';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
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

  const kpis: ListPageKpi[] = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending').length;
    const approved = records.filter((r) => r.status === 'approved').length;
    const issued = records.filter((r) => r.status === 'issued').length;
    const qty = records.reduce((sum, r) => sum + r.items.reduce((s, i) => s + (i.qtyRequested || 0), 0), 0);
    return [
      { id: 'all', label: 'Total MRS', value: records.length.toLocaleString('en-IN'), icon: ClipboardList, tone: 'blue' },
      { id: 'pending', label: 'Pending', value: pending.toLocaleString('en-IN'), icon: ClipboardList, tone: 'orange' },
      { id: 'approved', label: 'Approved', value: approved.toLocaleString('en-IN'), icon: CheckCircle, tone: 'purple' },
      { id: 'qty', label: 'Requested Qty', value: qty.toLocaleString('en-IN'), icon: PackageCheck, tone: 'green' },
      { id: 'issued', label: 'Issued', value: issued.toLocaleString('en-IN'), icon: PackageCheck, tone: 'green' },
    ].slice(0, 4);
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
        description="Track requisitions from request to issue completion."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'MRS' }]}
        addLabel="Create MRS"
        onAdd={() => navigate('/mrs/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="min-w-[240px] flex-1">
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
          className="w-40"
        />
        <Button variant="outline" onClick={() => setFilters({ search: '', status: 'all' })}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="MRS Records" description={`${records.length} records`}>
        <DataTable<MRSRecord>
          columns={columns}
          data={records}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/mrs/${row.id}`)}>
                <Eye className="mr-1 h-4 w-4" /> View
              </Button>
              {row.status === 'pending' && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ id: row.id, action: 'approved' })}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
              )}
              {row.status === 'approved' && (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/mrs/${row.id}/issue`)}>
                  <PackageCheck className="mr-1 h-4 w-4" /> Issue
                </Button>
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

