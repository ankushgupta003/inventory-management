import { useEffect, useMemo, useState } from 'react';
import { Download, Edit2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
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
import { csvDateSuffix, exportCsvFile } from '@/lib/csv';
import type { DepartmentRecord, DepartmentUpsertPayload } from '@/types';

const emptyForm: DepartmentUpsertPayload = {
  name: '',
  code: '',
  isActive: true,
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState<DepartmentUpsertPayload>(emptyForm);
  const [search, setSearch] = useState('');

  const loadDepartments = async () => {
    try {
      const data = await companyAdminAPI.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load departments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((record) => `${record.name} ${record.code || ''}`.toLowerCase().includes(query));
  }, [departments, search]);

  const exportCsv = () => {
    exportCsvFile(`departments-${csvDateSuffix()}.csv`, [
      ['Department', 'Code', 'Status'],
      ...filteredDepartments.map((record) => [record.name, record.code ?? '-', record.isActive ? 'Active' : 'Inactive']),
    ]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: DepartmentRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      code: record.code ?? '',
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await companyAdminAPI.updateDepartment(editing.id, {
          name: form.name,
          code: form.code || null,
          isActive: form.isActive,
        });
        setDepartments((current) => current.map((record) => (record.id === updated.id ? updated : record)));
        toast.success('Department updated successfully');
      } else {
        const created = await companyAdminAPI.createDepartment({
          name: form.name,
          code: form.code || null,
          isActive: form.isActive,
        });
        setDepartments((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Department created successfully');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save department'));
    }
  };

  const handleToggleStatus = async (record: DepartmentRecord) => {
    try {
      const updated = await companyAdminAPI.updateDepartment(record.id, { isActive: !record.isActive });
      setDepartments((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success('Department status updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update department status'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Departments"
        description="Maintain company departments used for user assignment and organizational setup."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Departments' },
        ]}
      />

      <PanelCard title="Department Master" subtitle="Active and inactive company departments">
        <DataTable
          toolbar={(
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <Input placeholder="Search departments..." value={search} onChange={(event) => setSearch(event.target.value)} className="table-toolbar-search" />
              </div>
              <div className="table-toolbar-actions">
                <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button className="table-toolbar-button" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Department
                </Button>
              </div>
            </div>
          )}
          columns={[
            { key: 'name', header: 'Department', render: (row: DepartmentRecord) => <span className="font-medium">{row.name}</span> },
            { key: 'code', header: 'Code', render: (row: DepartmentRecord) => row.code ?? '-' },
            {
              key: 'status',
              header: 'Status',
              render: (row: DepartmentRecord) => (
                <StatusBadge status={row.isActive ? 'success' : 'warning'} label={row.isActive ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={filteredDepartments}
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
        title={editing ? 'Edit Department' : 'Add Department'}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="department-name">Department Name</Label>
            <Input id="department-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="department-code">Department Code</Label>
            <Input id="department-code" value={form.code ?? ''} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive departments stay in history but stop being selectable.</p>
            </div>
            <Switch checked={!!form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            {editing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
