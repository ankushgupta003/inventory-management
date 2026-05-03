import { useEffect, useMemo, useState } from 'react';
import { Edit2, KeyRound, Plus, ToggleLeft, ToggleRight, UserCog } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { companyAdminAPI } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type {
  CompanyUserCreatePayload,
  CompanyUserRecord,
  CompanyUserUpdatePayload,
  DepartmentRecord,
  DesignationRecord,
  RoleRecord,
} from '@/types';

const emptyForm: CompanyUserCreatePayload = {
  fullName: '',
  email: '',
  employeeCode: '',
  phone: '',
  departmentId: null,
  designationId: null,
  roleId: null,
  isActive: true,
  temporaryPassword: '',
};

interface CredentialNotice {
  title: string;
  password: string;
}

function sortUsers(users: CompanyUserRecord[]) {
  return [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUserRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [designations, setDesignations] = useState<DesignationRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyUserRecord | null>(null);
  const [form, setForm] = useState<CompanyUserCreatePayload>(emptyForm);
  const [credentialNotice, setCredentialNotice] = useState<CredentialNotice | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, departmentData, designationData, roleData] = await Promise.all([
          companyAdminAPI.getUsers(),
          companyAdminAPI.getDepartments(),
          companyAdminAPI.getDesignations(),
          companyAdminAPI.getRoles(),
        ]);
        setUsers(sortUsers(userData));
        setDepartments(departmentData);
        setDesignations(designationData);
        setRoles(roleData.filter((role) => role.isActive));
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load users'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const companyAdmins = users.filter((user) => user.accountType === 'COMPANY_ADMIN').length;
    const companyUsers = users.filter((user) => user.accountType === 'COMPANY_USER').length;
    const active = users.filter((user) => user.isActive).length;

    return { total: users.length, companyAdmins, companyUsers, active };
  }, [users]);

  const resetEditor = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (record: CompanyUserRecord) => {
    if (record.accountType !== 'COMPANY_USER') return;

    setEditing(record);
    setForm({
      fullName: record.fullName,
      email: record.email,
      employeeCode: record.employeeCode ?? '',
      phone: record.phone ?? '',
      departmentId: record.departmentId,
      designationId: record.designationId,
      roleId: record.roleId,
      isActive: record.isActive,
      temporaryPassword: '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const payload: CompanyUserUpdatePayload = {
          fullName: form.fullName,
          email: form.email,
          employeeCode: form.employeeCode || null,
          phone: form.phone || null,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          roleId: form.roleId || null,
          isActive: form.isActive,
        };

        const updated = await companyAdminAPI.updateUser(editing.id, payload);
        setUsers((current) => sortUsers(current.map((user) => (user.id === updated.id ? updated : user))));
        toast.success('User updated successfully');
      } else {
        const response = await companyAdminAPI.createUser({
          fullName: form.fullName,
          email: form.email,
          employeeCode: form.employeeCode || null,
          phone: form.phone || null,
          departmentId: form.departmentId || null,
          designationId: form.designationId || null,
          roleId: form.roleId || null,
          isActive: form.isActive,
          temporaryPassword: form.temporaryPassword || undefined,
        });
        setUsers((current) => sortUsers([...current, response.user]));
        setCredentialNotice({
          title: `${response.user.fullName} temporary password`,
          password: response.temporaryPassword,
        });
        toast.success('User created successfully');
      }

      resetEditor();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save user'));
    }
  };

  const handleToggleStatus = async (record: CompanyUserRecord) => {
    if (record.accountType !== 'COMPANY_USER') return;

    try {
      const updated = await companyAdminAPI.updateUser(record.id, { isActive: !record.isActive });
      setUsers((current) => sortUsers(current.map((entry) => (entry.id === updated.id ? updated : entry))));
      toast.success('User status updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update user status'));
    }
  };

  const handleResetPassword = async (record: CompanyUserRecord) => {
    if (record.accountType !== 'COMPANY_USER') return;

    try {
      const response = await companyAdminAPI.resetUserPassword(record.id);
      setCredentialNotice({
        title: `${record.fullName} password reset`,
        password: response.temporaryPassword,
      });
      setUsers((current) =>
        sortUsers(current.map((entry) => (entry.id === record.id ? { ...entry, mustResetPassword: true } : entry))),
      );
      toast.success('User password reset');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to reset user password'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage the tenant admin record and create company users mapped to roles, departments, and designations."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users' },
        ]}
        action={(
          <Button className="rounded-xl" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PanelCard title="Total Users"><p className="text-3xl font-semibold">{stats.total}</p></PanelCard>
        <PanelCard title="Company Admins"><p className="text-3xl font-semibold">{stats.companyAdmins}</p></PanelCard>
        <PanelCard title="Company Users"><p className="text-3xl font-semibold">{stats.companyUsers}</p></PanelCard>
        <PanelCard title="Active"><p className="text-3xl font-semibold text-emerald-600">{stats.active}</p></PanelCard>
      </div>

      {credentialNotice ? (
        <PanelCard title={credentialNotice.title} subtitle="Share this temporary password securely with the user.">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <p className="text-sm font-medium">Temporary Password</p>
            <p className="mt-2 font-mono text-xl">{credentialNotice.password}</p>
          </div>
        </PanelCard>
      ) : null}

      <PanelCard title="Company Users" subtitle="Users inside this tenant and their master mappings">
        <DataTable
          columns={[
            { key: 'fullName', header: 'Name', render: (row: CompanyUserRecord) => <span className="font-medium">{row.fullName}</span> },
            { key: 'email', header: 'Email' },
            { key: 'employeeCode', header: 'Employee Code', render: (row: CompanyUserRecord) => row.employeeCode ?? '-' },
            { key: 'department', header: 'Department', render: (row: CompanyUserRecord) => row.department?.name ?? '-' },
            { key: 'designation', header: 'Designation', render: (row: CompanyUserRecord) => row.designation?.name ?? '-' },
            { key: 'role', header: 'Role', render: (row: CompanyUserRecord) => row.role?.name ?? '-' },
            {
              key: 'accountType',
              header: 'Type',
              render: (row: CompanyUserRecord) => (
                <StatusBadge
                  status={row.accountType === 'COMPANY_ADMIN' ? 'info' : 'default'}
                  label={row.accountType === 'COMPANY_ADMIN' ? 'Company Admin' : 'Company User'}
                />
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row: CompanyUserRecord) => (
                <div className="space-y-1">
                  <StatusBadge status={row.isActive ? 'success' : 'warning'} label={row.isActive ? 'Active' : 'Inactive'} />
                  {row.mustResetPassword ? <p className="text-[11px] text-amber-600">Password reset pending</p> : null}
                </div>
              ),
            },
          ]}
          data={users}
          searchKey="fullName"
          searchPlaceholder="Search users..."
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              {row.accountType === 'COMPANY_USER' ? (
                <>
                  <TableActionButton label="Edit" icon={Edit2} tone="amber" onClick={() => openEdit(row)} />
                  <TableActionButton label="Reset Password" icon={KeyRound} tone="indigo" onClick={() => void handleResetPassword(row)} />
                  <TableActionButton
                    label={row.isActive ? 'Deactivate' : 'Activate'}
                    icon={row.isActive ? ToggleRight : ToggleLeft}
                    tone={row.isActive ? 'rose' : 'emerald'}
                    onClick={() => void handleToggleStatus(row)}
                  />
                </>
              ) : (
                <TableActionButton label="Managed By Super Admin" icon={UserCog} tone="blue" disabled />
              )}
            </div>
          )}
        />
      </PanelCard>

      <FormModal open={modalOpen} onClose={resetEditor} title={editing ? 'Edit User' : 'Add User'} wide>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Full Name</Label>
              <Input id="user-name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="employee-code">Employee Code</Label>
              <Input id="employee-code" value={form.employeeCode ?? ''} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Phone</Label>
              <Input id="user-phone" value={form.phone ?? ''} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            {!editing ? (
              <div className="space-y-1.5">
                <Label htmlFor="temporary-password">Temporary Password (Optional)</Label>
                <Input
                  id="temporary-password"
                  type="password"
                  placeholder="Leave blank to auto-generate"
                  value={form.temporaryPassword ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.departmentId ?? 'none'} onValueChange={(value) => setForm((current) => ({ ...current, departmentId: value === 'none' ? null : value }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select value={form.designationId ?? 'none'} onValueChange={(value) => setForm((current) => ({ ...current, designationId: value === 'none' ? null : value }))}>
                <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {designations.map((designation) => (
                    <SelectItem key={designation.id} value={designation.id}>{designation.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.roleId ?? 'none'} onValueChange={(value) => setForm((current) => ({ ...current, roleId: value === 'none' ? null : value }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive users remain on records but cannot log in.</p>
              </div>
              <Switch checked={!!form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={resetEditor}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleSave()}>
            {editing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </FormModal>
    </div>
  );
}
