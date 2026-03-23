import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const availableItems = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
  { id: '5', name: 'Packing Box Large', unit: 'pcs' },
];

interface IssueRow { itemId: string; quantity: number; }

export default function MaterialIssuePage() {
  const [issueType, setIssueType] = useState<'testing' | 'production'>('production');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<IssueRow[]>([{ itemId: '', quantity: 0 }]);

  const addRow = () => setRows([...rows, { itemId: '', quantity: 0 }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof IssueRow, value: string | number) =>
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = () => {
    if (rows.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill all item rows'); return; }
    toast.success('Material issue submitted');
    setRows([{ itemId: '', quantity: 0 }]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Material Issue</h1>

      <div className="erp-section space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Issue Type *</Label>
            <Select value={issueType} onValueChange={(v) => setIssueType(v as 'testing' | 'production')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground">Items</h3>
            <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Quantity</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Select value={row.itemId} onValueChange={(v) => updateRow(i, 'itemId', v)}>
                        <SelectTrigger className="w-56"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>{availableItems.map(it => <SelectItem key={it.id} value={it.id}>{it.name} ({it.unit})</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2"><Input type="number" className="w-28" value={row.quantity || ''} onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))} /></td>
                    <td className="px-3 py-2">{rows.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeRow(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSubmit}>Submit Issue</Button>
        </div>
      </div>
    </div>
  );
}
