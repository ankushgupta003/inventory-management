import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { qualityRequestsApi } from '../services/qualityRequestsApi';
import type { QualityRequestRecord } from '../types';
import { toast } from 'sonner';

export default function QualityRequestViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<QualityRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [approvalBy, setApprovalBy] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept');
  const [closureRemarks, setClosureRemarks] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await qualityRequestsApi.getById(id);
        if (active) {
          setRecord(data);
          setApprovalBy(data.approvedBy || '');
          setApprovalRemarks(data.approvalRemarks || '');
          setDecision(data.closureDecision || 'accept');
          setClosureRemarks(data.closureRemarks || '');
        }
      } catch {
        if (active) setRecord(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Loading request...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/quality-requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Quality request not found.</p>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    try {
      const updated = await qualityRequestsApi.approve(id, { approvedBy: approvalBy || 'QA Manager', approvalRemarks });
      setRecord(updated);
      toast.success('Request approved');
    } catch {
      toast.error('Failed to approve request');
    } finally {
      setApproving(false);
    }
  };


  const handleClose = async () => {
    if (!id) return;
    setClosing(true);
    try {
      const updated = await qualityRequestsApi.close(id, { decision, remarks: closureRemarks });
      setRecord(updated);
      toast.success('Request closed');
    } catch {
      toast.error('Failed to close request');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quality Request"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Quality Testing', href: '/quality-requests' },
          { label: 'View' },
        ]}
        action={(
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" onClick={() => navigate('/quality-requests')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {(record?.status === 'approved' || record?.status === 'under_testing') && (
              <Button variant="outline" onClick={() => navigate(`/quality-requests/${record.id}/testing`)}>
                <FilePlus2 className="h-4 w-4 mr-2" /> Testing
              </Button>
            )}
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      />

      <div className="bg-card border border-border rounded-xl p-6 print:border-0 print:shadow-none space-y-6">
        <FormSection title="Header">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Request No</div>
              <div className="font-medium">{record.requestNo}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Date</div>
              <div className="font-medium">{record.date}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{record.status.replace('_', ' ')}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Item</div>
              <div className="font-medium">{record.itemName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Batch</div>
              <div className="font-medium">{record.batchNo}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Quantity</div>
              <div className="font-medium">{record.quantity ?? '-'}</div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Issue Description">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Issue Type</div>
              <div className="font-medium capitalize">{record.issueType}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Problem Description</div>
              <div className="font-medium">{record.description || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Remarks</div>
              <div className="font-medium">{record.remarks || '-'}</div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Approval Details">
          {record.status === 'pending' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Approved By</Label>
                <Input value={approvalBy} onChange={(e) => setApprovalBy(e.target.value)} placeholder="QA Manager" />
              </div>
              <div className="space-y-1.5">
                <Label>Approval Remarks</Label>
                <Textarea rows={2} value={approvalRemarks} onChange={(e) => setApprovalRemarks(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={handleApprove} disabled={approving}>
                  {approving ? 'Approving...' : 'Approve Request'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Approved By</div>
                <div className="font-medium">{record.approvedBy || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Approval Remarks</div>
                <div className="font-medium">{record.approvalRemarks || '-'}</div>
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Test Report">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Parameters</div>
              <div className="font-medium">{record.testParameters || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Observations</div>
              <div className="font-medium">{record.observations || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Result</div>
              <div className="font-medium">{record.testResult || '-'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Attachments</div>
              <div className="font-medium">{record.attachments?.length ? record.attachments.join(', ') : '-'}</div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Final Decision">
          {record.status === 'completed' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Final Decision</Label>
                <Select value={decision} onValueChange={(v) => setDecision(v as 'accept' | 'reject')}>
                  <SelectTrigger><SelectValue placeholder="Decision" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">Accept</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Closure Remarks</Label>
                <Textarea rows={2} value={closureRemarks} onChange={(e) => setClosureRemarks(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button onClick={handleClose} disabled={closing}>
                  {closing ? 'Closing...' : 'Close Request'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Decision</div>
                <div className="font-medium">{record.closureDecision || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Closure Remarks</div>
                <div className="font-medium">{record.closureRemarks || '-'}</div>
              </div>
            </div>
          )}
        </FormSection>
      </div>
    </div>
  );
}
