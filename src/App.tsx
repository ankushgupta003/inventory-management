import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import SuperAdminLayout from '@/components/SuperAdminLayout';
import LoginPage from '@/pages/LoginPage';
import SuperAdminLoginPage from '@/pages/SuperAdminLoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import Index from '@/pages/Index';
import DashboardPage from '@/pages/DashboardPage';
import SuperAdminDashboardPage from '@/pages/SuperAdminDashboardPage';
import SuperAdminCompaniesPage from '@/pages/SuperAdminCompaniesPage';
import SuperAdminCompanyDetailPage from '@/pages/SuperAdminCompanyDetailPage';
import { DepartmentsPage, DesignationsPage, RolesPage, UsersPage } from '@/modules/admin';
import { ItemMasterPage } from '@/modules/items';
import { PartyMasterPage, PartyViewPage } from '@/modules/parties';
import { GINListPage, GoodsInwardPage, GINViewPage } from '@/modules/purchases';
import { MRSCreatePage, MRSIssuePage, MRSListPage, MRSViewPage } from '@/modules/mrs';
import { StockLedgerPage } from '@/modules/ledger';
import { ProductionCreatePage, ProductionListPage, ProductionViewPage } from '@/modules/production';
import MaterialIssuePage from '@/pages/MaterialIssuePage';
import { PIListPage, PICreatePage, PIViewPage } from '@/modules/pi';
import { InvoiceCreatePage, InvoiceListPage, InvoiceViewPage } from '@/modules/invoices';
import {
  QualityRequestCreatePage,
  QualityRequestListPage,
  QualityRequestTestingPage,
  QualityRequestViewPage,
} from '@/modules/quality-requests';
import { StockMovementCreatePage, StockMovementListPage, StockMovementViewPage } from '@/modules/stock-movement';
import ReportsPage from '@/pages/ReportsPage';
import { BMRPrintPage } from '@/modules/bmr';
import NotFound from '@/pages/NotFound';
import type { PermissionKey } from '@/types';

const queryClient = new QueryClient();

const IssueRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/stock-movement/${id}` : '/stock-movement'} replace />;
};

const SamplingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/stock-movement/${id}` : '/stock-movement'} replace />;
};

function CompanyRoute({
  children,
  permissions,
  requireAllPermissions = false,
}: {
  children: React.ReactNode;
  permissions: PermissionKey[];
  requireAllPermissions?: boolean;
}) {
  return (
    <ProtectedRoute requiredPermissions={permissions} requireAllPermissions={requireAllPermissions}>
      {children}
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
            <Route
              path="/reset-password"
              element={(
                <ProtectedRoute allowMustReset>
                  <ResetPasswordPage />
                </ProtectedRoute>
              )}
            />

            <Route
              element={(
                <ProtectedRoute portal="super-admin" allowedAccountTypes={['SUPER_ADMIN']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              )}
            >
              <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="/super-admin/companies" element={<SuperAdminCompaniesPage />} />
              <Route path="/super-admin/companies/:id" element={<SuperAdminCompanyDetailPage />} />
            </Route>

            <Route
              element={(
                <ProtectedRoute portal="company" allowedAccountTypes={['COMPANY_ADMIN', 'COMPANY_USER']}>
                  <DashboardLayout />
                </ProtectedRoute>
              )}
            >
              <Route path="/dashboard" element={<CompanyRoute permissions={['dashboard.view']}><DashboardPage /></CompanyRoute>} />
              <Route path="/items" element={<CompanyRoute permissions={['items.view']}><ItemMasterPage /></CompanyRoute>} />
              <Route path="/parties" element={<CompanyRoute permissions={['parties.view']}><PartyMasterPage /></CompanyRoute>} />
              <Route path="/parties/:id" element={<CompanyRoute permissions={['parties.view']}><PartyViewPage /></CompanyRoute>} />
              <Route path="/purchases" element={<CompanyRoute permissions={['purchases.view']}><GINListPage /></CompanyRoute>} />
              <Route path="/purchases/create" element={<CompanyRoute permissions={['purchases.create']}><GoodsInwardPage /></CompanyRoute>} />
              <Route path="/purchases/:id" element={<CompanyRoute permissions={['purchases.view']}><GINViewPage /></CompanyRoute>} />
              <Route path="/mrs" element={<CompanyRoute permissions={['mrs.view']}><MRSListPage /></CompanyRoute>} />
              <Route path="/mrs/create" element={<CompanyRoute permissions={['mrs.create']}><MRSCreatePage /></CompanyRoute>} />
              <Route path="/mrs/:id" element={<CompanyRoute permissions={['mrs.view']}><MRSViewPage /></CompanyRoute>} />
              <Route path="/mrs/:id/issue" element={<CompanyRoute permissions={['mrs.edit']}><MRSIssuePage /></CompanyRoute>} />
              <Route path="/issues" element={<Navigate to="/stock-movement" replace />} />
              <Route path="/issues/create" element={<Navigate to="/stock-movement/create" replace />} />
              <Route path="/issues/:id" element={<IssueRedirect />} />
              <Route path="/material-issue" element={<CompanyRoute permissions={['stock_movement.view']}><MaterialIssuePage /></CompanyRoute>} />
              <Route path="/stock-ledger" element={<CompanyRoute permissions={['stock_ledger.view']}><StockLedgerPage /></CompanyRoute>} />
              <Route path="/production" element={<CompanyRoute permissions={['production.view']}><ProductionListPage /></CompanyRoute>} />
              <Route path="/production/create" element={<CompanyRoute permissions={['production.create']}><ProductionCreatePage /></CompanyRoute>} />
              <Route path="/production/:id" element={<CompanyRoute permissions={['production.view']}><ProductionViewPage /></CompanyRoute>} />
              <Route path="/sampling" element={<Navigate to="/stock-movement" replace />} />
              <Route path="/sampling/create" element={<Navigate to="/stock-movement/create" replace />} />
              <Route path="/sampling/:id" element={<SamplingRedirect />} />
              <Route path="/quality-requests" element={<CompanyRoute permissions={['quality_requests.view']}><QualityRequestListPage /></CompanyRoute>} />
              <Route path="/quality-requests/create" element={<CompanyRoute permissions={['quality_requests.create']}><QualityRequestCreatePage /></CompanyRoute>} />
              <Route path="/quality-requests/:id" element={<CompanyRoute permissions={['quality_requests.view']}><QualityRequestViewPage /></CompanyRoute>} />
              <Route path="/quality-requests/:id/testing" element={<CompanyRoute permissions={['quality_requests.approve']}><QualityRequestTestingPage /></CompanyRoute>} />
              <Route path="/stock-movement" element={<CompanyRoute permissions={['stock_movement.view']}><StockMovementListPage /></CompanyRoute>} />
              <Route path="/stock-movement/create" element={<CompanyRoute permissions={['stock_movement.create']}><StockMovementCreatePage /></CompanyRoute>} />
              <Route path="/stock-movement/:id" element={<CompanyRoute permissions={['stock_movement.view']}><StockMovementViewPage /></CompanyRoute>} />
              <Route path="/bmr/print" element={<CompanyRoute permissions={['production.view']}><BMRPrintPage /></CompanyRoute>} />
              <Route path="/bmr/print/:batchId" element={<CompanyRoute permissions={['production.view']}><BMRPrintPage /></CompanyRoute>} />
              <Route path="/proforma-invoices" element={<CompanyRoute permissions={['proforma_invoices.view']}><PIListPage /></CompanyRoute>} />
              <Route path="/proforma-invoices/create" element={<CompanyRoute permissions={['proforma_invoices.create']}><PICreatePage /></CompanyRoute>} />
              <Route path="/proforma-invoices/:id/edit" element={<CompanyRoute permissions={['proforma_invoices.edit']}><PICreatePage /></CompanyRoute>} />
              <Route path="/proforma-invoices/:id" element={<CompanyRoute permissions={['proforma_invoices.view']}><PIViewPage /></CompanyRoute>} />
              <Route path="/invoices" element={<CompanyRoute permissions={['invoices.view']}><InvoiceListPage /></CompanyRoute>} />
              <Route path="/invoices/create" element={<CompanyRoute permissions={['invoices.create']}><InvoiceCreatePage /></CompanyRoute>} />
              <Route path="/invoices/:id" element={<CompanyRoute permissions={['invoices.view']}><InvoiceViewPage /></CompanyRoute>} />
              <Route path="/reports" element={<CompanyRoute permissions={['reports.view']}><ReportsPage /></CompanyRoute>} />
              <Route
                path="/admin/departments"
                element={(
                  <ProtectedRoute allowedAccountTypes={['COMPANY_ADMIN']}>
                    <DepartmentsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/designations"
                element={(
                  <ProtectedRoute allowedAccountTypes={['COMPANY_ADMIN']}>
                    <DesignationsPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/roles"
                element={(
                  <ProtectedRoute allowedAccountTypes={['COMPANY_ADMIN']}>
                    <RolesPage />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/admin/users"
                element={(
                  <ProtectedRoute allowedAccountTypes={['COMPANY_ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                )}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
