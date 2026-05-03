import PortalLoginPage from '@/components/auth/PortalLoginPage';

export default function LoginPage() {
  return (
    <PortalLoginPage
      portal="company"
      title="Company Login"
      description="Sign in to continue to your company inventory workspace."
      heroTitle="InventoryX Company Workspace"
      heroDescription="Run inventory, production, quality, and sales operations with a tenant-aware workspace built for each company."
      helperLabel="Need platform-level access?"
      helperHref="/super-admin/login"
      helperLinkText="Use the super admin portal"
    />
  );
}
