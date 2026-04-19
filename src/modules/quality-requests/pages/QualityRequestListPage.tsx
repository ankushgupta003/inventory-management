import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, FilePlus2, FlaskConical, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import CompactSelect from '@/components/CompactSelect';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { qualityRequestsApi } from '../services/qualityRequestsApi';
import type { QualityRequestRecord, QualityRequestStatus } from '../types';

const statusVariant: Record<QualityRequestStatus, 'pending' | 'info' | 'success' | 'warning' | 'closed'> = {
  pending: 'pending',
  approved: 'info',
  under_testing: 'warning',
  completed: 'success',
  closed: 'closed',
};

const issueLabel: Record<QualityRequestRecord['issueType'], string> = {
  defect: 'Defect',
  testing: 'Testing',
  complaint: 'Complaint',
};

export default function QualityRequestListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<QualityRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | QualityRequestStatus>('all');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveBy, setApproveBy] = useState('QA Manager');
  const [approveRemarks, setApproveRemarks] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await qualityRequestsApi.getAll();
        if (active) setRecords(data);
      } catch {
        if (active) setRecords([]);
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
      if (!q) return true;
      return `${r.requestNo} ${r.itemName} ${r.batchNo}`.toLowerCase().includes(q);
    });
  }, [records, search, status]);

  const kpis: ListPageKpi[] = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending').length;
    const testing = records.filter((r) => r.status === 'under_testing').length;
    const completed = records.filter((r) => r.status === 'completed').length;
    return [
      { id: 'all', label: 'Total Requests', value: records.length.toLocaleString('en-IN'), icon: FlaskConical, tone: 'blue' },
      { id: 'pending', label: 'Pending', value: pending.toLocaleString('en-IN'), icon: FlaskConical, tone: 'orange' },
      { id: 'testing', label: 'Under Testing', value: testing.toLocaleString('en-IN'), icon: FlaskConical, tone: 'purple' },
      { id: 'completed', label: 'Completed', value: completed.toLocaleString('en-IN'), icon: CheckCircle, tone: 'green' },
    ];
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`quality-request-list-${csvDateSuffix()}.csv`, [
      ['Request No', 'Date', 'Item', 'Batch', 'Issue Type', 'Status'],
      ...filtered.map((r) => [r.requestNo, r.date, r.itemName, r.batchNo, issueLabel[r.issueType], r.status]),
    ]);
  };

  const openApprove = (id: string) => {
    setApproveId(id);
    setApproveRemarks('');
    setApproveOpen(true);
  };

  const handleApprove = async () => {
    if (!approveId) return;
    try {
      const updated = await qualityRequestsApi.approve(approveId, {
        approvedBy: approveBy || 'QA Manager',
        approvalRemarks: approveRemarks,
      });
      setRecords((prev) => prev.map((r) => (r.id === approveId ? updated : r)));
      toast.success('Request approved');
      setApproveOpen(false);
    } catch {
      toast.error('Failed to approve request');
    }
  };

  const handleClose = async (id: string) => {
    try {
      const updated = await qualityRequestsApi.close(id, { decision: 'accept', remarks: 'Batch accepted' });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Request closed');
    } catch {
      toast.error('Failed to close request');
    }
  };

  const columns = [
    { key: 'requestNo', header: 'Request No', render: (r: QualityRequestRecord) => <span className="font-medium text-primary">{r.requestNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'itemName', header: 'Item' },
    { key: 'batchNo', header: 'Batch', render: (r: QualityRequestRecord) => <span className="font-mono text-xs">{r.batchNo}</span> },
    { key: 'issueType', header: 'Issue Type', render: (r: QualityRequestRecord) => issueLabel[r.issueType] },
    { key: 'status', header: 'Status', render: (r: QualityRequestRecord) => <StatusBadge status={statusVariant[r.status]} label={r.status.replace('_', ' ')} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Quality Testing"
        description="Manage approval, testing progress, and closures."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quality Testing' }]}
        addLabel="Create Request"
        onAdd={() => navigate('/quality-requests/create')}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar>
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search item, batch, request no..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <CompactSelect
          value={status}
          onChange={(value) => setStatus(value as 'all' | QualityRequestStatus)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'under_testing', label: 'Under Testing' },
            { value: 'completed', label: 'Completed' },
            { value: 'closed', label: 'Closed' },
          ]}
          className="w-44"
        />
        <Button variant="outline" onClick={() => { setSearch(''); setStatus('all'); }}>Clear</Button>
      </ListFilterBar>

      <ListTablePanel title="Quality Requests" description={`${filtered.length} records`}>
        <DataTable<QualityRequestRecord>
          columns={columns}
          data={filtered}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/quality-requests/${row.id}`)}>
                <Eye className="mr-1 h-4 w-4" /> View
              </Button>
              {row.status === 'pending' && (
                <Button variant="ghost" size="sm" onClick={() => openApprove(row.id)}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Approve
                </Button>
              )}
              {(row.status === 'approved' || row.status === 'under_testing') && (
                <Button variant="ghost" size="sm" onClick={() => navigate(`/quality-requests/${row.id}/testing`)}>
                  <FilePlus2 className="mr-1 h-4 w-4" /> Add Report
                </Button>
              )}
              {row.status === 'completed' && (
                <Button variant="ghost" size="sm" onClick={() => handleClose(row.id)}>
                  <XCircle className="mr-1 h-4 w-4" /> Close
                </Button>
              )}
            </div>
          )}
        />
      </ListTablePanel>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Quality Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Approved By</Label>
              <Input value={approveBy} onChange={(e) => setApproveBy(e.target.value)} placeholder="QA Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Approval Remarks</Label>
              <Textarea rows={3} value={approveRemarks} onChange={(e) => setApproveRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

