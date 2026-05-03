import { useState } from 'react';
import { Eye, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import type { ProformaInvoice, PIStatus } from '@/types';

const customers = [
  { id: '2', name: 'XYZ Industries' },
  { id: '3', name: 'PQR Trading Co.' },
];
const finishedGoods = [
  { id: '3', name: 'Motor Assembly A1', unit: 'pcs' },
  { id: '4', name: 'Gear Box GB-200', unit: 'pcs' },
];

const initialPIs: ProformaInvoice[] = [
  { id: 'PI-001', customerId: '2', customerName: 'XYZ Industries', date: '2024-03-01', items: [{ itemId: '3', itemName: 'Motor Assembly A1', orderedQty: 50, fulfilledQty: 30, pendingQty: 20, rate: 4500 }], status: 'partial', totalAmount: 225000, createdAt: '2024-03-01' },
  { id: 'PI-002', customerId: '3', customerName: 'PQR Trading Co.', date: '2024-03-05', items: [{ itemId: '4', itemName: 'Gear Box GB-200', orderedQty: 20, fulfilledQty: 0, pendingQty: 20, rate: 8200 }], status: 'pending', totalAmount: 164000, createdAt: '2024-03-05' },
];

interface PIRow { itemId: string; quantity: number; rate: number; }

export default function ProformaInvoicePage() {
  const [pis, setPIs] = useState<ProformaInvoice[]>(initialPIs);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewPI, setViewPI] = useState<ProformaInvoice | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<PIRow[]>([{ itemId: '', quantity: 0, rate: 0 }]);

  const addRow = () => setRows([...rows, { itemId: '', quantity: 0, rate: 0 }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof PIRow, value: string | number) =>
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleCreate = () => {
    if (!customerId) { toast.error('Select a customer'); return; }
    if (rows.some(r => !r.itemId || r.quantity <= 0)) { toast.error('Fill all items'); return; }
    const customer = customers.find(c => c.id === customerId);
    const newPI: ProformaInvoice = {
      id: `PI-${String(pis.length + 1).padStart(3, '0')}`,
      customerId,
      customerName: customer?.name || '',
      date,
      items: rows.map(r => {
        const item = finishedGoods.find(fg => fg.id === r.itemId);
        return { itemId: r.itemId, itemName: item?.name || '', orderedQty: r.quantity, fulfilledQty: 0, pendingQty: r.quantity, rate: r.rate };
      }),
      status: 'pending',
      totalAmount: rows.reduce((s, r) => s + r.quantity * r.rate, 0),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPIs([...pis, newPI]);
    toast.success('PI created');
    setModalOpen(false);
    setCustomerId('');
    setRows([{ itemId: '', quantity: 0, rate: 0 }]);
  };

  const closePI = (id: string) => {
    setPIs(pis.map(pi => pi.id === id ? { ...pi, status: 'closed' as PIStatus } : pi));
    toast.success('PI closed');
  };

  const columns = [
    { key: 'id', header: 'PI #' },
    { key: 'customerName', header: 'Customer' },
    { key: 'date', header: 'Date' },
    { key: 'totalAmount', header: 'Amount', render: (r: ProformaInvoice) => `₹${r.totalAmount.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (r: ProformaInvoice) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="erp-page-header mb-0">Proforma Invoices</h1>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create PI</Button>
      </div>

      <DataTable
        columns={columns}
        data={pis}
        searchKey="customerName"
        searchPlaceholder="Search by customer..."
        actions={(row) => {
          
          return (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => setViewPI(row)} />
              {row.status !== 'closed' && <TableActionButton label="Close" icon={Lock} tone="rose" onClick={() => closePI(row.id)} />}
            </div>
          );
        }}
      />

      {/* Create modal */}
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Proforma Invoice" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between"><h3 className="font-medium text-foreground">Items</h3><Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button></div>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 border-b"><th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Qty</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Rate (₹)</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Total</th><th className="px-3 py-2" /></tr></thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2"><Select value={row.itemId} onValueChange={(v) => updateRow(i, 'itemId', v)}><SelectTrigger className="w-48"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{finishedGoods.map(fg => <SelectItem key={fg.id} value={fg.id}>{fg.name}</SelectItem>)}</SelectContent></Select></td>
                    <td className="px-3 py-2"><Input type="number" className="w-20" value={row.quantity || ''} onChange={(e) => updateRow(i, 'quantity', Number(e.target.value))} /></td>
                    <td className="px-3 py-2"><Input type="number" className="w-24" value={row.rate || ''} onChange={(e) => updateRow(i, 'rate', Number(e.target.value))} /></td>
                    <td className="px-3 py-2 font-medium">₹{(row.quantity * row.rate).toLocaleString()}</td>
                    <td className="px-3 py-2">{rows.length > 1 && <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => removeRow(i)} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleCreate}>Create PI</Button></div>
        </div>
      </FormModal>

      {/* View modal */}
      <FormModal open={!!viewPI} onClose={() => setViewPI(null)} title={`PI Details: ${viewPI?.id || ''}`} wide>
        {viewPI && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Customer:</span> <strong>{viewPI.customerName}</strong></div>
              <div><span className="text-muted-foreground">Date:</span> <strong>{viewPI.date}</strong></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={viewPI.status} /></div>
            </div>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 border-b"><th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Ordered</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Fulfilled</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Pending</th><th className="text-left px-3 py-2 font-medium text-muted-foreground">Rate</th></tr></thead>
                <tbody>
                  {viewPI.items.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2">{item.orderedQty}</td>
                      <td className="px-3 py-2">{item.fulfilledQty}</td>
                      <td className="px-3 py-2 font-medium text-warning">{item.pendingQty}</td>
                      <td className="px-3 py-2">₹{item.rate.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right text-lg font-semibold text-foreground">Total: ₹{viewPI.totalAmount.toLocaleString()}</div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
