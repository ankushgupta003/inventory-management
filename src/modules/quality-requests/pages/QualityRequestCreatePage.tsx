import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { qualityRequestsApi } from '../services/qualityRequestsApi';
import type { QualityIssueType, QualityRequestRecord } from '../types';
import { toast } from 'sonner';

const createRequestNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `QREQ-${datePart}-${rand}`;
};

const today = new Date().toISOString().split('T')[0];

export default function QualityRequestCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<QualityRequestRecord>({
    id: '',
    requestNo: createRequestNo(),
    date: today,
    itemName: '',
    batchNo: '',
    quantity: undefined,
    issueType: 'defect',
    description: '',
    remarks: '',
    requestedBy: '',
    status: 'pending',
  });

  const issueTypeLabel = useMemo<Record<QualityIssueType, string>>(() => ({
    defect: 'Defect',
    testing: 'Quality Testing',
    complaint: 'Customer Complaint',
  }), []);

  const updateField = (key: keyof QualityRequestRecord, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      const created = await qualityRequestsApi.create(form);
      toast.success('Quality request created');
      navigate(`/quality-requests/${created.id}`);
    } catch {
      toast.error('Failed to create request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Create Quality Request"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Quality Testing', href: '/quality-requests' },
          { label: 'Create Request' },
        ]}
        action={(
          <Button variant="outline" onClick={() => navigate('/quality-requests')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      />

      <FormSection title="Header">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Request No</Label>
            <Input readOnly value={form.requestNo} />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Item Name</Label>
            <Input value={form.itemName} onChange={(e) => updateField('itemName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Batch No</Label>
            <Input value={form.batchNo} onChange={(e) => updateField('batchNo', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity (optional)</Label>
            <Input type="number" value={form.quantity ?? ''} onChange={(e) => updateField('quantity', e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="space-y-1.5">
            <Label>Issue Type</Label>
            <Select value={form.issueType} onValueChange={(v) => updateField('issueType', v as QualityIssueType)}>
              <SelectTrigger><SelectValue placeholder="Issue type" /></SelectTrigger>
              <SelectContent>
                {Object.entries(issueTypeLabel).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Description">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label>Problem Description</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea rows={3} value={form.remarks} onChange={(e) => updateField('remarks', e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Footer">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Requested By</Label>
            <Input value={form.requestedBy} onChange={(e) => updateField('requestedBy', e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Review">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/quality-requests')}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Request'}
          </Button>
        </div>
      </FormSection>
    </div>
  );
}
