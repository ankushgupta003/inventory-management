import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Eye, CheckCircle, PackageCheck, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useMRSList } from '../hooks/useMRS';
import type { MRSRecord, MRSStatus } from '../types';
import { toast } from 'sonner';

const statusVariantMap: Record<MRSStatus, 'pending' | 'info' | 'success'> = {
  pending: 'pending',
  approved: 'info',
  issued: 'success',
};

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

  const columns = [
    { key: 'mrsNo', header: 'MRS No', render: (r: MRSRecord) => <span className="font-medium text-primary">{r.mrsNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'department', header: 'Department' },
    { key: 'items', header: 'Total Items', render: (r: MRSRecord) => r.items.length },
    {
      key: 'status', header: 'Status',
      render: (r: MRSRecord) => <StatusBadge status={statusVariantMap[r.status]} label={r.status} />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Material Requisition Slip (MRS)</h1>
        </div>
        <Button onClick={() => navigate('/mrs/create')}>
          <Plus className="h-4 w-4 mr-2" /> Create MRS
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search MRS no, department..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v as MRSStatus | 'all' })}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
            </SelectContent>
          </Select>
          {(filters.search || filters.status !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ search: '', status: 'all' })}>Clear</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable<MRSRecord>
        columns={columns}
        data={records}
        pageSize={10}
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/mrs/${row.id}`)}>
              <Eye className="h-3.5 w-3.5 mr-1" /> View
            </Button>
            {row.status === 'pending' && (
              <Button variant="ghost" size="sm" className="text-info" onClick={() => setConfirmAction({ id: row.id, action: 'approved' })}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
            )}
            {row.status === 'approved' && (
              <Button variant="ghost" size="sm" className="text-success" onClick={() => navigate(`/mrs/${row.id}/issue`)}>
                <PackageCheck className="h-3.5 w-3.5 mr-1" /> Issue
              </Button>
            )}
          </div>
        )}
      />

      <div className="text-sm text-muted-foreground">Showing {records.length} records</div>

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
