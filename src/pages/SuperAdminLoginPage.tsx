import PortalLoginPage from '@/components/auth/PortalLoginPage';

export default function SuperAdminLoginPage() {
  return (
    <PortalLoginPage
      portal="super-admin"
      title="Super Admin Login"
      description="Sign in to provision companies, onboard tenant admins, and control platform access."
      heroTitle="InventoryX Platform Control"
      heroDescription="Manage multi-company rollout from a dedicated SaaS control plane with tenant lifecycle, admin provisioning, and secure access controls."
      helperLabel="Looking for your company workspace?"
      helperHref="/login"
      helperLinkText="Use the company login"
    />
  );
}
