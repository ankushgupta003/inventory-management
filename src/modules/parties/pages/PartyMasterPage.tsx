import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageHeader from '@/components/PageHeader';
import TableWrapper from '@/components/TableWrapper';
import FormSection from '@/components/FormSection';
import PartyFormModal from '../components/PartyFormModal';
import PartyFiltersBar from '../components/PartyFiltersBar';
import PartyEmptyState from '../components/PartyEmptyState';
import { useParties } from '../hooks/useParties';
import type { PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';
import { toast } from 'sonner';

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
      addParty(values as Omit<PartyRecord, 'id' | 'createdAt'>);
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
    { key: 'partyType', header: 'Type', render: (r: PartyRecord) => (
      <StatusBadge
        status={r.partyType === 'vendor' ? 'info' : r.partyType === 'customer' ? 'success' : 'warning'}
        label={r.partyType ? r.partyType.charAt(0).toUpperCase() + r.partyType.slice(1) : 'Unknown'}
      />
    )},
    { key: 'contactPerson', header: 'Contact', render: (r: PartyRecord) => r.contactPerson || '-' },
    { key: 'phone', header: 'Phone', render: (r: PartyRecord) => r.phone || '-' },
    { key: 'gstNumber', header: 'GST No', render: (r: PartyRecord) => r.gstNumber || '-' },
    { key: 'city', header: 'City', render: (r: PartyRecord) => r.city || '-' },
    { key: 'state', header: 'State', render: (r: PartyRecord) => r.state || '-' },
    { key: 'isActive', header: 'Status', render: (r: PartyRecord) => (
      <StatusBadge status={r.isActive ? 'success' : 'warning'} label={r.isActive ? 'Active' : 'Inactive'} />
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Party Master"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters', href: '/parties' },
          { label: 'Party Master' },
        ]}
        description={`${allParties.length} parties total, ${parties.length} shown`}
        action={(
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Party
          </Button>
        )}
      />

      <FormSection title="Filters" contentClassName="space-y-0">
        <PartyFiltersBar filters={filters} onChange={setFilters} />
      </FormSection>

      {parties.length === 0 ? (
        <PartyEmptyState
          hasFilters={hasFilters}
          onClear={() => setFilters({ search: '', status: 'all', partyType: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <TableWrapper title="Parties" description={`${parties.length} records`}>
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
        </TableWrapper>
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
