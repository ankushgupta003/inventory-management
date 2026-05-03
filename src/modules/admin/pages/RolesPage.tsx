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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { companyAdminAPI } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import { csvDateSuffix, exportCsvFile } from '@/lib/csv';
import type { PermissionCatalog, PermissionKey, RoleRecord, RoleUpsertPayload } from '@/types';

const emptyForm: RoleUpsertPayload = {
  name: '',
  description: '',
  isActive: true,
  permissions: [],
};

function formatToken(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState<RoleUpsertPayload>(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [roleData, permissionCatalog] = await Promise.all([
          companyAdminAPI.getRoles(),
          companyAdminAPI.getPermissionCatalog(),
        ]);
        setRoles(roleData);
        setCatalog(permissionCatalog);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load roles'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const groupedPermissions = useMemo(() => {
    if (!catalog) return [];

    return catalog.modules.map((module) => ({
      module,
      items: catalog.actions.map((action) => `${module}.${action}` as PermissionKey),
    }));
  }, [catalog]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((record) => `${record.name} ${record.description || ''}`.toLowerCase().includes(query));
  }, [roles, search]);

  const exportCsv = () => {
    exportCsvFile(`roles-${csvDateSuffix()}.csv`, [
      ['Role', 'Description', 'Permissions', 'Status'],
      ...filteredRoles.map((record) => [record.name, record.description || '-', String(record.permissions.length), record.isActive ? 'Active' : 'Inactive']),
    ]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: RoleRecord) => {
    setEditing(record);
    setForm({
      name: record.name,
      description: record.description ?? '',
      isActive: record.isActive,
      permissions: record.permissions,
    });
    setModalOpen(true);
  };

  const togglePermission = (permission: PermissionKey, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: checked
        ? Array.from(new Set([...current.permissions, permission]))
        : current.permissions.filter((entry) => entry !== permission),
    }));
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await companyAdminAPI.updateRole(editing.id, {
          name: form.name,
          description: form.description || null,
          isActive: form.isActive,
          permissions: form.permissions,
        });
        setRoles((current) => current.map((record) => (record.id === updated.id ? updated : record)));
        toast.success('Role updated successfully');
      } else {
        const created = await companyAdminAPI.createRole({
          name: form.name,
          description: form.description || null,
          isActive: form.isActive,
          permissions: form.permissions,
        });
        setRoles((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Role created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save role'));
    }
  };

  const handleToggleStatus = async (record: RoleRecord) => {
    try {
      const updated = await companyAdminAPI.updateRole(record.id, { isActive: !record.isActive });
      setRoles((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success('Role status updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update role status'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Roles"
        description="Define company-specific roles and attach permission matrices to each one."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Roles' },
        ]}
      />

      <PanelCard title="Role Master" subtitle="Roles available for company users">
        <DataTable
          toolbar={(
            <div className="table-toolbar">
              <div className="table-toolbar-filters">
                <Input placeholder="Search roles..." value={search} onChange={(event) => setSearch(event.target.value)} className="table-toolbar-search" />
              </div>
              <div className="table-toolbar-actions">
                <Button className="table-toolbar-button" variant="outline" onClick={exportCsv}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button className="table-toolbar-button" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Role
                </Button>
              </div>
            </div>
          )}
          columns={[
            { key: 'name', header: 'Role', render: (row: RoleRecord) => <span className="font-medium">{row.name}</span> },
            { key: 'description', header: 'Description', render: (row: RoleRecord) => row.description || '-' },
            { key: 'permissions', header: 'Permissions', render: (row: RoleRecord) => row.permissions.length.toLocaleString('en-IN') },
            {
              key: 'status',
              header: 'Status',
              render: (row: RoleRecord) => (
                <StatusBadge status={row.isActive ? 'success' : 'warning'} label={row.isActive ? 'Active' : 'Inactive'} />
              ),
            },
          ]}
          data={filteredRoles}
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
        title={editing ? 'Edit Role' : 'Add Role'}
        wide
      >
        <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role Name</Label>
              <Input id="role-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-description">Description</Label>
              <Textarea id="role-description" value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive roles remain on history records but stop being assignable.</p>
              </div>
              <Switch checked={!!form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Permissions</p>
              <p className="mt-1 text-xs text-muted-foreground">Choose the module and action permissions granted by this role.</p>
            </div>
            <div className="max-h-[420px] space-y-4 overflow-y-auto pr-2">
              {groupedPermissions.map((group) => (
                <div key={group.module} className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground">{formatToken(group.module)}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {group.items.map((permission) => (
                      <label key={permission} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm">
                        <Checkbox
                          checked={form.permissions.includes(permission)}
                          onCheckedChange={(checked) => togglePermission(permission, checked === true)}
                        />
                        <span>{formatToken(permission.split('.')[1] ?? '')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            {editing ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
