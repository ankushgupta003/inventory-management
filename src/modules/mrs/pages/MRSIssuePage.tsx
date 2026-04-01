import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Mock MRS data — replace with API call
const mockMRS = {
  mrsNo: 'MRS-001',
  department: 'Production',
  items: [
    { itemName: 'Steel Rod 10mm', unit: 'kg', qtyRequested: 100 },
    { itemName: 'Copper Wire 2mm', unit: 'kg', qtyRequested: 50 },
  ],
};

interface IssueRow {
  batchNo: string;
  qtyIssued: number;
}

export default function MRSIssuePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mrs = mockMRS;

  const [issueRows, setIssueRows] = useState<IssueRow[]>(
    mrs.items.map(() => ({ batchNo: '', qtyIssued: 0 }))
  );
  const [issuedBy, setIssuedBy] = useState('');

  const updateRow = (index: number, field: keyof IssueRow, value: string | number) => {
    setIssueRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = () => {
    if (!issuedBy.trim()) { toast.error('Issued By is required'); return; }
    const hasInvalid = issueRows.some((r, i) => r.qtyIssued > mrs.items[i].qtyRequested);
    if (hasInvalid) { toast.error('Issued qty cannot exceed requested qty'); return; }
    console.log('Issue data:', { mrsId: id, issueRows, issuedBy });
    toast.success('Materials issued successfully');
    navigate('/mrs');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(`/mrs/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Issue Materials — {mrs.mrsNo}</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 text-sm">
        <span className="text-muted-foreground">Department:</span>{' '}
        <span className="font-medium text-foreground">{mrs.department}</span>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Issue Details</h2>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Unit</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty Requested</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Batch / Lot No</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Qty Issued</th>
              </tr>
            </thead>
            <tbody>
              {mrs.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-foreground">{item.itemName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-3 py-2 text-right font-medium">{item.qtyRequested}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={issueRows[i].batchNo}
                      onChange={(e) => updateRow(i, 'batchNo', e.target.value)}
                      placeholder="e.g. B-2026-001"
                      className="w-40"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      value={issueRows[i].qtyIssued || ''}
                      onChange={(e) => updateRow(i, 'qtyIssued', Number(e.target.value))}
                      className="w-28"
                      max={item.qtyRequested}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Issued By *</Label>
            <Input value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="Name" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(`/mrs/${id}`)}>Cancel</Button>
        <Button onClick={handleSubmit}>Confirm Issue</Button>
      </div>
    </div>
  );
}
