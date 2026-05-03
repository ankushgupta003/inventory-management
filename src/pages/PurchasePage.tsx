import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const suppliers = [
  { id: '1', name: 'ABC Steel Suppliers' },
  { id: '2', name: 'PQR Trading Co.' },
];

const availableItems = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
  { id: '5', name: 'Packing Box Large', unit: 'pcs' },
];

interface PurchaseRow {
  itemId: string; quantity: number; rate: number; defectiveQty: number; returnQty: number;
}

export default function PurchasePage() {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<PurchaseRow[]>([{ itemId: '', quantity: 0, rate: 0, defectiveQty: 0, returnQty: 0 }]);

  const addRow = () => setRows([...rows, { itemId: '', quantity: 0, rate: 0, defectiveQty: 0, returnQty: 0 }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof PurchaseRow, value: string | number) =>
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const total = rows.reduce((sum, r) => sum + r.quantity * r.rate, 0);

  const handleSubmit = () => {
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (rows.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill all item rows'); return; }
    toast.success('Purchase entry created successfully');
    setSupplierId('');
    setRows([{ itemId: '', quantity: 0, rate: 0, defectiveQty: 0, returnQty: 0 }]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Purchase Entry</h1>

      <div className="erp-section space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Supplier *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>

        {/* Items table */}
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
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rate (₹)</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Total</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Defective</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Return</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <Select value={row.itemId} onValueChange={(v) => updateRow(i, 'itemId', v)}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>{availableItems.map(it => <SelectItem key={it.id} value={it.id}>{it.name} ({it.unit})</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2"><Input type="number" className="w-20" value={row.quantity || ''} onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))} /></td>
                    <td className="px-3 py-2"><Input type="number" className="w-24" value={row.rate || ''} onChange={(e) => updateRow(i, 'rate', Number(e.target.value))} /></td>
                    <td className="px-3 py-2 font-medium text-foreground">₹{(row.quantity * row.rate).toLocaleString()}</td>
                    <td className="px-3 py-2"><Input type="number" className="w-20" value={row.defectiveQty || ''} onChange={(e) => updateRow(i, 'defectiveQty', Number(e.target.value))} /></td>
                    <td className="px-3 py-2"><Input type="number" className="w-20" value={row.returnQty || ''} onChange={(e) => updateRow(i, 'returnQty', Number(e.target.value))} /></td>
                    <td className="px-3 py-2">
                      {rows.length > 1 && <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => removeRow(i)} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-lg font-semibold text-foreground">Total: ₹{total.toLocaleString()}</div>
          <Button onClick={handleSubmit}>Save Purchase</Button>
        </div>
      </div>
    </div>
  );
}
