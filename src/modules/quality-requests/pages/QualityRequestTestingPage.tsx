import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { qualityRequestsApi } from '../services/qualityRequestsApi';
import type { QualityRequestRecord } from '../types';
import { toast } from 'sonner';

export default function QualityRequestTestingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<QualityRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testParameters, setTestParameters] = useState('');
  const [observations, setObservations] = useState('');
  const [result, setResult] = useState<'pass' | 'fail'>('pass');
  const [attachments, setAttachments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await qualityRequestsApi.getById(id);
        if (active) {
          setRecord(data);
          setTestParameters(data.testParameters || '');
          setObservations(data.observations || '');
          setResult(data.testResult || 'pass');
          setAttachments(data.attachments || []);
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

  const onSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await qualityRequestsApi.addReport(id, {
        testParameters,
        observations,
        result,
        attachments,
      });
      toast.success('Test report saved');
      navigate(`/quality-requests/${id}`);
    } catch {
      toast.error('Failed to save test report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <p className="text-muted-foreground">Loading testing details...</p>
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

  const canSubmitReport = record.status === 'approved' || record.status === 'under_testing';

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quality Testing Report"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Quality Testing', href: '/quality-requests' },
          { label: 'Testing' },
        ]}
        action={(
          <Button variant="outline" onClick={() => navigate(`/quality-requests/${record.id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        )}
      />

      <FormSection title="Request Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Request No</div>
            <div className="font-medium">{record.requestNo}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Item</div>
            <div className="font-medium">{record.itemName}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Batch</div>
            <div className="font-medium">{record.batchNo}</div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Test Report">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label>Test Parameters</Label>
            <Textarea rows={3} value={testParameters} onChange={(e) => setTestParameters(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Observations</Label>
            <Textarea rows={3} value={observations} onChange={(e) => setObservations(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Result</Label>
              <Select value={result} onValueChange={(v) => setResult(v as 'pass' | 'fail')}>
                <SelectTrigger><SelectValue placeholder="Result" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Attachments</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files || []).map((f) => f.name))}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Submit">
        {!canSubmitReport ? (
          <p className="text-sm text-muted-foreground">
            Testing reports can only be submitted after approval and before final closure.
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(`/quality-requests/${record.id}`)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving || !canSubmitReport}>
            {saving ? 'Saving...' : 'Save Test Report'}
          </Button>
        </div>
      </FormSection>
    </div>
  );
}
