import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { piApi } from '@/modules/pi/services/piApi';
import { invoiceApi } from '@/modules/invoices/services/invoiceApi';
import { qualityRequestsApi } from '@/modules/quality-requests/services/qualityRequestsApi';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import mrsApi from '@/modules/mrs/services/mrsApi';
import { productionApi } from '@/modules/production/services/productionApi';
import type { AnalyticsMrsRecord, ReportDataset, StockPosition } from './types';
import type { LedgerEntry } from '@/modules/ledger/types';

const toStockPositions = (ledgerEntries: LedgerEntry[]): StockPosition[] => {
  const map = new Map<string, StockPosition>();

  ledgerEntries.forEach((entry) => {
    const key = `${entry.itemName}::${entry.batchNo}`;
    const receipt = Number(entry.receiptQty || 0);
    const issue = Number(entry.issueQty || 0);
    const rate = Number(entry.rate || 0);
    const qtyDelta = receipt - issue;
    const valueDelta = (receipt * rate) - (issue * rate);
    const prev = map.get(key);

    const nextQty = (prev?.qty || 0) + qtyDelta;
    const nextValue = (prev?.value || 0) + valueDelta;
    const nextRate = rate > 0 ? rate : (prev?.rate || 0);
    const next: StockPosition = {
      key,
      itemName: entry.itemName,
      batchNo: entry.batchNo,
      qty: nextQty,
      value: Math.max(0, nextValue),
      rate: nextRate,
      expiryDate: entry.expiryDate || prev?.expiryDate,
      lastMovementDate: entry.date > (prev?.lastMovementDate || '') ? entry.date : prev?.lastMovementDate,
    };
    map.set(key, next);
  });

  return Array.from(map.values()).filter((row) => row.qty > 0);
};

const normalizeMrs = (records: Awaited<ReturnType<typeof mrsApi.getAll>>): AnalyticsMrsRecord[] =>
  records.flatMap((mrs) =>
    mrs.items.map((item) => ({
      id: `${mrs.id}:${item.itemId}`,
      date: mrs.date,
      batchId: mrs.productionBatchId,
      batchNo: mrs.productionBatchNo,
      itemName: item.itemName,
      qtyRequested: Number(item.qtyRequested || 0),
      qtyIssued: Number(item.qtyIssued || 0),
      status: mrs.status,
    })),
  );

export const fetchReportDataset = async (): Promise<ReportDataset> => {
  const [productionRes, mrsRes, ledgerRes, piRes, invoiceRes, qualityRes, movementRes] = await Promise.allSettled([
    productionApi.getAll(),
    mrsApi.getAll(),
    ledgerApi.getAll(),
    piApi.getAll(),
    invoiceApi.getAll(),
    qualityRequestsApi.getAll(),
    stockMovementApi.getAll(),
  ]);

  const ledgerEntries = ledgerRes.status === 'fulfilled' ? (ledgerRes.value.data || []) : [];
  const productionBatches = productionRes.status === 'fulfilled' ? productionRes.value : [];
  const mrsRecordsRaw = mrsRes.status === 'fulfilled' ? mrsRes.value : [];
  const proformaInvoices = piRes.status === 'fulfilled' ? (piRes.value || []) : [];
  const invoices = invoiceRes.status === 'fulfilled' ? (invoiceRes.value || []) : [];
  const qualityRequests = qualityRes.status === 'fulfilled' ? (qualityRes.value || []) : [];
  const stockMovements = movementRes.status === 'fulfilled' ? (movementRes.value || []) : [];
  const qaByBatch = productionBatches
    .filter((batch) => batch.bmrStatus === 'SUBMITTED' || batch.status === 'QA_PENDING' || batch.status === 'RELEASED' || batch.status === 'BLOCKED')
    .map((batch) => ({
      batchId: batch.id,
      qa: {
        status: batch.status === 'RELEASED' ? 'APPROVED' : batch.status === 'BLOCKED' ? 'REJECTED' : 'PENDING',
        remarks: batch.qaRemarks || '',
        approvedBy: batch.qaApprovedBy || '',
        decidedAt: batch.qaDecidedAt || '',
      },
    }));

  return {
    ledgerEntries,
    mrsRecords: normalizeMrs(mrsRecordsRaw),
    productionBatches,
    qaByBatch,
    qualityRequests,
    proformaInvoices,
    invoices,
    stockMovements,
    stockPositions: toStockPositions(ledgerEntries),
  };
};
