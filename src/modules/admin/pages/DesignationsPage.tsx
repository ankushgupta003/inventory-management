import { useEffect, useState } from 'react';
import { Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import StatusBadge from '@/components/StatusBadge';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { companyAdminAPI } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { DesignationRecord, DesignationUpsertPayload } from '@/types';

const emptyForm: DesignationUpsertPayload = {
  name: '',
  isActive: true,
};

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<DesignationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DesignationRecord | null>(null);
  const [form, setForm] = useState<DesignationUpsertPayload>(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await companyAdminAPI.getDesignations();
        setDesignations(data);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load designations'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: DesignationRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await companyAdminAPI.updateDesignation(editing.id, form);
        setDesignations((current) => current.map((record) => (record.id === updated.id ? updated : record)));
        toast.success('Designation updated successfully');
      } else {
        const created = await companyAdminAPI.createDesignation(form);
        setDesignations((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Designation created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save designation'));
    }
  };

  const handleToggleStatus = async (record: DesignationRecord) => {
    try {
      const updated = await companyAdminAPI.updateDesignation(record.id, { isActive: !record.isActive });
      setDesignations((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success('Designation status updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update designation status'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Designations"
        description="Maintain company job titles and designation labels for user records."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Designations' },
        ]}
        action={(
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Designation
          </Button>
        )}
      />

      <PanelCard title="Designation Master" subtitle="Job titles available inside this company">
        <DataTable
          columns={[
            { key: 'name', header: 'Designation', render: (row: DesignationRecord) => <span className="font-medium">{row.name}</span> },
            {
              key: 'status',
              header: 'Status',
              render: (row: DesignationRecord) => (
                <StatusBadge status={row.isActive ? 'success' : 'warning'} label={row.isActive ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={designations}
          searchKey="name"
          searchPlaceholder="Search designations..."
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
              <TableActionButton
                label={row.isActive ? 'Deactivate' : 'Activate'}
                icon={row.isActive ? ToggleRight : ToggleLeft}
                tone={row.isActive ? 'rose' : 'emerald'}
                onClick={() => void handleToggleStatus(row)}
              />
            </div>
          )}
        />
      </PanelCard>

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setForm(emptyForm);
        }}
        title={editing ? 'Edit Designation' : 'Add Designation'}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="designation-name">Designation Name</Label>
            <Input id="designation-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive designations remain historical but stop being assignable.</p>
            </div>
            <Switch checked={!!form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            {editing ? 'Save Changes' : 'Create Designation'}
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
