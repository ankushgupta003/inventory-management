import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const rawMaterials = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
];
const finishedGoods = [
  { id: '3', name: 'Motor Assembly A1', unit: 'pcs' },
  { id: '4', name: 'Gear Box GB-200', unit: 'pcs' },
];

interface ProdRow { itemId: string; quantity: number; }

export default function ProductionPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputs, setInputs] = useState<ProdRow[]>([{ itemId: '', quantity: 0 }]);
  const [outputs, setOutputs] = useState<ProdRow[]>([{ itemId: '', quantity: 0 }]);
  const [returned, setReturned] = useState<ProdRow[]>([]);
  const [wastage, setWastage] = useState(0);

  const updateList = (setter: React.Dispatch<React.SetStateAction<ProdRow[]>>, list: ProdRow[], i: number, field: keyof ProdRow, value: string | number) =>
    setter(list.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = () => {
    if (inputs.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill input materials'); return; }
    if (outputs.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill output products'); return; }
    toast.success('Production entry saved');
    setInputs([{ itemId: '', quantity: 0 }]);
    setOutputs([{ itemId: '', quantity: 0 }]);
    setReturned([]);
    setWastage(0);
  };

  const renderTable = (title: string, items: { id: string; name: string; unit: string }[], rows: ProdRow[], setRows: React.Dispatch<React.SetStateAction<ProdRow[]>>) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-foreground">{title}</h3>
        <Button variant="outline" size="sm" onClick={() => setRows([...rows, { itemId: '', quantity: 0 }])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
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
                  <Select value={row.itemId} onValueChange={(v) => updateList(setRows, rows, i, 'itemId', v)}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Select item" /></SelectTrigger>
                    <SelectContent>{items.map(it => <SelectItem key={it.id} value={it.id}>{it.name} ({it.unit})</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2"><Input type="number" className="w-28" value={row.quantity || ''} onChange={(e) => updateList(setRows, rows, i, 'quantity', Number(e.target.value))} /></td>
                <td className="px-3 py-2">{rows.length > 1 && <Button variant="ghost" size="sm" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Production Entry</h1>

      <div className="erp-section space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Wastage (units)</Label><Input type="number" value={wastage || ''} onChange={(e) => setWastage(Number(e.target.value))} /></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTable('Input Materials', rawMaterials, inputs, setInputs)}
          {renderTable('Output Products', finishedGoods, outputs, setOutputs)}
        </div>

        {renderTable('Returned Materials', rawMaterials, returned, setReturned)}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSubmit}>Save Production</Button>
        </div>
      </div>
    </div>
  );
}
