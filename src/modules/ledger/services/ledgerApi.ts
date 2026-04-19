import api, { USE_MOCK } from '@/services/api';
import type { LedgerEntry, LedgerFilters } from '../types';

const STORAGE_KEY = 'ledger_store_v1';

const seedLedger: LedgerEntry[] = [
  {
    id: 'l-1',
    date: '2026-04-08',
    referenceNo: 'GIN-RM-001',
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
    date: '2026-04-08',
    referenceNo: 'GIN-RM-002',
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
    date: '2026-04-08',
    referenceNo: 'GIN-RM-003',
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
    date: '2026-04-08',
    referenceNo: 'ISS-RM-001',
    type: 'issue',
    particulars: 'Production',
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
    date: '2026-04-08',
    referenceNo: 'ISS-RM-002',
    type: 'issue',
    particulars: 'Production',
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
    date: '2026-04-08',
    referenceNo: 'ISS-RM-003',
    type: 'issue',
    particulars: 'Production',
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
    date: '2026-04-08',
    referenceNo: 'SMP-RM-001',
    type: 'sampling',
    particulars: 'Sampling',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 20,
    rate: 0,
    remarks: 'QC sampling',
  },
  {
    id: 'l-8',
    date: '2026-04-08',
    referenceNo: 'TRF-RM-001',
    type: 'transfer',
    particulars: 'Store → Production',
    itemName: 'Cotton',
    itemCategory: 'RAW',
    batchNo: 'RM-001',
    mfgDate: '2026-04-01',
    expiryDate: '2027-04-01',
    receiptQty: 0,
    issueQty: 0,
    rate: 0,
    remarks: 'Location transfer',
  },
  {
    id: 'l-9',
    date: '2026-04-08',
    referenceNo: 'PRD-FG-001',
    type: 'production',
    particulars: 'Production',
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
];

const loadMockLedger = (): LedgerEntry[] => {
  if (typeof window === 'undefined') return seedLedger;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedLedger;
  try {
    const parsed = JSON.parse(raw) as LedgerEntry[];
    return parsed.length ? parsed : seedLedger;
  } catch {
    return seedLedger;
  }
};

const saveMockLedger = (entries: LedgerEntry[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const ledgerApi = {
  getAll: (filters?: Partial<LedgerFilters>, page = 1, limit = 50) =>
    {
      if (USE_MOCK) {
        const data = loadMockLedger();
        return Promise.resolve({ data, total: data.length });
      }
      return api
        .get<{ data: LedgerEntry[]; total: number }>('/ledger', {
          params: { ...filters, page, limit },
        })
        .then((r) => r.data);
    },
  create: (data: Partial<LedgerEntry> | { entries: Partial<LedgerEntry>[] }) =>
    {
      if (USE_MOCK) {
        const existing = loadMockLedger();
        const entries = 'entries' in data ? data.entries : [data];
        const stamped = entries.map((entry, idx) => ({
          id: entry.id || `l-${Date.now()}-${idx}`,
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
        }));
        const next = [...stamped, ...existing];
        saveMockLedger(next);
        return Promise.resolve({ success: true });
      }
      return api.post('/ledger', data).then((r) => r.data);
    },
};
