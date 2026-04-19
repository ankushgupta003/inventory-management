import type { LedgerEntry } from '@/modules/ledger/types';
import type { ProductionBatch, QaRecord } from '@/modules/production/types';
import type { QualityRequestRecord } from '@/modules/quality-requests/types';
import type { ProformaInvoiceRecord } from '@/modules/pi/types';
import type { InvoiceRecord } from '@/modules/invoices/types';
import type { StockMovementRecord } from '@/modules/stock-movement/types';

export type DateWindow = 'today' | '7d' | '30d' | 'custom';

export interface ReportFilters {
  dateWindow: DateWindow;
  dateFrom: string;
  dateTo: string;
  itemName: string;
  batchNo: string;
  partyName: string;
  status: string;
}

export interface WorkflowStageMetrics {
  stage: 'purchase' | 'mrs' | 'stock-movement' | 'production' | 'qa' | 'pi' | 'invoice';
  label: string;
  count: number;
}

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'low_stock' | 'near_expiry' | 'qa_blocked' | 'overdue_pending';
  title: string;
  description: string;
  href?: string;
  date?: string;
}

export interface DashboardCriticalActivity {
  id: string;
  date: string;
  type: 'issue' | 'sampling' | 'transfer' | 'qa' | 'invoice' | 'pi';
  title: string;
  subtitle: string;
  quantity?: number;
  href?: string;
}

export interface DashboardSnapshot {
  generatedAt: string;
  filters: ReportFilters;
  kpis: {
    inventoryValue: number;
    availableStockQty: number;
    openMrsCount: number;
    qaPendingCount: number;
    blockedBatchCount: number;
    pendingPiQty: number;
  };
  funnel: WorkflowStageMetrics[];
  alerts: DashboardAlert[];
  recentCriticalActivities: DashboardCriticalActivity[];
  throughputTrend: Array<{
    day: string;
    movementQty: number;
    invoiceQty: number;
  }>;
}

export interface StockPosition {
  key: string;
  itemName: string;
  batchNo: string;
  qty: number;
  value: number;
  rate: number;
  expiryDate?: string;
  lastMovementDate?: string;
}

export interface AnalyticsMrsRecord {
  id: string;
  date: string;
  batchId?: string;
  batchNo?: string;
  itemName: string;
  qtyRequested: number;
  qtyIssued: number;
  status: string;
}

export interface ReportDataset {
  ledgerEntries: LedgerEntry[];
  mrsRecords: AnalyticsMrsRecord[];
  productionBatches: ProductionBatch[];
  qaByBatch: Array<{ batchId: string; qa: QaRecord }>;
  qualityRequests: QualityRequestRecord[];
  proformaInvoices: ProformaInvoiceRecord[];
  invoices: InvoiceRecord[];
  stockMovements: StockMovementRecord[];
  stockPositions: StockPosition[];
}

export interface MetricCardViewModel {
  id: string;
  title: string;
  value: string;
  deltaLabel: string;
  deltaPositive: boolean;
  tone: 'blue' | 'green' | 'orange' | 'purple';
  spark: number[];
}

export interface TrendPanelViewModel {
  id: string;
  title: string;
  subtitle?: string;
  points: Array<{
    label: string;
    primary: number;
    secondary?: number;
  }>;
  primaryLabel: string;
  secondaryLabel?: string;
}

export interface RankedListItemViewModel {
  id: string;
  title: string;
  subtitle: string;
  metricLabel: string;
  metricValue: string;
  href?: string;
}
