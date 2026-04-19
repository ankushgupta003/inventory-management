import { USE_MOCK } from '@/services/api';
import mrsApi from '@/modules/mrs/services/mrsApi';
import { mockMRSRecords } from '@/modules/mrs/data/mockMRS';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import type { MRSRecord } from '@/modules/mrs/types';
import type { StockMovementRecord } from '@/modules/stock-movement/types';

export type ConsumptionItem = {
  itemId?: string;
  itemName: string;
  qtyRequested: number;
  qtyIssued: number;
  remainingQty: number;
  issues: { movementNo: string; date: string; qty: number }[];
};

export type ConsumptionByBatch = {
  productionBatchId: string;
  productionBatchNo?: string;
  productionNo?: string;
  mrs: {
    mrsId: string;
    mrsNo: string;
    items: ConsumptionItem[];
  }[];
  totals: {
    qtyRequested: number;
    qtyIssued: number;
    remainingQty: number;
  };
};

const toItemKey = (itemId: string | undefined, itemName: string) =>
  itemId ? `id:${itemId}` : `name:${itemName}`;

export async function getConsumptionByProductionBatch(batchId: string): Promise<ConsumptionByBatch> {
  const [mrsRecords, movements] = await Promise.all([
    USE_MOCK ? Promise.resolve(mockMRSRecords) : mrsApi.getAll().catch(() => [] as MRSRecord[]),
    stockMovementApi.getAll().catch(() => [] as StockMovementRecord[]),
  ]);

  const targetMrs = mrsRecords.filter((mrs) => mrs.productionBatchId === batchId);
  const issueMovements = movements.filter((m) =>
    m.type === 'issue' && (m.productionBatchId === batchId || targetMrs.some((mrs) => m.mrsId === mrs.id))
  );

  const mrsSummaries = targetMrs.map((mrs) => {
    const issuesForMrs = issueMovements.filter((m) => m.mrsId === mrs.id);
    const items = mrs.items.map((item) => {
      const key = toItemKey(item.itemId, item.itemName);
      const issues = issuesForMrs.flatMap((movement) =>
        (movement.items || [])
          .filter((it) => toItemKey(it.itemId, it.itemName) === key)
          .map((it) => ({
            movementNo: movement.movementNo,
            date: movement.date,
            qty: it.quantity || 0,
          }))
      );
      const issuesTotal = issues.reduce((s, i) => s + i.qty, 0);
      const issuedQty = Math.max(item.qtyIssued || 0, issuesTotal);
      const remainingQty = Math.max(0, item.qtyRequested - issuedQty);
      return {
        itemId: item.itemId,
        itemName: item.itemName,
        qtyRequested: item.qtyRequested,
        qtyIssued: issuedQty,
        remainingQty,
        issues,
      };
    });
    return { mrsId: mrs.id, mrsNo: mrs.mrsNo, items };
  });

  const totals = mrsSummaries.reduce((acc, summary) => {
    summary.items.forEach((item) => {
      acc.qtyRequested += item.qtyRequested;
      acc.qtyIssued += item.qtyIssued;
      acc.remainingQty += item.remainingQty;
    });
    return acc;
  }, { qtyRequested: 0, qtyIssued: 0, remainingQty: 0 });

  const first = targetMrs[0];
  return {
    productionBatchId: batchId,
    productionBatchNo: first?.productionBatchNo,
    productionNo: first?.productionNo,
    mrs: mrsSummaries,
    totals,
  };
}
