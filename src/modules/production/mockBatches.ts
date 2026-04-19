import type { ProductionBatch } from './types';

const STORAGE_KEY = 'production_batches';

export const seedBatches: ProductionBatch[] = [
  {
    id: 'batch-1',
    batchNo: 'BMR-2026-041',
    productName: 'Sterile Surgical Gloves - Large',
    batchSize: '10,000 Pairs',
    status: 'IN_PROCESS',
    startDate: '2026-04-05',
    mfgDate: '2026-04-05',
    expDate: '2029-04-04',
  },
  {
    id: 'batch-2',
    batchNo: 'BMR-2026-042',
    productName: 'Sterile Surgical Gloves - Medium',
    batchSize: '8,000 Pairs',
    status: 'QA_PENDING',
    startDate: '2026-04-06',
    mfgDate: '2026-04-06',
    expDate: '2029-04-05',
  },
  {
    id: 'batch-3',
    batchNo: 'BMR-2026-039',
    productName: 'Sterile Surgical Gloves - Small',
    batchSize: '12,000 Pairs',
    status: 'RELEASED',
    startDate: '2026-04-01',
    mfgDate: '2026-04-01',
    expDate: '2029-03-31',
  },
];

export const loadBatches = (): ProductionBatch[] => {
  if (typeof window === 'undefined') return seedBatches;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedBatches;
  try {
    const parsed = JSON.parse(raw) as ProductionBatch[];
    return parsed.length ? parsed : seedBatches;
  } catch {
    return seedBatches;
  }
};

export const saveBatches = (batches: ProductionBatch[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
};

export const addBatch = (batch: ProductionBatch) => {
  const batches = loadBatches();
  const next = [batch, ...batches.filter((b) => b.id !== batch.id)];
  saveBatches(next);
  return next;
};
