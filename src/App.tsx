import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { ItemMasterPage } from "@/modules/items";
import { PartyMasterPage } from "@/modules/parties";
import { GINListPage, GoodsInwardPage, GINViewPage } from "@/modules/purchases";
import { MRSListPage, MRSCreatePage, MRSViewPage, MRSIssuePage } from "@/modules/mrs";
import { StockLedgerPage } from "@/modules/ledger";
import { IssueListPage, IssueCreatePage, IssueViewPage } from "@/modules/issues";
import { ProductionCreatePage, ProductionListPage, ProductionViewPage } from "@/modules/production";
import { SamplingListPage, SamplingCreatePage, SamplingViewPage } from "@/modules/sampling";
import MaterialIssuePage from "@/pages/MaterialIssuePage";
import { PIListPage, PICreatePage, PIViewPage } from "@/modules/pi";
import { InvoiceListPage, InvoiceCreatePage, InvoiceViewPage } from "@/modules/invoices";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

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
              <Route path="/purchases" element={<GINListPage />} />
              <Route path="/purchases/create" element={<GoodsInwardPage />} />
              <Route path="/purchases/:id" element={<GINViewPage />} />
              <Route path="/mrs" element={<MRSListPage />} />
              <Route path="/mrs/create" element={<MRSCreatePage />} />
              <Route path="/mrs/:id" element={<MRSViewPage />} />
              <Route path="/mrs/:id/issue" element={<MRSIssuePage />} />
              <Route path="/issues" element={<IssueListPage />} />
              <Route path="/issues/create" element={<IssueCreatePage />} />
              <Route path="/issues/:id" element={<IssueViewPage />} />
              <Route path="/material-issue" element={<MaterialIssuePage />} />
              <Route path="/stock-ledger" element={<StockLedgerPage />} />
              <Route path="/production" element={<ProductionListPage />} />
              <Route path="/production/create" element={<ProductionCreatePage />} />
              <Route path="/production/:id" element={<ProductionViewPage />} />
              <Route path="/sampling" element={<SamplingListPage />} />
              <Route path="/sampling/create" element={<SamplingCreatePage />} />
              <Route path="/sampling/:id" element={<SamplingViewPage />} />
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
