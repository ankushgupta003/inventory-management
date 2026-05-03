import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, Eye, FilePlus2, FlaskConical, Plus, RotateCcw, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import CompactSelect from '@/components/CompactSelect';
import { ListPageShell, ListTablePanel } from '@/components/list';
import { useAuth } from '@/contexts/AuthContext';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { qualityRequestsApi } from '../services/qualityRequestsApi';
import type { QualityRequestRecord, QualityRequestSourceType, QualityRequestStatus } from '../types';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<QualityRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | QualityRequestStatus>('all');
  const [sourceType, setSourceType] = useState<'all' | QualityRequestSourceType>(
    searchParams.get('sourceType') === 'sampling' ? 'sampling' : 'all',
  );
  const [stockMovementIdFilter, setStockMovementIdFilter] = useState(searchParams.get('stockMovementId') || '');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveBy, setApproveBy] = useState(user?.fullName || 'QA Manager');
  const [approveRemarks, setApproveRemarks] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeId, setCloseId] = useState<string | null>(null);
  const [closeDecision, setCloseDecision] = useState<'accept' | 'reject'>('accept');
  const [closeRemarks, setCloseRemarks] = useState('');

  useEffect(() => {
    if (user?.fullName) {
      setApproveBy(user.fullName);
    }
  }, [user?.fullName]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await qualityRequestsApi.getAll({
          sourceType,
          stockMovementId: stockMovementIdFilter || undefined,
        });
        if (active) {
          setRecords(data);
          setLoadError('');
        }
      } catch {
        if (active) {
          setRecords([]);
          setLoadError('Unable to load quality requests from the server.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [sourceType, stockMovementIdFilter]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (sourceType !== 'all') {
      next.set('sourceType', sourceType);
    }
    if (stockMovementIdFilter) {
      next.set('stockMovementId', stockMovementIdFilter);
    }
    setSearchParams(next, { replace: true });
  }, [setSearchParams, sourceType, stockMovementIdFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return `${r.requestNo} ${r.itemName} ${r.batchNo} ${r.stockMovementNo || ''} ${r.productionBatchNo || ''}`.toLowerCase().includes(q);
    });
  }, [records, search, status]);

  const summary = useMemo(() => {
    const pending = records.filter((r) => r.status === 'pending').length;
    const testing = records.filter((r) => r.status === 'approved' || r.status === 'under_testing').length;
    const completed = records.filter((r) => r.status === 'completed').length;
    const closed = records.filter((r) => r.status === 'closed').length;
    return { pending, testing, completed, closed };
  }, [records]);

  const exportCsv = () => {
    exportCsvFile(`quality-request-list-${csvDateSuffix()}.csv`, [
      ['Request No', 'Date', 'Item', 'Item Type', 'Batch', 'Issue Type', 'Source', 'Movement No', 'Production Batch', 'Status'],
      ...filtered.map((r) => [
        r.requestNo,
        r.date,
        r.itemName,
        r.itemType || '-',
        r.batchNo,
        issueLabel[r.issueType],
        r.sourceType || 'manual',
        r.stockMovementNo || '-',
        r.productionBatchNo || '-',
        r.status,
      ]),
    ]);
  };

  const openApprove = (id: string) => {
    setApproveId(id);
    setApproveRemarks('');
    setApproveBy(user?.fullName || 'QA Manager');
    setApproveOpen(true);
  };

  const openClose = (record: QualityRequestRecord) => {
    setCloseId(record.id);
    setCloseDecision(record.testResult === 'fail' ? 'reject' : 'accept');
    setCloseRemarks('');
    setCloseOpen(true);
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
      const updated = await qualityRequestsApi.close(id, { decision: closeDecision, remarks: closeRemarks });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success('Request closed');
      setCloseOpen(false);
    } catch {
      toast.error('Failed to close request');
    }
  };

  const columns = [
    { key: 'requestNo', header: 'Request No', render: (r: QualityRequestRecord) => <span className="font-medium text-primary">{r.requestNo}</span> },
    { key: 'date', header: 'Date' },
    { key: 'itemName', header: 'Item' },
    {
      key: 'itemType',
      header: 'Item Type',
      render: (r: QualityRequestRecord) => r.itemType ? (r.itemType === 'raw' ? 'Raw' : 'Finished') : '-',
    },
    { key: 'batchNo', header: 'Batch', render: (r: QualityRequestRecord) => <span className="font-mono text-xs">{r.batchNo}</span> },
    { key: 'issueType', header: 'Issue Type', render: (r: QualityRequestRecord) => issueLabel[r.issueType] },
    {
      key: 'source',
      header: 'Source',
      render: (r: QualityRequestRecord) => r.sourceType === 'sampling' ? `Sampling${r.stockMovementNo ? ` | ${r.stockMovementNo}` : ''}` : 'Manual',
    },
    {
      key: 'productionBatchNo',
      header: 'Production Batch',
      render: (r: QualityRequestRecord) => r.productionBatchNo || '-',
    },
    { key: 'status', header: 'Status', render: (r: QualityRequestRecord) => <StatusBadge status={statusVariant[r.status]} label={r.status.replace('_', ' ')} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ListPageShell
        title="Quality Testing"
        description={`${records.length.toLocaleString('en-IN')} requests. ${summary.pending.toLocaleString('en-IN')} pending approval, ${summary.testing.toLocaleString('en-IN')} in testing, ${summary.completed.toLocaleString('en-IN')} reported.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Quality Testing' }]}
      />

      <div className="simple-status-grid">
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Requests</div>
          <div className="mt-2 text-2xl font-semibold">{records.length.toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Pending Approval</div>
          <div className="mt-2 text-2xl font-semibold">{summary.pending.toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Ready / In Testing</div>
          <div className="mt-2 text-2xl font-semibold">{summary.testing.toLocaleString('en-IN')}</div>
        </div>
        <div className="simple-status-summary">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Reported / Closed</div>
          <div className="mt-2 text-2xl font-semibold">{(summary.completed + summary.closed).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <ListTablePanel
        title="Quality Requests"
        description={`${filtered.length} records`}
        leftContent={(
          <>
            <div className="table-toolbar-search relative">
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
              className="table-toolbar-control"
            />
            <CompactSelect
              value={sourceType}
              onChange={(value) => setSourceType(value as 'all' | QualityRequestSourceType)}
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'sampling', label: 'Sampling' },
              ]}
              className="table-toolbar-control-sm"
            />
            {stockMovementIdFilter ? (
              <Input value={stockMovementIdFilter} readOnly className="table-toolbar-field bg-muted/50" />
            ) : null}
            <Button
              className="table-toolbar-button"
              variant="outline"
              onClick={() => {
                setSearch('');
                setStatus('all');
                setSourceType('all');
                setStockMovementIdFilter('');
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
          </>
        )}
        rightContent={(
          <>
            <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button className="table-toolbar-button" onClick={() => navigate('/quality-requests/create')}>
              <Plus className="mr-2 h-4 w-4" /> Create Request
            </Button>
          </>
        )}
      >
        {stockMovementIdFilter ? (
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Filtered to sampling reports created from stock movement ID {stockMovementIdFilter}.
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}
        <DataTable<QualityRequestRecord>
          columns={columns}
          data={filtered}
          pageSize={10}
          pageSizeOptions={[10, 25, 50, 100]}
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/quality-requests/${row.id}`)} />
              {row.status === 'pending' && (
                <TableActionButton label="Approve" icon={CheckCircle} tone="emerald" onClick={() => openApprove(row.id)} />
              )}
              {(row.status === 'approved' || row.status === 'under_testing') && (
                <TableActionButton
                  label="Add Report"
                  icon={FilePlus2}
                  tone="cyan"
                  onClick={() => navigate(`/quality-requests/${row.id}/testing`)}
                />
              )}
              {row.status === 'completed' && (
                <TableActionButton label="Close" icon={XCircle} tone="rose" onClick={() => openClose(row)} />
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

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Quality Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Final Decision</Label>
              <Select value={closeDecision} onValueChange={(value) => setCloseDecision(value as 'accept' | 'reject')}>
                <SelectTrigger><SelectValue placeholder="Decision" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Closure Remarks</Label>
              <Textarea rows={3} value={closeRemarks} onChange={(e) => setCloseRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button onClick={() => closeId && handleClose(closeId)}>Close Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
