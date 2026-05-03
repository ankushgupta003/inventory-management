import { useMemo, useState } from 'react';
import { Edit2, Eye, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '@/components/DataTable';
import TableActionButton from '@/components/TableActionButton';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ListFilterBar, ListKpiStrip, ListPageShell, ListTablePanel, type ListPageKpi } from '@/components/list';
import { exportCsvFile, csvDateSuffix } from '@/lib/csv';
import { getErrorMessage } from '@/lib/apiError';
import PartyFormModal from '../components/PartyFormModal';
import PartyFiltersBar from '../components/PartyFiltersBar';
import PartyEmptyState from '../components/PartyEmptyState';
import { useParties } from '../hooks/useParties';
import type { PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';
import { toast } from 'sonner';

export default function PartyMasterPage() {
  const navigate = useNavigate();
  const { parties, summary, filters, setFilters, createParty, updateParty, toggleStatus, isLoading } = useParties();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<PartyRecord | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  const openCreate = () => { setEditingParty(null); setModalOpen(true); };
  const openEdit = (party: PartyRecord) => { setEditingParty(party); setModalOpen(true); };

  const handleSave = async (values: PartyFormValues) => {
    try {
      if (editingParty) {
        await updateParty(editingParty.id, values);
        toast.success('Party updated successfully');
      } else {
        await createParty(values);
        toast.success('Party created successfully');
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, editingParty ? 'Failed to update party' : 'Failed to create party'));
    }
  };

  const handleToggleStatus = async () => {
    if (toggleId) {
      try {
        await toggleStatus(toggleId);
        toast.success('Party status updated');
        setToggleId(null);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to update party status'));
      }
    }
  };

  const toggleParty = parties.find((p) => p.id === toggleId);
  const hasFilters = filters.search !== '' || filters.status !== 'all' || filters.partyType !== 'all';

  const kpis: ListPageKpi[] = useMemo(() => {
    return [
      { id: 'total', label: 'Total Parties', value: summary.total.toLocaleString('en-IN'), icon: Users, tone: 'blue' },
      { id: 'active', label: 'Active', value: summary.active.toLocaleString('en-IN'), icon: Users, tone: 'green' },
      { id: 'vendors', label: 'Vendors', value: summary.vendors.toLocaleString('en-IN'), icon: Users, tone: 'orange' },
      { id: 'customers', label: 'Customers', value: summary.customers.toLocaleString('en-IN'), icon: Users, tone: 'purple' },
      { id: 'both', label: 'Both', value: summary.both.toLocaleString('en-IN'), icon: Users, tone: 'blue' },
    ].slice(0, 4);
  }, [summary]);

  const exportCsv = () => {
    exportCsvFile(`party-master-list-${csvDateSuffix()}.csv`, [
      ['Name', 'Type', 'Contact', 'Phone', 'GST No', 'City', 'State', 'Status'],
      ...parties.map((p) => [
        p.name,
        p.partyType,
        p.contactPerson || '-',
        p.phone || '-',
        p.gstNumber || '-',
        p.city || '-',
        p.state || '-',
        p.isActive ? 'Active' : 'Inactive',
      ]),
    ]);
  };

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
      <ListPageShell
        title="Party Master"
        description={`${summary.total} parties total, ${parties.length} shown`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Party Master' },
        ]}
        addLabel="Add Party"
        onAdd={openCreate}
        onExport={exportCsv}
      />

      <ListKpiStrip items={kpis} />

      <ListFilterBar title="Filters">
        <PartyFiltersBar filters={filters} onChange={setFilters} />
      </ListFilterBar>

      {!isLoading && parties.length === 0 ? (
        <PartyEmptyState
          hasFilters={hasFilters}
          onClear={() => setFilters({ search: '', status: 'all', partyType: 'all' })}
          onCreate={openCreate}
        />
      ) : (
        <ListTablePanel title="Parties" description={isLoading ? 'Loading parties...' : `${parties.length} records`}>
          <DataTable
            columns={columns}
            data={parties}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            isLoading={isLoading}
            actions={(row) => (
              <div className="flex items-center justify-end gap-1">
                <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/parties/${row.id}`)} />
                <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
                <TableActionButton
                  label={row.isActive ? 'Deactivate' : 'Activate'}
                  icon={row.isActive ? ToggleRight : ToggleLeft}
                  tone={row.isActive ? 'rose' : 'emerald'}
                  onClick={() => setToggleId(row.id)}
                />
              </div>
            )}
          />
        </ListTablePanel>
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
