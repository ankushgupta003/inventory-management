import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { piApi } from '@/modules/pi/services/piApi';
import { invoiceApi } from '@/modules/invoices/services/invoiceApi';
import { qualityRequestsApi } from '@/modules/quality-requests/services/qualityRequestsApi';
import { stockMovementApi } from '@/modules/stock-movement/services/stockMovementApi';
import { loadBatches, loadMrs, loadQa } from '@/modules/production/productionStore';
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

const normalizeMrs = (): AnalyticsMrsRecord[] => {
  const batches = loadBatches();
  const rows: AnalyticsMrsRecord[] = [];
  batches.forEach((batch) => {
    const list = loadMrs(batch.id);
    list.forEach((mrs) => {
      rows.push({
        id: mrs.id,
        date: mrs.date,
        batchId: batch.id,
        batchNo: batch.batchNo,
        itemName: mrs.itemName,
        qtyRequested: Number(mrs.qtyRequested || 0),
        qtyIssued: Number(mrs.qtyIssued || 0),
        status: mrs.status,
      });
    });
  });
  return rows;
};

export const fetchReportDataset = async (): Promise<ReportDataset> => {
  const batches = loadBatches();
  const qaByBatch = batches
    .map((batch) => ({ batchId: batch.id, qa: loadQa(batch.id) }))
    .filter((row): row is { batchId: string; qa: NonNullable<typeof row.qa> } => Boolean(row.qa));

  const [ledgerRes, piRes, invoiceRes, qualityRes, movementRes] = await Promise.allSettled([
    ledgerApi.getAll(),
    piApi.getAll(),
    invoiceApi.getAll(),
    qualityRequestsApi.getAll(),
    stockMovementApi.getAll(),
  ]);

  const ledgerEntries = ledgerRes.status === 'fulfilled' ? (ledgerRes.value.data || []) : [];
  const proformaInvoices = piRes.status === 'fulfilled' ? (piRes.value || []) : [];
  const invoices = invoiceRes.status === 'fulfilled' ? (invoiceRes.value || []) : [];
  const qualityRequests = qualityRes.status === 'fulfilled' ? (qualityRes.value || []) : [];
  const stockMovements = movementRes.status === 'fulfilled' ? (movementRes.value || []) : [];

  return {
    ledgerEntries,
    mrsRecords: normalizeMrs(),
    productionBatches: batches,
    qaByBatch,
    qualityRequests,
    proformaInvoices,
    invoices,
    stockMovements,
    stockPositions: toStockPositions(ledgerEntries),
  };
};

