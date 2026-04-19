import type { BmrSchemaValues } from '@/modules/bmr/schemas/bmrSchema';
import type { ProductionBatch, ProductionBatchStatus, MrsRecord, StockMovementRecord, QaRecord } from './types';
import { seedBatches } from './mockBatches';
import { mockBmrData } from '@/modules/bmr/mockData';

type StoredBmr = {
  status: 'DRAFT' | 'SUBMITTED';
  data: BmrSchemaValues;
  updatedAt: string;
  submittedAt?: string;
};

type ProductionStore = {
  batches: ProductionBatch[];
  mrsByBatch: Record<string, MrsRecord[]>;
  stockByBatch: Record<string, StockMovementRecord[]>;
  bmrByBatch: Record<string, StoredBmr>;
  qaByBatch: Record<string, QaRecord>;
};

const STORAGE_KEY = 'production_store_v1';

const nowIsoDate = () => new Date().toISOString().slice(0, 10);

const seedMrsByBatch: Record<string, MrsRecord[]> = {
  'batch-1': [
    {
      id: 'mrs-b1-1',
      date: '2026-04-05',
      itemName: 'Latex Compound - Grade A',
      qtyRequested: 520,
      qtyIssued: 520,
      status: 'CLOSED',
    },
    {
      id: 'mrs-b1-2',
      date: '2026-04-05',
      itemName: 'Cornstarch Powder',
      qtyRequested: 75,
      qtyIssued: 75,
      status: 'CLOSED',
    },
    {
      id: 'mrs-b1-3',
      date: '2026-04-05',
      itemName: 'Packaging Film Roll',
      qtyRequested: 28,
      qtyIssued: 28,
      status: 'CLOSED',
    },
  ],
};

const seedStockByBatch: Record<string, StockMovementRecord[]> = {
  'batch-1': [
    {
      id: 'mv-b1-1',
      date: '2026-04-05',
      reference: 'ISS-240405-001',
      type: 'ISSUE',
      itemName: 'Latex Compound - Grade A',
      qty: 520,
      mrsId: 'mrs-b1-1',
    },
    {
      id: 'mv-b1-2',
      date: '2026-04-05',
      reference: 'ISS-240405-002',
      type: 'ISSUE',
      itemName: 'Cornstarch Powder',
      qty: 75,
      mrsId: 'mrs-b1-2',
    },
    {
      id: 'mv-b1-3',
      date: '2026-04-05',
      reference: 'ISS-240405-003',
      type: 'ISSUE',
      itemName: 'Packaging Film Roll',
      qty: 28,
      mrsId: 'mrs-b1-3',
    },
    {
      id: 'mv-b1-4',
      date: '2026-04-05',
      reference: 'SMP-240405-004',
      type: 'SAMPLING',
      itemName: 'Latex Compound - Grade A',
      qty: 10,
    },
    {
      id: 'mv-b1-5',
      date: '2026-04-05',
      reference: 'TRF-240405-005',
      type: 'TRANSFER',
      itemName: 'Packaging Film Roll',
      qty: 10,
      fromLocation: 'Main Store',
      toLocation: 'Packing',
    },
  ],
};

const seedBmrByBatch: Record<string, StoredBmr> = {
  'batch-1': {
    status: 'SUBMITTED',
    data: mockBmrData,
    updatedAt: new Date('2026-04-06').toISOString(),
    submittedAt: new Date('2026-04-06').toISOString(),
  },
};

const seedQaByBatch: Record<string, QaRecord> = {
  'batch-2': {
    status: 'PENDING',
    remarks: 'Awaiting QA release',
    approvedBy: '',
    decidedAt: '2026-04-06T10:30:00.000Z',
  },
  'batch-3': {
    status: 'APPROVED',
    remarks: 'Released for dispatch',
    approvedBy: 'QA Manager',
    decidedAt: '2026-04-02T15:00:00.000Z',
  },
};

const loadStore = (): ProductionStore => {
  if (typeof window === 'undefined') {
    return {
      batches: seedBatches,
      mrsByBatch: seedMrsByBatch,
      stockByBatch: seedStockByBatch,
      bmrByBatch: seedBmrByBatch,
      qaByBatch: seedQaByBatch,
    };
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      batches: seedBatches,
      mrsByBatch: seedMrsByBatch,
      stockByBatch: seedStockByBatch,
      bmrByBatch: seedBmrByBatch,
      qaByBatch: seedQaByBatch,
    };
  }
  try {
    const parsed = JSON.parse(raw) as ProductionStore;
    return {
      batches: parsed.batches?.length ? parsed.batches : seedBatches,
      mrsByBatch: Object.keys(parsed.mrsByBatch ?? {}).length ? parsed.mrsByBatch : seedMrsByBatch,
      stockByBatch: Object.keys(parsed.stockByBatch ?? {}).length ? parsed.stockByBatch : seedStockByBatch,
      bmrByBatch: Object.keys(parsed.bmrByBatch ?? {}).length ? parsed.bmrByBatch : seedBmrByBatch,
      qaByBatch: Object.keys(parsed.qaByBatch ?? {}).length ? parsed.qaByBatch : seedQaByBatch,
    };
  } catch {
    return {
      batches: seedBatches,
      mrsByBatch: seedMrsByBatch,
      stockByBatch: seedStockByBatch,
      bmrByBatch: seedBmrByBatch,
      qaByBatch: seedQaByBatch,
    };
  }
};

const saveStore = (store: ProductionStore) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const ensureArray = <T,>(value?: T[]) => (value ? [...value] : []);

export const loadBatches = (): ProductionBatch[] => loadStore().batches;

export const getBatch = (batchId: string) => loadStore().batches.find((b) => b.id === batchId);

export const getBatchByBatchNo = (batchNo: string) =>
  loadStore().batches.find((b) => b.batchNo === batchNo);

export const addBatch = (batch: ProductionBatch) => {
  const store = loadStore();
  const next = [batch, ...store.batches.filter((b) => b.id !== batch.id)];
  store.batches = next;
  saveStore(store);
  return next;
};

export const updateBatch = (batchId: string, updates: Partial<ProductionBatch>) => {
  const store = loadStore();
  store.batches = store.batches.map((b) => (b.id === batchId ? { ...b, ...updates } : b));
  saveStore(store);
  return store.batches.find((b) => b.id === batchId);
};

export const updateBatchStatus = (batchId: string, status: ProductionBatchStatus) =>
  updateBatch(batchId, { status });

export const loadMrs = (batchId: string) => {
  const store = loadStore();
  return ensureArray(store.mrsByBatch[batchId]);
};

export const addMrs = (batchId: string, record: MrsRecord) => {
  const store = loadStore();
  const list = ensureArray(store.mrsByBatch[batchId]);
  store.mrsByBatch[batchId] = [record, ...list];
  const batch = store.batches.find((b) => b.id === batchId);
  if (batch?.status === 'DRAFT') {
    batch.status = 'IN_PROCESS';
  }
  saveStore(store);
  return store.mrsByBatch[batchId];
};

export const loadStockMovements = (batchId: string) => {
  const store = loadStore();
  return ensureArray(store.stockByBatch[batchId]);
};

const updateMrsIssued = (mrs: MrsRecord, qty: number): MrsRecord => {
  const nextIssued = mrs.qtyIssued + qty;
  const status: MrsRecord['status'] =
    nextIssued === 0 ? 'OPEN' : nextIssued >= mrs.qtyRequested ? 'CLOSED' : 'PARTIAL';
  return {
    ...mrs,
    qtyIssued: Math.min(nextIssued, mrs.qtyRequested),
    status,
  };
};

export const addStockMovement = (batchId: string, movement: StockMovementRecord) => {
  const store = loadStore();
  const list = ensureArray(store.stockByBatch[batchId]);
  store.stockByBatch[batchId] = [movement, ...list];

  if (movement.type === 'ISSUE' && movement.mrsId) {
    const mrsList = ensureArray(store.mrsByBatch[batchId]);
    store.mrsByBatch[batchId] = mrsList.map((mrs) =>
      mrs.id === movement.mrsId ? updateMrsIssued(mrs, movement.qty) : mrs
    );
  }

  const batch = store.batches.find((b) => b.id === batchId);
  if (batch && batch.status === 'DRAFT') {
    batch.status = 'IN_PROCESS';
  }
  saveStore(store);
  return store.stockByBatch[batchId];
};

export const loadBmr = (batchId: string): StoredBmr | null => {
  const store = loadStore();
  return store.bmrByBatch[batchId] ?? null;
};

export const saveBmrDraft = (batchId: string, data: BmrSchemaValues) => {
  const store = loadStore();
  store.bmrByBatch[batchId] = {
    status: 'DRAFT',
    data,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
};

export const submitBmr = (batchId: string, data: BmrSchemaValues) => {
  const store = loadStore();
  store.bmrByBatch[batchId] = {
    status: 'SUBMITTED',
    data,
    updatedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  };
  const batch = store.batches.find((b) => b.id === batchId);
  if (batch) {
    batch.status = 'QA_PENDING';
  }
  saveStore(store);
};

export const loadQa = (batchId: string): QaRecord | null => {
  const store = loadStore();
  return store.qaByBatch[batchId] ?? null;
};

export const saveQa = (batchId: string, record: QaRecord) => {
  const store = loadStore();
  store.qaByBatch[batchId] = record;
  store.batches = store.batches.map((b) => {
    if (b.id !== batchId) return b;
    if (record.status === 'APPROVED') return { ...b, status: 'RELEASED' };
    if (record.status === 'REJECTED') return { ...b, status: 'BLOCKED' };
    return { ...b, status: 'QA_PENDING' };
  });
  saveStore(store);
};

export const getIssuedSummary = (batchId: string) => {
  const movements = loadStockMovements(batchId);
  return movements
    .filter((m) => m.type === 'ISSUE' || m.type === 'SAMPLING')
    .reduce((sum, m) => sum + m.qty, 0);
};

export const getMrsTotals = (batchId: string) => {
  const list = loadMrs(batchId);
  const totalRequested = list.reduce((sum, row) => sum + row.qtyRequested, 0);
  const totalIssued = list.reduce((sum, row) => sum + row.qtyIssued, 0);
  return { totalRequested, totalIssued };
};

export const buildRawMaterialsFromMrs = (batchId: string, fallback: BmrSchemaValues['rawMaterials']) => {
  const list = loadMrs(batchId);
  if (!list.length) return fallback;
  return list.map((mrs, idx) => ({
    id: `rm-${batchId}-${idx}`,
    materialName: mrs.itemName,
    requiredQty: mrs.qtyRequested,
    issuedQty: mrs.qtyIssued,
    usedQty: 0,
    returnedQty: 0,
  }));
};

export const getBatchLifecycleStatus = (batchId: string): ProductionBatchStatus => {
  const batch = getBatch(batchId);
  return batch?.status ?? 'DRAFT';
};

export const getDefaultMrs = (): MrsRecord => ({
  id: `mrs-${Date.now()}`,
  date: nowIsoDate(),
  itemName: '',
  qtyRequested: 0,
  qtyIssued: 0,
  status: 'OPEN',
});

export const getDefaultStockMovement = (): StockMovementRecord => ({
  id: `mv-${Date.now()}`,
  date: nowIsoDate(),
  reference: `SM-${Date.now()}`,
  type: 'ISSUE',
  itemName: '',
  qty: 0,
});
