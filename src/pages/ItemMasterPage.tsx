import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import type { Item } from '@/types';

const initialItems: Item[] = [
  { id: '1', storeName: 'Steel Rod 10mm', tallyName: 'STEEL-ROD-10', hsnCode: '7214', taxPercent: 18, unit: 'kg', type: 'raw_material', currentStock: 450, createdAt: '2024-01-15' },
  { id: '2', storeName: 'Copper Wire 2mm', tallyName: 'COPPER-WIRE-2', hsnCode: '7408', taxPercent: 18, unit: 'kg', type: 'raw_material', currentStock: 120, createdAt: '2024-01-16' },
  { id: '3', storeName: 'Motor Assembly A1', tallyName: 'MOTOR-A1', hsnCode: '8501', taxPercent: 12, unit: 'pcs', type: 'finished_good', currentStock: 85, createdAt: '2024-02-01' },
  { id: '4', storeName: 'Gear Box GB-200', tallyName: 'GEARBOX-200', hsnCode: '8483', taxPercent: 18, unit: 'pcs', type: 'finished_good', currentStock: 42, createdAt: '2024-02-10' },
  { id: '5', storeName: 'Packing Box Large', tallyName: 'PKG-BOX-L', hsnCode: '4819', taxPercent: 12, unit: 'pcs', type: 'raw_material', currentStock: 300, createdAt: '2024-03-01' },
];

const emptyItem = { storeName: '', tallyName: '', hsnCode: '', taxPercent: 18, unit: 'kg', type: 'raw_material' as Item['type'] };

export default function ItemMasterPage() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyItem);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => { setEditingItem(null); setForm(emptyItem); setModalOpen(true); };
  const openEdit = (item: Item) => { setEditingItem(item); setForm({ storeName: item.storeName, tallyName: item.tallyName, hsnCode: item.hsnCode, taxPercent: item.taxPercent, unit: item.unit, type: item.type }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.storeName.trim()) { toast.error('Store name is required'); return; }
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...form } : i));
      toast.success('Item updated');
    } else {
      setItems([...items, { ...form, id: Date.now().toString(), currentStock: 0, createdAt: new Date().toISOString().split('T')[0] }]);
      toast.success('Item created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { setItems(items.filter(i => i.id !== deleteId)); toast.success('Item deleted'); setDeleteId(null); }
  };

  const columns = [
    { key: 'storeName', header: 'Store Name' },
    { key: 'tallyName', header: 'Tally Name' },
    { key: 'hsnCode', header: 'HSN Code' },
    { key: 'taxPercent', header: 'Tax %', render: (r: Item) => `${r.taxPercent}%` },
    { key: 'unit', header: 'Unit' },
    { key: 'type', header: 'Type', render: (r: Item) => <StatusBadge status={r.type === 'raw_material' ? 'info' : 'success'} label={r.type === 'raw_material' ? 'Raw Material' : 'Finished Good'} /> },
    { key: 'currentStock', header: 'Stock' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="erp-page-header mb-0">Item Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchKey="storeName"
        searchPlaceholder="Search items..."
        actions={(row) => {
          
          return (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
              <TableActionButton label="Delete" icon={Trash2} tone="rose" onClick={() => setDeleteId(row.id)} />
            </div>
          );
        }}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Store Name *</Label><Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tally Name</Label><Input value={form.tallyName} onChange={(e) => setForm({ ...form, tallyName: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>HSN Code</Label><Input value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} /></div>
            <div className="space-y-2"><Label>Tax %</Label><Input type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} /></div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="ltr">ltr</SelectItem>
                  <SelectItem value="mtr">mtr</SelectItem>
                  <SelectItem value="set">set</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'raw_material' | 'finished_good' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="raw_material">Raw Material</SelectItem>
                <SelectItem value="finished_good">Finished Good</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingItem ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Item" description="Are you sure you want to delete this item?" confirmLabel="Delete" />
    </div>
  );
}
