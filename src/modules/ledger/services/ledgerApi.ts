import api, { USE_MOCK } from '@/services/api';
import type { LedgerEntry, LedgerFilters, LedgerSourceModule } from '../types';

const STORAGE_KEY = 'ledger_store_v1';

type LedgerEntrySeed = Partial<LedgerEntry> & {
  id: string;
  date: string;
  referenceNo: string;
  type: LedgerEntry['type'];
  particulars: string;
  itemName: string;
  itemCategory: LedgerEntry['itemCategory'];
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  receiptQty: number;
  issueQty: number;
  rate: number;
  remarks: string;
};

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function inferSource(entry: Partial<LedgerEntry>): {
  sourceModule: LedgerSourceModule;
  sourceId: string;
  sourcePath: string;
  sourceLabel: string;
} {
  if (entry.purchaseGinId) {
    return {
      sourceModule: 'purchases',
      sourceId: entry.purchaseGinId,
      sourcePath: `/purchases/${entry.purchaseGinId}`,
      sourceLabel: 'Purchase GIN',
    };
  }

  if (entry.stockMovementId) {
    return {
      sourceModule: 'stock-movement',
      sourceId: entry.stockMovementId,
      sourcePath: `/stock-movement/${entry.stockMovementId}`,
      sourceLabel: 'Stock Movement',
    };
  }

  if (entry.invoiceId) {
    return {
      sourceModule: 'invoices',
      sourceId: entry.invoiceId,
      sourcePath: `/invoices/${entry.invoiceId}`,
      sourceLabel: 'Final Invoice',
    };
  }

  if (entry.productionBatchId) {
    return {
      sourceModule: 'production',
      sourceId: entry.productionBatchId,
      sourcePath: `/production/${entry.productionBatchId}`,
      sourceLabel: 'Production Batch',
    };
  }

  return {
    sourceModule: 'ledger',
    sourceId: '',
    sourcePath: '',
    sourceLabel: 'Manual Ledger Entry',
  };
}

function hydrateLedgerEntry(entry: LedgerEntrySeed | Partial<LedgerEntry>): LedgerEntry {
  const receiptQty = Number(entry.receiptQty ?? 0);
  const issueQty = Number(entry.issueQty ?? 0);
  const rate = Number(entry.rate ?? 0);
  const inferredSource = inferSource(entry);

  return {
    id: entry.id ?? `l-${Date.now()}`,
    itemId: entry.itemId ?? '',
    date: entry.date ?? new Date().toISOString().slice(0, 10),
    createdAt: entry.createdAt ?? `${entry.date ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
    referenceNo: entry.referenceNo ?? '',
    type: entry.type ?? 'purchase',
    particulars: entry.particulars ?? '',
    itemName: entry.itemName ?? '',
    itemCategory: entry.itemCategory ?? 'RAW',
    batchNo: entry.batchNo ?? '',
    mfgDate: entry.mfgDate ?? '',
    expiryDate: entry.expiryDate ?? '',
    receiptQty,
    issueQty,
    rate,
    remarks: entry.remarks ?? '',
    transactionValue: Number(entry.transactionValue ?? toMoney(Math.max(receiptQty, issueQty) * rate)),
    purchaseGinId: entry.purchaseGinId ?? '',
    productionBatchId: entry.productionBatchId ?? '',
    stockMovementId: entry.stockMovementId ?? '',
    invoiceId: entry.invoiceId ?? '',
    sourceModule: entry.sourceModule ?? inferredSource.sourceModule,
    sourceId: entry.sourceId ?? inferredSource.sourceId,
    sourcePath: entry.sourcePath ?? inferredSource.sourcePath,
    sourceLabel: entry.sourceLabel ?? inferredSource.sourceLabel,
  };
}

const seedLedger: LedgerEntry[] = [
  {
    id: 'l-1',
    itemId: 'item-cotton',
    purchaseGinId: 'gin-1',
    date: '2026-04-08',
    referenceNo: 'GIN-00001',
    type: 'purchase',
    particulars: 'Vendor A',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 1000,
    issueQty: 0,
    rate: 40,
    remarks: 'Goods inward',
  },
  {
    id: 'l-2',
    itemId: 'item-cotton',
    purchaseGinId: 'gin-2',
    date: '2026-04-08',
    referenceNo: 'GIN-00002',
    type: 'purchase',
    particulars: 'Vendor A',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-002',
    mfgDate: '2026-04-02',
    expiryDate: '2027-04-02',
    receiptQty: 500,
    issueQty: 0,
    rate: 40,
    remarks: 'Goods inward',
  },
  {
    id: 'l-3',
    itemId: 'item-chemical',
    purchaseGinId: 'gin-3',
    date: '2026-04-08',
    referenceNo: 'GIN-00003',
    type: 'purchase',
    particulars: 'Vendor A',
    itemName: 'Chemical',
    itemCategory: 'RAW',
    batchNo: 'RM-003',
    mfgDate: '2026-04-03',
    expiryDate: '2027-04-03',
    receiptQty: 300,
    issueQty: 0,
    rate: 120,
    remarks: 'Goods inward',
  },
  {
    id: 'l-4',
    itemId: 'item-cotton',
    stockMovementId: 'mov-1',
    productionBatchId: 'batch-1',
    date: '2026-04-08',
    referenceNo: 'MOV-00001',
    type: 'issue',
    particulars: 'MRS-00001',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 250,
    rate: 40,
    remarks: 'Issued to production',
  },
  {
    id: 'l-5',
    itemId: 'item-cotton',
    stockMovementId: 'mov-1',
    productionBatchId: 'batch-1',
    date: '2026-04-08',
    referenceNo: 'MOV-00001',
    type: 'issue',
    particulars: 'MRS-00001',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-002',
    mfgDate: '2026-04-02',
    expiryDate: '2027-04-02',
    receiptQty: 0,
    issueQty: 250,
    rate: 40,
    remarks: 'Issued to production',
  },
  {
    id: 'l-6',
    itemId: 'item-chemical',
    stockMovementId: 'mov-1',
    productionBatchId: 'batch-1',
    date: '2026-04-08',
    referenceNo: 'MOV-00001',
    type: 'issue',
    particulars: 'MRS-00001',
    itemName: 'Chemical',
    itemCategory: 'RAW',
    batchNo: 'RM-003',
    mfgDate: '2026-04-03',
    expiryDate: '2027-04-03',
    receiptQty: 0,
    issueQty: 100,
    rate: 120,
    remarks: 'Issued to production',
  },
  {
    id: 'l-7',
    itemId: 'item-cotton',
    stockMovementId: 'mov-2',
    date: '2026-04-08',
    referenceNo: 'MOV-00002',
    type: 'sampling',
    particulars: 'Store -> QC',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 20,
    rate: 40,
    remarks: 'QC sampling',
  },
  {
    id: 'l-8',
    itemId: 'item-cotton',
    stockMovementId: 'mov-3',
    date: '2026-04-08',
    referenceNo: 'MOV-00003',
    type: 'transfer',
    particulars: 'Store -> Production',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 0,
    rate: 40,
    remarks: 'Location transfer',
  },
  {
    id: 'l-9',
    itemId: 'item-fg-a',
    productionBatchId: 'batch-1',
    date: '2026-04-08',
    referenceNo: 'PRD-00001',
    type: 'production',
    particulars: 'Production Output',
    itemName: 'Finished Product A',
    itemCategory: 'FINISHED',
    batchNo: 'FG-001',
    mfgDate: '2026-04-08',
    expiryDate: '2028-04-08',
    receiptQty: 480,
    issueQty: 0,
    rate: 0,
    remarks: 'Finished goods entry',
  },
  {
    id: 'l-10',
    itemId: 'item-fg-a',
    invoiceId: 'inv-1',
    productionBatchId: 'batch-1',
    date: '2026-04-10',
    referenceNo: 'INV-00001',
    type: 'invoice',
    particulars: 'Customer A',
    itemName: 'Finished Product A',
    itemCategory: 'FINISHED',
    batchNo: 'FG-001',
    mfgDate: '2026-04-08',
    expiryDate: '2028-04-08',
    receiptQty: 0,
    issueQty: 300,
    rate: 250,
    remarks: 'Sales invoice',
  },
].map(hydrateLedgerEntry);

const loadMockLedger = (): LedgerEntry[] => {
  if (typeof window === 'undefined') return seedLedger;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedLedger;
  try {
    const parsed = JSON.parse(raw) as Array<Partial<LedgerEntry>>;
    return parsed.length ? parsed.map(hydrateLedgerEntry) : seedLedger;
  } catch {
    return seedLedger;
  }
};

const saveMockLedger = (entries: LedgerEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const ledgerApi = {
  getAll: (filters?: Partial<LedgerFilters>, page = 1, limit = 50) => {
    if (USE_MOCK) {
      const data = loadMockLedger();
      return Promise.resolve({ data, total: data.length });
    }

    return api
      .get<{ data: LedgerEntry[]; total: number }>('/ledger', {
        params: { ...filters, page, limit },
      })
      .then((response) => ({
        ...response.data,
        data: (response.data.data || []).map(hydrateLedgerEntry),
      }));
  },
  create: (data: Partial<LedgerEntry> | { entries: Partial<LedgerEntry>[] }) => {
    if (USE_MOCK) {
      const existing = loadMockLedger();
      const entries = 'entries' in data ? data.entries : [data];
      const stamped = entries.map((entry, index) =>
        hydrateLedgerEntry({
          ...entry,
          id: entry.id || `l-${Date.now()}-${index}`,
          date: entry.date || new Date().toISOString().split('T')[0],
          referenceNo: entry.referenceNo || '',
          type: entry.type || 'purchase',
          particulars: entry.particulars || '',
          itemName: entry.itemName || '',
          itemCategory: entry.itemCategory || 'RAW',
          batchNo: entry.batchNo || '',
          mfgDate: entry.mfgDate || '',
          expiryDate: entry.expiryDate || '',
          receiptQty: entry.receiptQty ?? 0,
          issueQty: entry.issueQty ?? 0,
          rate: entry.rate ?? 0,
          remarks: entry.remarks || '',
        }),
      );
      const next = [...stamped, ...existing];
      saveMockLedger(next);
      return Promise.resolve({ success: true, data: stamped });
    }

    return api.post('/ledger', data).then((response) => response.data);
  },
};
