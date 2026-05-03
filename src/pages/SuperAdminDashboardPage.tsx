import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Users, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import PanelCard from '@/components/PanelCard';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/apiError';
import { superAdminAPI } from '@/services/api';
import type { CompanySummary, SuperAdminDashboardData } from '@/types';
import { Eye } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await superAdminAPI.getDashboard();
        if (active) setDashboard(data);
      } catch (error) {
        if (active) toast.error(getErrorMessage(error, 'Unable to load super admin dashboard'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Super Admin Dashboard"
        description="Provision new companies, monitor tenant health, and keep admin access under control."
        breadcrumbs={[{ label: 'Super Admin' }]}
        action={(
          <Button className="rounded-xl" onClick={() => navigate('/super-admin/companies')}>
            Manage Companies
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Companies" value={summary?.totalCompanies ?? 0} icon={Building2} tone="blue" meta="All registered tenants" />
        <StatCard title="Active Companies" value={summary?.activeCompanies ?? 0} icon={ShieldCheck} tone="green" meta="Ready to transact" />
        <StatCard title="Suspended Companies" value={summary?.suspendedCompanies ?? 0} icon={Building2} tone="rose" meta="Blocked from login" />
        <StatCard title="Tenant Users" value={summary?.totalUsers ?? 0} icon={Users} tone="teal" meta="Company admins and users" />
      </div>

      <PanelCard
        title="Recently Provisioned Companies"
        subtitle="Latest tenants and their current admin readiness"
        actions={<Button variant="outline" className="rounded-xl" onClick={() => navigate('/super-admin/companies')}>View All</Button>}
      >
        <DataTable
          columns={[
            { key: 'name', header: 'Company', render: (row: CompanySummary) => <span className="font-medium">{row.name}</span> },
            { key: 'code', header: 'Code' },
            { key: 'status', header: 'Status', render: (row: CompanySummary) => (
              <StatusBadge status={row.status === 'ACTIVE' ? 'success' : 'warning'} label={row.status === 'ACTIVE' ? 'Active' : 'Suspended'} />
            ) },
            { key: 'adminUser', header: 'Admin', render: (row: CompanySummary) => row.adminUser?.email ?? '-' },
            { key: 'counts', header: 'Users', render: (row: CompanySummary) => row._count.users.toLocaleString('en-IN') },
          ]}
          data={dashboard?.recentCompanies ?? []}
          isLoading={loading}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton
                label="View"
                icon={Eye}
                tone="blue"
                onClick={() => navigate(`/super-admin/companies/${row.id}`)}
              />
            </div>
          )}
        />
      </PanelCard>

      <PanelCard title="What This Portal Controls" subtitle="Current SaaS foundation scope in this phase">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <UserCog className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Tenant Admin Provisioning</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create a company and issue the first admin account with a temporary password.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Lifecycle Control</h3>
            <p className="mt-2 text-sm text-muted-foreground">Activate or suspend companies and reset tenant admin passwords when needed.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">Multi-Company Foundation</h3>
            <p className="mt-2 text-sm text-muted-foreground">Each company manages its own departments, designations, roles, and users inside the main app.</p>
          </div>
        </div>
      </PanelCard>
    </div>
  );
}
