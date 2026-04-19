import { describe, expect, it } from 'vitest';
import { analyticsFixture } from './testFixtures';
import { buildDashboardSnapshot, buildReportView } from './metrics';
import { makeDefaultFilters } from './filters';

describe('analytics metrics', () => {
  it('builds dashboard KPIs and funnel from unified dataset', () => {
    const snapshot = buildDashboardSnapshot(analyticsFixture, makeDefaultFilters());

    expect(snapshot.kpis.inventoryValue).toBe(32000);
    expect(snapshot.kpis.availableStockQty).toBe(800);
    expect(snapshot.kpis.openMrsCount).toBe(1);
    expect(snapshot.kpis.qaPendingCount).toBeGreaterThan(0);
    expect(snapshot.kpis.blockedBatchCount).toBe(1);
    expect(snapshot.kpis.pendingPiQty).toBe(200);

    const invoiceStage = snapshot.funnel.find((row) => row.stage === 'invoice');
    expect(invoiceStage?.count).toBe(1);
  });

  it('builds report view with expiry buckets and movement totals', () => {
    const view = buildReportView(analyticsFixture, makeDefaultFilters());
    expect(view.stockRows).toHaveLength(1);
    expect(view.expiryBuckets.safe + view.expiryBuckets.expiring30 + view.expiryBuckets.expiring90 + view.expiryBuckets.expired).toBe(1);
    expect(view.totalMovementQty).toBe(210);
    expect(view.totalInvoiceAmount).toBe(75000);
    expect(view.totalPendingPiQty).toBe(200);
  });
});

