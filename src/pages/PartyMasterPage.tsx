import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import { toast } from 'sonner';
import type { Party } from '@/types';

const initialParties: Party[] = [
  { id: '1', name: 'ABC Steel Suppliers', type: 'supplier', gstNumber: '27AABCU9603R1ZM', contact: '9876543210', email: 'abc@steel.com', address: 'Mumbai, MH', createdAt: '2024-01-10' },
  { id: '2', name: 'XYZ Industries', type: 'customer', gstNumber: '29AADCX0489R1ZN', contact: '9123456789', email: 'info@xyz.com', address: 'Bangalore, KA', createdAt: '2024-01-12' },
  { id: '3', name: 'PQR Trading Co.', type: 'both', gstNumber: '24AAECR1234M1ZP', contact: '9988776655', email: 'pqr@trade.com', address: 'Ahmedabad, GJ', createdAt: '2024-02-05' },
];

const emptyParty = { name: '', type: 'supplier' as const, gstNumber: '', contact: '', email: '', address: '' };

export default function PartyMasterPage() {
  const [parties, setParties] = useState<Party[]>(initialParties);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [form, setForm] = useState(emptyParty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(emptyParty); setModalOpen(true); };
  const openEdit = (p: Party) => { setEditing(p); setForm({ name: p.name, type: p.type, gstNumber: p.gstNumber, contact: p.contact, email: p.email, address: p.address }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editing) {
      setParties(parties.map(p => p.id === editing.id ? { ...p, ...form } : p));
      toast.success('Party updated');
    } else {
      setParties([...parties, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] }]);
      toast.success('Party created');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) { setParties(parties.filter(p => p.id !== deleteId)); toast.success('Party deleted'); setDeleteId(null); }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type', render: (r: Party) => <StatusBadge status={r.type === 'supplier' ? 'info' : r.type === 'customer' ? 'success' : 'warning'} label={r.type.charAt(0).toUpperCase() + r.type.slice(1)} /> },
    { key: 'gstNumber', header: 'GST Number' },
    { key: 'contact', header: 'Contact' },
    { key: 'email', header: 'Email' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="erp-page-header mb-0">Party Master</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Party</Button>
      </div>

      <DataTable
        columns={columns}
        data={parties as unknown as Record<string, unknown>[]}
        searchKey="name"
        searchPlaceholder="Search parties..."
        actions={(row) => {
          const p = row as unknown as Party;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          );
        }}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Party' : 'Add Party'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as Party['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2"><Label>GST Number</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Contact</Label><Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Party" description="Are you sure you want to delete this party?" confirmLabel="Delete" />
    </div>
  );
}
