import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { ItemMasterPage } from "@/modules/items";
import { PartyMasterPage, PartyViewPage } from "@/modules/parties";
import { GINListPage, GoodsInwardPage, GINViewPage } from "@/modules/purchases";
import { MRSListPage, MRSCreatePage, MRSViewPage, MRSIssuePage } from "@/modules/mrs";
import { StockLedgerPage } from "@/modules/ledger";
// legacy issues routes redirect to stock movement
import { ProductionCreatePage, ProductionListPage, ProductionViewPage } from "@/modules/production";
// legacy sampling routes redirect to stock movement
import MaterialIssuePage from "@/pages/MaterialIssuePage";
import { PIListPage, PICreatePage, PIViewPage } from "@/modules/pi";
import { InvoiceListPage, InvoiceCreatePage, InvoiceViewPage } from "@/modules/invoices";
import { QualityRequestListPage, QualityRequestCreatePage, QualityRequestViewPage, QualityRequestTestingPage } from "@/modules/quality-requests";
import { StockMovementListPage, StockMovementCreatePage, StockMovementViewPage } from "@/modules/stock-movement";
import ReportsPage from "@/pages/ReportsPage";
import { BMRPrintPage } from "@/modules/bmr";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const IssueRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/stock-movement/${id}` : "/stock-movement"} replace />;
};

const SamplingRedirect = () => {
  const { id } = useParams();
  return <Navigate to={id ? `/stock-movement/${id}` : "/stock-movement"} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/items" element={<ItemMasterPage />} />
              <Route path="/parties" element={<PartyMasterPage />} />
              <Route path="/parties/:id" element={<PartyViewPage />} />
              <Route path="/purchases" element={<GINListPage />} />
              <Route path="/purchases/create" element={<GoodsInwardPage />} />
              <Route path="/purchases/:id" element={<GINViewPage />} />
              <Route path="/mrs" element={<MRSListPage />} />
              <Route path="/mrs/create" element={<MRSCreatePage />} />
              <Route path="/mrs/:id" element={<MRSViewPage />} />
              <Route path="/mrs/:id/issue" element={<MRSIssuePage />} />
              <Route path="/issues" element={<Navigate to="/stock-movement" replace />} />
              <Route path="/issues/create" element={<Navigate to="/stock-movement/create" replace />} />
              <Route path="/issues/:id" element={<IssueRedirect />} />
              <Route path="/material-issue" element={<MaterialIssuePage />} />
              <Route path="/stock-ledger" element={<StockLedgerPage />} />
              <Route path="/production" element={<ProductionListPage />} />
              <Route path="/production/create" element={<ProductionCreatePage />} />
              <Route path="/production/:id" element={<ProductionViewPage />} />
              <Route path="/sampling" element={<Navigate to="/stock-movement" replace />} />
              <Route path="/sampling/create" element={<Navigate to="/stock-movement/create" replace />} />
              <Route path="/sampling/:id" element={<SamplingRedirect />} />
              <Route path="/quality-requests" element={<QualityRequestListPage />} />
              <Route path="/quality-requests/create" element={<QualityRequestCreatePage />} />
              <Route path="/quality-requests/:id" element={<QualityRequestViewPage />} />
              <Route path="/quality-requests/:id/testing" element={<QualityRequestTestingPage />} />
              <Route path="/stock-movement" element={<StockMovementListPage />} />
              <Route path="/stock-movement/create" element={<StockMovementCreatePage />} />
              <Route path="/stock-movement/:id" element={<StockMovementViewPage />} />
              <Route path="/bmr/print" element={<BMRPrintPage />} />
              <Route path="/bmr/print/:batchId" element={<BMRPrintPage />} />
              <Route path="/proforma-invoices" element={<PIListPage />} />
              <Route path="/proforma-invoices/create" element={<PICreatePage />} />
              <Route path="/proforma-invoices/:id" element={<PIViewPage />} />
              <Route path="/invoices" element={<InvoiceListPage />} />
              <Route path="/invoices/create" element={<InvoiceCreatePage />} />
              <Route path="/invoices/:id" element={<InvoiceViewPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
