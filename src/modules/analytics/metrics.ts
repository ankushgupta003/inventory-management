import type {
  DashboardAlert,
  DashboardCriticalActivity,
  DashboardSnapshot,
  ReportDataset,
  ReportFilters,
  WorkflowStageMetrics,
} from './types';
import { getDateBounds, isWithinDateBounds } from './filters';

const LOW_STOCK_THRESHOLD = 100;
const NEAR_EXPIRY_DAYS = 30;
const OVERDUE_PENDING_DAYS = 3;

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const daysBetween = (from: string, to: string) => {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const ms = startOfDay(toDate).getTime() - startOfDay(fromDate).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

const diffFromTodayInDays = (date: string) => {
  if (!date) return Number.POSITIVE_INFINITY;
  const target = new Date(`${date}T00:00:00`);
  const today = startOfDay(new Date());
  const diff = startOfDay(target).getTime() - today.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
};

const inScope = (
  date: string,
  filters: ReportFilters,
  fields: Array<{ key: string; value: string | undefined }>
) => {
  if (!isWithinDateBounds(date, filters)) return false;
  const expected = new Map([
    ['itemName', filters.itemName],
    ['batchNo', filters.batchNo],
    ['partyName', filters.partyName],
    ['status', filters.status],
  ]);
  return fields.every((field) => {
    const filter = expected.get(field.key);
    if (!filter || filter === 'all') return true;
    return (field.value || '').toLowerCase() === filter.toLowerCase();
  });
};

const matchesValue = (filterValue: string, recordValue: string | undefined) => {
  if (!filterValue || filterValue === 'all') return true;
  return (recordValue || '').toLowerCase() === filterValue.toLowerCase();
};

const matchesAnyValue = (filterValue: string, recordValues: Array<string | undefined>) => {
  if (!filterValue || filterValue === 'all') return true;
  return recordValues.some((value) => (value || '').toLowerCase() === filterValue.toLowerCase());
};

const matchesProductionBatchFilters = (batch: ReportDataset['productionBatches'][number], filters: ReportFilters) =>
  inScope(batch.startDate, filters, [
    { key: 'itemName', value: batch.productName },
    { key: 'batchNo', value: batch.batchNo },
    { key: 'status', value: batch.status },
  ]);

const matchesProformaInvoiceFilters = (row: ReportDataset['proformaInvoices'][number], filters: ReportFilters) => {
  if (!isWithinDateBounds(row.date, filters)) return false;
  if (!matchesValue(filters.partyName, row.customerName)) return false;
  if (!matchesValue(filters.status, row.status)) return false;
  if (!matchesAnyValue(filters.itemName, row.items.map((item) => item.itemName))) return false;
  if (filters.batchNo !== 'all') return false;
  return true;
};

const matchesInvoiceFilters = (row: ReportDataset['invoices'][number], filters: ReportFilters) => {
  if (!isWithinDateBounds(row.date, filters)) return false;
  if (!matchesValue(filters.partyName, row.customerName)) return false;
  if (!matchesValue(filters.status, row.status)) return false;
  if (!matchesAnyValue(filters.itemName, row.items.map((item) => item.itemName))) return false;
  if (!matchesAnyValue(filters.batchNo, row.items.map((item) => item.batchNo))) return false;
  return true;
};

export const getFilterOptions = (dataset: ReportDataset) => {
  const itemSet = new Set<string>();
  const batchSet = new Set<string>();
  const partySet = new Set<string>();
  const statusSet = new Set<string>();

  dataset.stockPositions.forEach((row) => {
    if (row.itemName) itemSet.add(row.itemName);
    if (row.batchNo) batchSet.add(row.batchNo);
  });
  dataset.ledgerEntries.forEach((row) => {
    if (row.itemName) itemSet.add(row.itemName);
    if (row.batchNo) batchSet.add(row.batchNo);
  });
  dataset.stockMovements.forEach((row) => {
    if (row.itemName) itemSet.add(row.itemName);
    if (row.batchNo) batchSet.add(row.batchNo);
    if (row.type) statusSet.add(row.type);
  });
  dataset.proformaInvoices.forEach((row) => {
    if (row.customerName) partySet.add(row.customerName);
    if (row.status) statusSet.add(row.status);
    row.items.forEach((item) => itemSet.add(item.itemName));
  });
  dataset.invoices.forEach((row) => {
    if (row.customerName) partySet.add(row.customerName);
    if (row.status) statusSet.add(row.status);
    row.items.forEach((item) => {
      itemSet.add(item.itemName);
      if (item.batchNo) batchSet.add(item.batchNo);
    });
  });
  dataset.qualityRequests.forEach((row) => {
    if (row.itemName) itemSet.add(row.itemName);
    if (row.batchNo) batchSet.add(row.batchNo);
    if (row.status) statusSet.add(row.status);
    if (row.requestedBy) partySet.add(row.requestedBy);
  });
  dataset.productionBatches.forEach((row) => {
    statusSet.add(row.status);
    if (row.productName) itemSet.add(row.productName);
    if (row.batchNo) batchSet.add(row.batchNo);
  });
  dataset.mrsRecords.forEach((row) => {
    if (row.status) statusSet.add(row.status);
    if (row.itemName) itemSet.add(row.itemName);
    if (row.batchNo) batchSet.add(row.batchNo);
  });

  return {
    items: ['all', ...Array.from(itemSet).sort()],
    batches: ['all', ...Array.from(batchSet).sort()],
    parties: ['all', ...Array.from(partySet).sort()],
    statuses: ['all', ...Array.from(statusSet).sort()],
  };
};

const buildThroughputTrend = (dataset: ReportDataset, filters: ReportFilters) => {
  const { from, to } = getDateBounds(filters);
  if (!from || !to) return [] as DashboardSnapshot['throughputTrend'];

  const points: DashboardSnapshot['throughputTrend'] = [];
  const current = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (current <= end) {
    const day = current.toISOString().slice(0, 10);
    const movementQty = dataset.stockMovements
      .filter((row) =>
        row.date === day &&
        inScope(row.date, filters, [
          { key: 'itemName', value: row.itemName },
          { key: 'batchNo', value: row.batchNo },
          { key: 'status', value: row.type },
        ])
      )
      .reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const invoiceQty = dataset.invoices
      .filter((row) => row.date === day && matchesInvoiceFilters(row, filters))
      .reduce((sum, row) => sum + Number(row.totalQuantity || 0), 0);
    points.push({ day: day.slice(5), movementQty, invoiceQty });
    current.setDate(current.getDate() + 1);
  }
  return points;
};

const buildAlerts = (dataset: ReportDataset, filters: ReportFilters): DashboardAlert[] => {
  const alerts: DashboardAlert[] = [];

  dataset.stockPositions.forEach((row) => {
    if (filters.itemName !== 'all' && row.itemName !== filters.itemName) return;
    if (filters.batchNo !== 'all' && row.batchNo !== filters.batchNo) return;
    if (row.qty <= LOW_STOCK_THRESHOLD) {
      alerts.push({
        id: `low-${row.key}`,
        severity: 'warning',
        type: 'low_stock',
        title: `Low stock: ${row.itemName}`,
        description: `Batch ${row.batchNo} has ${row.qty.toLocaleString('en-IN')} units available.`,
      });
    }
    const expiryDiff = diffFromTodayInDays(row.expiryDate || '');
    if (expiryDiff >= 0 && expiryDiff <= NEAR_EXPIRY_DAYS) {
      alerts.push({
        id: `exp-${row.key}`,
        severity: 'warning',
        type: 'near_expiry',
        title: `Near expiry: ${row.itemName}`,
        description: `Batch ${row.batchNo} expires in ${expiryDiff} day(s).`,
      });
    }
  });

  dataset.productionBatches
    .filter((batch) => batch.status === 'BLOCKED')
    .forEach((batch) => {
      if (!matchesProductionBatchFilters(batch, filters)) return;
      alerts.push({
        id: `qa-${batch.id}`,
        severity: 'critical',
        type: 'qa_blocked',
        title: `Batch blocked by QA: ${batch.batchNo}`,
        description: `${batch.productName} is currently blocked for release.`,
        href: `/production/${batch.id}`,
      });
    });

  const todayIso = new Date().toISOString().slice(0, 10);
  dataset.qualityRequests
    .filter((row) => row.status === 'pending' || row.status === 'approved' || row.status === 'under_testing')
    .forEach((row) => {
      if (!inScope(row.date, filters, [
        { key: 'itemName', value: row.itemName },
        { key: 'batchNo', value: row.batchNo },
        { key: 'partyName', value: row.requestedBy },
        { key: 'status', value: row.status },
      ])) return;
      if (daysBetween(row.date, todayIso) > OVERDUE_PENDING_DAYS) {
        alerts.push({
          id: `over-${row.id}`,
          severity: 'info',
          type: 'overdue_pending',
          title: `Pending QA request: ${row.requestNo}`,
          description: `${row.itemName} (${row.batchNo}) has been pending for ${daysBetween(row.date, todayIso)} day(s).`,
          href: `/quality-requests/${row.id}`,
          date: row.date,
        });
      }
    });

  return alerts.slice(0, 12);
};

const buildCriticalActivities = (dataset: ReportDataset, filters: ReportFilters): DashboardCriticalActivity[] => {
  const activities: DashboardCriticalActivity[] = [];

  dataset.stockMovements.forEach((row) => {
    if (!inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.type },
    ])) return;
    activities.push({
      id: `mv-${row.id}`,
      date: row.date,
      type: row.type,
      title: `${row.type.toUpperCase()} - ${row.itemName}`,
      subtitle: `${row.movementNo} | ${row.batchNo}`,
      quantity: row.quantity,
      href: `/stock-movement/${row.id}`,
    });
  });

  dataset.qualityRequests.forEach((row) => {
    if (!inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'partyName', value: row.requestedBy },
      { key: 'status', value: row.status },
    ])) return;
    activities.push({
      id: `qa-${row.id}`,
      date: row.date,
      type: 'qa',
      title: `QA ${row.status.replace('_', ' ')} - ${row.itemName}`,
      subtitle: `${row.requestNo} | ${row.batchNo}`,
      href: `/quality-requests/${row.id}`,
    });
  });

  dataset.invoices.forEach((row) => {
    if (!matchesInvoiceFilters(row, filters)) return;
    activities.push({
      id: `inv-${row.id}`,
      date: row.date,
      type: 'invoice',
      title: `Invoice ${row.invoiceNo}`,
      subtitle: row.customerName,
      quantity: row.totalQuantity,
      href: `/invoices/${row.id}`,
    });
  });

  dataset.proformaInvoices.forEach((row) => {
    if (!matchesProformaInvoiceFilters(row, filters)) return;
    activities.push({
      id: `pi-${row.id}`,
      date: row.date,
      type: 'pi',
      title: `PI ${row.piNo} (${row.status})`,
      subtitle: row.customerName,
      quantity: row.totalQuantity,
      href: `/proforma-invoices/${row.id}`,
    });
  });

  return activities
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 12);
};

const buildFunnel = (dataset: ReportDataset, filters: ReportFilters): WorkflowStageMetrics[] => {
  const purchases = dataset.ledgerEntries.filter((row) =>
    row.type === 'purchase' &&
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.type },
    ])
  );

  const mrs = dataset.mrsRecords.filter((row) =>
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.status },
    ])
  );

  const movements = dataset.stockMovements.filter((row) =>
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.type },
    ])
  );

  const qa = dataset.qualityRequests.filter((row) =>
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.status },
    ])
  );

  const pi = dataset.proformaInvoices.filter((row) =>
    matchesProformaInvoiceFilters(row, filters)
  );

  const invoices = dataset.invoices.filter((row) =>
    matchesInvoiceFilters(row, filters)
  );

  return [
    { stage: 'purchase', label: 'Purchase', count: purchases.length },
    { stage: 'mrs', label: 'MRS', count: mrs.length },
    { stage: 'stock-movement', label: 'Stock Movement', count: movements.length },
    { stage: 'production', label: 'Production', count: dataset.productionBatches.filter((batch) => matchesProductionBatchFilters(batch, filters)).length },
    { stage: 'qa', label: 'QA', count: qa.length },
    { stage: 'pi', label: 'PI', count: pi.length },
    { stage: 'invoice', label: 'Invoice', count: invoices.length },
  ];
};

const isOpenPiStatus = (status: string) => status === 'pending' || status === 'partial';
const isOpenMrsStatus = (status: string) => {
  const normalized = status.toLowerCase();
  return normalized !== 'issued' && normalized !== 'closed';
};

export const buildDashboardSnapshot = (dataset: ReportDataset, filters: ReportFilters): DashboardSnapshot => {
  const stockPositions = dataset.stockPositions.filter((row) => {
    if (filters.itemName !== 'all' && row.itemName !== filters.itemName) return false;
    if (filters.batchNo !== 'all' && row.batchNo !== filters.batchNo) return false;
    return true;
  });

  const openMrs = dataset.mrsRecords.filter((row) =>
    isOpenMrsStatus(row.status) &&
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.status },
    ])
  );
  const qaPending = dataset.productionBatches.filter((batch) => batch.status === 'QA_PENDING' && matchesProductionBatchFilters(batch, filters)).length
    + dataset.qualityRequests.filter((row) =>
      (row.status === 'pending' || row.status === 'approved' || row.status === 'under_testing') &&
      inScope(row.date, filters, [
        { key: 'itemName', value: row.itemName },
        { key: 'batchNo', value: row.batchNo },
        { key: 'partyName', value: row.requestedBy },
        { key: 'status', value: row.status },
      ])
    ).length;
  const blockedBatches = dataset.productionBatches.filter((batch) => batch.status === 'BLOCKED' && matchesProductionBatchFilters(batch, filters)).length;
  const pendingPiQty = dataset.proformaInvoices
    .filter((row) => isOpenPiStatus(row.status) && matchesProformaInvoiceFilters(row, filters))
    .reduce((sum, row) => sum + row.items.reduce((itemSum, item) => itemSum + Math.max(0, (item.quantity || 0) - (item.invoicedQty || 0)), 0), 0);

  const inventoryValue = stockPositions.reduce((sum, row) => sum + row.value, 0);
  const availableStockQty = stockPositions.reduce((sum, row) => sum + row.qty, 0);

  return {
    generatedAt: new Date().toISOString(),
    filters,
    kpis: {
      inventoryValue,
      availableStockQty,
      openMrsCount: openMrs.length,
      qaPendingCount: qaPending,
      blockedBatchCount: blockedBatches,
      pendingPiQty,
    },
    funnel: buildFunnel(dataset, filters),
    alerts: buildAlerts(dataset, filters),
    recentCriticalActivities: buildCriticalActivities(dataset, filters),
    throughputTrend: buildThroughputTrend(dataset, filters),
  };
};

export const buildReportView = (dataset: ReportDataset, filters: ReportFilters) => {
  const stockRows = dataset.stockPositions.filter((row) =>
    inScope(row.lastMovementDate || '', filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
    ])
  );

  const movementRows = dataset.stockMovements.filter((row) =>
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.type },
    ])
  );

  const qaRows = dataset.qualityRequests.filter((row) =>
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'partyName', value: row.requestedBy },
      { key: 'status', value: row.status },
    ])
  );

  const piRows = dataset.proformaInvoices.filter((row) =>
    matchesProformaInvoiceFilters(row, filters)
  );

  const invoiceRows = dataset.invoices.filter((row) =>
    matchesInvoiceFilters(row, filters)
  );

  const openMrsRows = dataset.mrsRecords.filter((row) =>
    isOpenMrsStatus(row.status) &&
    inScope(row.date, filters, [
      { key: 'itemName', value: row.itemName },
      { key: 'batchNo', value: row.batchNo },
      { key: 'status', value: row.status },
    ])
  );

  const expiryBuckets = stockRows.reduce(
    (acc, row) => {
      const d = diffFromTodayInDays(row.expiryDate || '');
      if (d < 0) acc.expired += 1;
      else if (d <= 30) acc.expiring30 += 1;
      else if (d <= 90) acc.expiring90 += 1;
      else acc.safe += 1;
      return acc;
    },
    { expired: 0, expiring30: 0, expiring90: 0, safe: 0 }
  );

  return {
    stockRows,
    movementRows,
    qaRows,
    piRows,
    invoiceRows,
    openMrsRows,
    expiryBuckets,
    totalPendingPiQty: piRows
      .filter((row) => isOpenPiStatus(row.status))
      .reduce((sum, row) => sum + row.items.reduce((itemSum, item) => itemSum + Math.max(0, item.quantity - (item.invoicedQty || 0)), 0), 0),
    totalInvoiceAmount: invoiceRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0),
    totalMovementQty: movementRows.reduce((sum, row) => sum + (row.quantity || 0), 0),
    throughputTrend: buildThroughputTrend(dataset, filters),
    funnel: buildFunnel(dataset, filters),
  };
};
