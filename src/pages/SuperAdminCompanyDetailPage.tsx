import { useEffect, useMemo, useState } from 'react';
import { Building2, KeyRound, PauseCircle, PlayCircle, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/lib/apiError';
import { superAdminAPI } from '@/services/api';
import type { CompanySummary, CompanyUpdatePayload } from '@/types';

export default function SuperAdminCompanyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [form, setForm] = useState<CompanyUpdatePayload>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [credentialNotice, setCredentialNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;

    const load = async () => {
      try {
        const data = await superAdminAPI.getCompany(id);
        if (!active) return;
        setCompany(data);
        setForm({
          name: data.name,
          code: data.code,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
        });
      } catch (error) {
        if (active) toast.error(getErrorMessage(error, 'Unable to load company details'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const stats = useMemo(() => {
    if (!company) return null;
    return [
      { label: 'Users', value: company._count.users, icon: Users },
      { label: 'Departments', value: company._count.departments, icon: Building2 },
      { label: 'Designations', value: company._count.designations, icon: Building2 },
      { label: 'Roles', value: company._count.roles, icon: Building2 },
    ];
  }, [company]);

  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const updated = await superAdminAPI.updateCompany(id, form);
      setCompany(updated);
      setForm({
        name: updated.name,
        code: updated.code,
        contactEmail: updated.contactEmail,
        contactPhone: updated.contactPhone,
        address: updated.address,
      });
      toast.success('Company updated successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update company'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetAdminPassword = async () => {
    if (!company) return;

    try {
      const response = await superAdminAPI.resetAdminPassword(company.id);
      setCredentialNotice(response.temporaryPassword);
      toast.success('Tenant admin password reset');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to reset admin password'));
    }
  };

  const handleToggleStatus = async () => {
    if (!company) return;

    try {
      const updated =
        company.status === 'ACTIVE'
          ? await superAdminAPI.suspendCompany(company.id)
          : await superAdminAPI.activateCompany(company.id);
      setCompany((current) => (current ? { ...current, status: updated.status } : current));
      toast.success(`Company ${updated.status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update company status'));
    } finally {
      setConfirmStatusOpen(false);
    }
  };

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={company?.name ?? 'Company Details'}
        description="Maintain tenant profile data and control the first admin account."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin/dashboard' },
          { label: 'Companies', href: '/super-admin/companies' },
          { label: company?.name ?? 'Details' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/super-admin/companies')}>
            Back to Companies
          </Button>
        )}
      />

      {credentialNotice ? (
        <PanelCard title="New Temporary Password" subtitle="Share this securely with the tenant admin.">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-900">Temporary Password</p>
            <p className="mt-2 font-mono text-xl text-emerald-950">{credentialNotice}</p>
          </div>
        </PanelCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <PanelCard title="Company Profile" subtitle="Core tenant information">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="detail-name">Company Name</Label>
              <Input id="detail-name" value={form.name ?? ''} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail-code">Company Code</Label>
              <Input id="detail-code" value={form.code ?? ''} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail-email">Contact Email</Label>
              <Input id="detail-email" type="email" value={form.contactEmail ?? ''} onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))} disabled={loading} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detail-phone">Contact Phone</Label>
              <Input id="detail-phone" value={form.contactPhone ?? ''} onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))} disabled={loading} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="detail-address">Address</Label>
              <Textarea id="detail-address" value={form.address ?? ''} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} disabled={loading} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => company && setForm({ name: company.name, code: company.code, contactEmail: company.contactEmail, contactPhone: company.contactPhone, address: company.address })}>
              Reset Changes
            </Button>
            <Button className="rounded-xl" onClick={() => void handleSave()} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </PanelCard>

        <div className="space-y-6">
          <PanelCard title="Tenant Status" subtitle="Current lifecycle and admin state">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Lifecycle</span>
                <StatusBadge
                  status={company?.status === 'ACTIVE' ? 'success' : 'warning'}
                  label={company?.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">Tenant Admin</span>
                <span className="text-sm font-medium">{company?.adminUser?.email ?? '-'}</span>
              </div>
              <div className="grid gap-2">
                <Button className="w-full rounded-xl" variant="outline" onClick={() => void handleResetAdminPassword()}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Reset Admin Password
                </Button>
                <Button className="w-full rounded-xl" variant={company?.status === 'ACTIVE' ? 'destructive' : 'default'} onClick={() => setConfirmStatusOpen(true)}>
                  {company?.status === 'ACTIVE' ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  {company?.status === 'ACTIVE' ? 'Suspend Company' : 'Activate Company'}
                </Button>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Tenant Snapshot" subtitle="Company-scoped master counts">
            <div className="grid gap-3">
              {stats?.map((entry) => (
                <div key={entry.label} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <entry.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{entry.label}</span>
                  </div>
                  <span className="text-lg font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={() => void handleToggleStatus()}
        title={company?.status === 'ACTIVE' ? 'Suspend Company' : 'Activate Company'}
        description={company?.status === 'ACTIVE'
          ? `All users under ${company?.name} will be blocked from login until the company is activated again.`
          : `${company?.name} will be able to log in again.`}
        confirmLabel={company?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        variant={company?.status === 'ACTIVE' ? 'destructive' : 'default'}
      />
    </div>
  );
}
