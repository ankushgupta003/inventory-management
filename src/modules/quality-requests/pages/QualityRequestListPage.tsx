import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { CheckCircle, Eye, FilePlus2, FlaskConical, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import PanelCard from '@/components/PanelCard';
import ChartPanelHeader from '@/components/ChartPanelHeader';
import EmptyStatePanel from '@/components/EmptyStatePanel';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import CompactSelect from '@/components/CompactSelect';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<QualityRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | QualityRequestStatus>('all');
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
      try {
        const data = await qualityRequestsApi.getAll();
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
    const testing = records.filter((r) => r.status === 'approved' || r.status === 'under_testing').length;
    const completed = records.filter((r) => r.status === 'completed').length;
    return [
      { id: 'all', label: 'Total Requests', value: records.length.toLocaleString('en-IN'), icon: FlaskConical, tone: 'blue' },
      { id: 'pending', label: 'Pending Approval', value: pending.toLocaleString('en-IN'), icon: FlaskConical, tone: 'orange' },
      { id: 'testing', label: 'Ready / In Testing', value: testing.toLocaleString('en-IN'), icon: FlaskConical, tone: 'purple' },
      { id: 'completed', label: 'Reported', value: completed.toLocaleString('en-IN'), icon: CheckCircle, tone: 'green' },
    ];
  }, [records]);

  const statusMix = useMemo(() => {
    const order: QualityRequestStatus[] = ['pending', 'approved', 'under_testing', 'completed', 'closed'];
    return order.map((key) => ({
      key,
      label: key.replace('_', ' '),
      value: filtered.filter((row) => row.status === key).length,
    })).filter((row) => row.value > 0);
  }, [filtered]);

  const issueMix = useMemo(() => {
    const order: Array<QualityRequestRecord['issueType']> = ['defect', 'testing', 'complaint'];
    return order.map((key) => ({
      key,
      label: issueLabel[key],
      value: filtered.filter((row) => row.issueType === key).length,
    })).filter((row) => row.value > 0);
  }, [filtered]);

  const requestTrend = useMemo(() => {
    const byDate = new Map<string, { created: number; completed: number }>();
    filtered
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((row) => {
        const current = byDate.get(row.date) || { created: 0, completed: 0 };
        current.created += 1;
        if (row.status === 'completed' || row.status === 'closed') {
          current.completed += 1;
        }
        byDate.set(row.date, current);
      });

    return Array.from(byDate.entries())
      .map(([date, counts]) => ({
        date,
        label: date.slice(5),
        created: counts.created,
        completed: counts.completed,
      }))
      .slice(-10);
  }, [filtered]);

  const exportCsv = () => {
    exportCsvFile(`quality-request-list-${csvDateSuffix()}.csv`, [
      ['Request No', 'Date', 'Item', 'Batch', 'Issue Type', 'Status'],
      ...filtered.map((r) => [r.requestNo, r.date, r.itemName, r.batchNo, issueLabel[r.issueType], r.status]),
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

      <div className="grid gap-6 xl:grid-cols-3">
        <PanelCard className="xl:col-span-2" bodyClassName="space-y-4">
          <ChartPanelHeader title="Quality Request Trend" subtitle="Created versus reported requests" />
          {requestTrend.length ? (
            <ChartContainer
              config={{
                created: { label: 'Created', color: 'hsl(var(--kpi-blue))' },
                completed: { label: 'Reported', color: 'hsl(var(--kpi-green))' },
              }}
              className="h-64"
            >
              <LineChart data={requestTrend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={34} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="created" stroke="var(--color-created)" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={3} dot={false} />
              </LineChart>
            </ChartContainer>
          ) : (
            <EmptyStatePanel icon={FlaskConical} title="No trend data" description="Create requests to start tracking QA throughput." />
          )}
        </PanelCard>

        <PanelCard bodyClassName="space-y-4">
          <ChartPanelHeader title="Status Mix" subtitle="Current request distribution" />
          {statusMix.length ? (
            <ChartContainer config={{ value: { label: 'Count', color: 'hsl(var(--kpi-purple))' } }} className="h-64">
              <PieChart>
                <Pie data={statusMix} dataKey="value" nameKey="label" innerRadius={50} outerRadius={88} fill="hsl(var(--kpi-purple))" />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <EmptyStatePanel icon={FlaskConical} title="No requests" description="Status distribution will appear once requests are created." />
          )}
        </PanelCard>
      </div>

      <PanelCard bodyClassName="space-y-4">
        <ChartPanelHeader title="Issue Type Breakdown" subtitle="What is driving quality workload" />
        {issueMix.length ? (
          <ChartContainer config={{ value: { label: 'Count', color: 'hsl(var(--kpi-orange))' } }} className="h-56">
            <BarChart data={issueMix}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={34} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyStatePanel icon={FlaskConical} title="No issue mix yet" description="Issue categories will appear after requests are logged." />
        )}
      </PanelCard>

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
