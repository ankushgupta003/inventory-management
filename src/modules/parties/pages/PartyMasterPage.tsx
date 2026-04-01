import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import PartyFormModal from '../components/PartyFormModal';
import PartyFiltersBar from '../components/PartyFiltersBar';
import PartyEmptyState from '../components/PartyEmptyState';
import { useParties } from '../hooks/useParties';
import type { PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';
import { toast } from 'sonner';

const TYPE_BADGE: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
  vendor: { variant: 'secondary', label: 'Vendor' },
  customer: { variant: 'default', label: 'Customer' },
  both: { variant: 'outline', label: 'Both' },
};

export default function PartyMasterPage() {
  const { parties, allParties, filters, setFilters, addParty, updateParty, toggleStatus } = useParties();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyRecord | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  const openCreate = () => { setEditingParty(null); setModalOpen(true); };
  const openEdit = (party: PartyRecord) => { setEditingParty(party); setModalOpen(true); };

  const handleSave = (values: PartyFormValues) => {
    if (editingParty) {
      updateParty(editingParty.id, values);
      toast.success('Party updated successfully');
    } else {
      addParty({
        ...values,
        contactPerson: values.contactPerson || '',
        phone: values.phone || '',
        altPhone: values.altPhone || '',
        email: values.email || '',
        address1: values.address1 || '',
        address2: values.address2 || '',
        city: values.city || '',
        state: values.state || '',
        pincode: values.pincode || '',
        gstNumber: values.gstNumber || '',
        panNumber: values.panNumber || '',
        openingBalance: values.openingBalance || 0,
        creditLimit: values.creditLimit || 0,
        remarks: values.remarks || '',
        isActive: values.isActive,
      } as Omit<PartyRecord, 'id' | 'createdAt'>);
      toast.success('Party created successfully');
    }
    setModalOpen(false);
  };

  const handleToggleStatus = () => {
    if (toggleId) {
      toggleStatus(toggleId);
      toast.success('Party status updated');
      setToggleId(null);
    }
  };

  const toggleParty = allParties.find((p) => p.id === toggleId);
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.partyType !== 'all';

  const columns = [
    { key: 'name', header: 'Party Name', render: (r: PartyRecord) => <span className="font-medium">{r.name}</span> },
    { key: 'partyType', header: 'Type', render: (r: PartyRecord) => {
      const b = TYPE_BADGE[r.partyType];
      return <Badge variant={b.variant} className="text-xs">{b.label}</Badge>;
    }},
    { key: 'gstNumber', header: 'GST Number', render: (r: PartyRecord) => r.gstNumber ? <span className="font-mono text-xs">{r.gstNumber}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'contactPerson', header: 'Contact Person', render: (r: PartyRecord) => r.contactPerson || <span className="text-xs text-muted-foreground">—</span> },
    { key: 'phone', header: 'Phone', render: (r: PartyRecord) => r.phone || <span className="text-xs text-muted-foreground">—</span> },
    { key: 'city', header: 'City', render: (r: PartyRecord) => r.city || <span className="text-xs text-muted-foreground">—</span> },
    { key: 'isActive', header: 'Status', render: (r: PartyRecord) => (
      <StatusBadge status={r.isActive ? 'success' : 'warning'} label={r.isActive ? 'Active' : 'Inactive'} />
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="erp-page-header mb-0">Party Master</h1>
          <p className="text-sm text-muted-foreground mt-1">{allParties.length} parties total · {parties.length} shown</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> Add Party</Button>
      </div>

      <PartyFiltersBar filters={filters} onChange={setFilters} />

      {parties.length === 0 ? (
        <PartyEmptyState
          hasFilters={hasFilters}
          onClear={() => setFilters({ search: '', status: 'all', partyType: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <DataTable
          columns={columns}
          data={parties}
          pageSize={10}
          actions={(row) => (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setToggleId(row.id)} title={row.isActive ? 'Deactivate' : 'Activate'}>
                {row.isActive
                  ? <ToggleRight className="h-3.5 w-3.5 text-green-600" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </Button>
            </div>
          )}
        />
      )}

      <PartyFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingParty={editingParty}
      />

      <ConfirmDialog
        open={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={handleToggleStatus}
        title={toggleParty?.isActive ? 'Deactivate Party' : 'Activate Party'}
        description={toggleParty?.isActive
          ? `"${toggleParty?.name}" will be marked as inactive.`
          : `"${toggleParty?.name}" will be marked as active.`}
        confirmLabel={toggleParty?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
