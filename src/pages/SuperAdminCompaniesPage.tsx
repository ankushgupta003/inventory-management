import { useEffect, useMemo, useState } from 'react';
import { Eye, KeyRound, PauseCircle, PlayCircle, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import StatusBadge from '@/components/StatusBadge';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/apiError';
import { superAdminAPI } from '@/services/api';
import type { CompanyCreatePayload, CompanySummary } from '@/types';

const emptyCompanyForm: CompanyCreatePayload = {
  name: '',
  code: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  admin: {
    fullName: '',
    email: '',
    phone: '',
    temporaryPassword: '',
  },
};

interface CredentialNotice {
  title: string;
  subtitle: string;
  password: string;
}

export default function SuperAdminCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CompanyCreatePayload>(emptyCompanyForm);
  const [credentialNotice, setCredentialNotice] = useState<CredentialNotice | null>(null);
  const [pendingStatusCompany, setPendingStatusCompany] = useState<CompanySummary | null>(null);

  const loadCompanies = async () => {
    try {
      const data = await superAdminAPI.getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load companies'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const stats = useMemo(() => {
    const active = companies.filter((company) => company.status === 'ACTIVE').length;
    return {
      total: companies.length,
      active,
      suspended: companies.length - active,
    };
  }, [companies]);

  const resetForm = () => {
    setForm(emptyCompanyForm);
    setModalOpen(false);
  };

  const handleCreateCompany = async () => {
    try {
      const response = await superAdminAPI.createCompany({
        ...form,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        address: form.address || null,
        admin: {
          ...form.admin,
          phone: form.admin.phone || null,
          temporaryPassword: form.admin.temporaryPassword || undefined,
        },
      });

      setCompanies((current) => [response.company, ...current]);
      setCredentialNotice({
        title: `${response.company.name} admin temporary password`,
        subtitle: `Share this with ${response.company.adminUser?.email ?? 'the tenant admin'} for first login.`,
        password: response.adminTemporaryPassword,
      });
      toast.success('Company created successfully');
      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create company'));
    }
  };

  const handleResetAdminPassword = async (company: CompanySummary) => {
    try {
      const response = await superAdminAPI.resetAdminPassword(company.id);
      setCredentialNotice({
        title: `${company.name} admin password reset`,
        subtitle: `Share the new temporary password with ${company.adminUser?.email ?? 'the tenant admin'}.`,
        password: response.temporaryPassword,
      });
      toast.success('Tenant admin password reset');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to reset admin password'));
    }
  };

  const handleToggleStatus = async () => {
    if (!pendingStatusCompany) return;

    try {
      const next =
        pendingStatusCompany.status === 'ACTIVE'
          ? await superAdminAPI.suspendCompany(pendingStatusCompany.id)
          : await superAdminAPI.activateCompany(pendingStatusCompany.id);

      setCompanies((current) => current.map((company) => (company.id === next.id ? { ...company, status: next.status } : company)));
      toast.success(`Company ${next.status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update company status'));
    } finally {
      setPendingStatusCompany(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Companies"
        description="Create tenants, track lifecycle state, and manage first-admin access from one place."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin/dashboard' },
          { label: 'Companies' },
        ]}
        action={(
          <Button className="rounded-xl" onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PanelCard title="Total Companies">
          <p className="text-4xl font-semibold tracking-tight">{stats.total}</p>
        </PanelCard>
        <PanelCard title="Active">
          <p className="text-4xl font-semibold tracking-tight text-emerald-600">{stats.active}</p>
        </PanelCard>
        <PanelCard title="Suspended">
          <p className="text-4xl font-semibold tracking-tight text-orange-600">{stats.suspended}</p>
        </PanelCard>
      </div>

      {credentialNotice ? (
        <PanelCard title={credentialNotice.title} subtitle={credentialNotice.subtitle}>
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-sm font-medium">Temporary Password</p>
                <p className="mt-1 font-mono text-lg">{credentialNotice.password}</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={() => setCredentialNotice(null)}>
              Dismiss
            </Button>
          </div>
        </PanelCard>
      ) : null}

      <PanelCard title="Tenant Directory" subtitle="Current companies, admins, and lifecycle status">
        <DataTable
          columns={[
            { key: 'name', header: 'Company', render: (row: CompanySummary) => <span className="font-medium">{row.name}</span> },
            { key: 'code', header: 'Code' },
            { key: 'contactEmail', header: 'Contact Email', render: (row: CompanySummary) => row.contactEmail ?? '-' },
            { key: 'adminUser', header: 'Tenant Admin', render: (row: CompanySummary) => row.adminUser?.email ?? '-' },
            { key: 'userCount', header: 'Users', render: (row: CompanySummary) => row._count.users.toLocaleString('en-IN') },
            {
              key: 'status',
              header: 'Status',
              render: (row: CompanySummary) => (
                <StatusBadge status={row.status === 'ACTIVE' ? 'success' : 'warning'} label={row.status === 'ACTIVE' ? 'Active' : 'Suspended'} />
              ),
            },
          ]}
          data={companies}
          searchKey="name"
          searchPlaceholder="Search companies..."
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => navigate(`/super-admin/companies/${row.id}`)} />
              <TableActionButton label="Reset Admin Password" icon={KeyRound} tone="indigo" onClick={() => void handleResetAdminPassword(row)} />
              <TableActionButton
                label={row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                icon={row.status === 'ACTIVE' ? PauseCircle : PlayCircle}
                tone={row.status === 'ACTIVE' ? 'rose' : 'emerald'}
                onClick={() => setPendingStatusCompany(row)}
              />
            </div>
          )}
        />
      </PanelCard>

      <FormModal open={modalOpen} onClose={resetForm} title="Create Company" wide>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-code">Company Code</Label>
              <Input id="company-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-email">Contact Email</Label>
              <Input id="company-email" type="email" value={form.contactEmail ?? ''} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone">Contact Phone</Label>
              <Input id="company-phone" value={form.contactPhone ?? ''} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-address">Address</Label>
              <Textarea id="company-address" value={form.address ?? ''} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Tenant Admin Name</Label>
              <Input id="admin-name" value={form.admin.fullName} onChange={(event) => setForm((current) => ({ ...current, admin: { ...current.admin, fullName: event.target.value } }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Tenant Admin Email</Label>
              <Input id="admin-email" type="email" value={form.admin.email} onChange={(event) => setForm((current) => ({ ...current, admin: { ...current.admin, email: event.target.value } }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-phone">Tenant Admin Phone</Label>
              <Input id="admin-phone" value={form.admin.phone ?? ''} onChange={(event) => setForm((current) => ({ ...current, admin: { ...current.admin, phone: event.target.value } }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="temporary-password">Temporary Password (Optional)</Label>
              <Input
                id="temporary-password"
                type="password"
                value={form.admin.temporaryPassword ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, admin: { ...current.admin, temporaryPassword: event.target.value } }))}
                placeholder="Leave blank to auto-generate"
              />
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              The created tenant admin will be forced to reset this password on first login.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={resetForm}>Cancel</Button>
          <Button className="rounded-xl" onClick={() => void handleCreateCompany()}>Create Company</Button>
        </div>
      </FormModal>

      <ConfirmDialog
        open={!!pendingStatusCompany}
        onClose={() => setPendingStatusCompany(null)}
        onConfirm={() => void handleToggleStatus()}
        title={pendingStatusCompany?.status === 'ACTIVE' ? 'Suspend Company' : 'Activate Company'}
        description={pendingStatusCompany?.status === 'ACTIVE'
          ? `Users in ${pendingStatusCompany.name} will no longer be able to log in until the company is activated again.`
          : `${pendingStatusCompany?.name} will be allowed to log in again.`}
        confirmLabel={pendingStatusCompany?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        variant={pendingStatusCompany?.status === 'ACTIVE' ? 'destructive' : 'default'}
      />
    </div>
  );
}
