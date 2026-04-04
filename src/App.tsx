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
import MaterialIssuePage from "@/pages/MaterialIssuePage";
import ProductionPage from "@/pages/ProductionPage";
import ProformaInvoicePage from "@/pages/ProformaInvoicePage";
import FinalInvoicePage from "@/pages/FinalInvoicePage";
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
              <Route path="/material-issue" element={<MaterialIssuePage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/proforma-invoices" element={<ProformaInvoicePage />} />
              <Route path="/invoices" element={<FinalInvoicePage />} />
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
