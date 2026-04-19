import { USE_MOCK } from '@/services/api';
import type { StockMovementRecord, StockMovementType } from '../types';
import { issuesApi } from '@/modules/issues/services/issuesApi';
import { samplingApi } from '@/modules/sampling/services/samplingApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';

let mockMovements: StockMovementRecord[] = [
  {
    id: 'sm-1',
    movementNo: 'MOV-240404-001',
    date: '2026-04-04',
    type: 'issue',
    mrsId: 'mrs-1',
    mrsNo: 'MRS-001',
    productionBatchId: 'prd-1:FG-240401-01',
    productionBatchNo: 'FG-240401-01',
    productionNo: 'PRD-240401-201',
    itemName: 'Steel Rod 10mm',
    batchNo: 'B-2026-001',
    quantity: 80,
    availableQty: 320,
    items: [
      {
        itemId: '1',
        itemName: 'Steel Rod 10mm',
        batchNo: 'B-2026-001',
        quantity: 80,
        availableQty: 320,
        mfgDate: '2026-01-15',
        expiryDate: '2028-01-15',
        requestedQty: 100,
        issuedQty: 80,
        remainingQty: 20,
      },
      {
        itemId: '2',
        itemName: 'Copper Wire 2mm',
        batchNo: 'B-2026-002',
        quantity: 5,
        availableQty: 180,
        mfgDate: '2026-02-10',
        expiryDate: '2029-02-10',
        requestedQty: 50,
        issuedQty: 5,
        remainingQty: 45,
      },
    ],
    mfgDate: '2026-01-15',
    expiryDate: '2028-01-15',
    issuedBy: 'Store Admin',
    createdAt: '2026-04-04',
  },
  {
    id: 'sm-2',
    movementNo: 'MOV-240403-002',
    date: '2026-04-03',
    type: 'sampling',
    itemName: 'Copper Wire 2mm',
    batchNo: 'B-2026-002',
    quantity: 3,
    availableQty: 180,
    items: [
      { itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', quantity: 3, availableQty: 180, mfgDate: '2026-02-10', expiryDate: '2029-02-10' },
    ],
    fromLocation: 'Main Store',
    toLocation: 'QC',
    mfgDate: '2026-02-10',
    expiryDate: '2029-02-10',
    issuedBy: 'QC Lead',
    sampleDrawnBy: 'QC Analyst',
    createdAt: '2026-04-03',
  },
  {
    id: 'sm-3',
    movementNo: 'MOV-240402-003',
    date: '2026-04-02',
    type: 'transfer',
    itemName: 'Packing Box Large',
    batchNo: 'B-2026-003',
    quantity: 20,
    availableQty: 90,
    items: [
      { itemName: 'Packing Box Large', batchNo: 'B-2026-003', quantity: 20, availableQty: 90 },
    ],
    fromLocation: 'Main Store',
    toLocation: 'Warehouse B',
    currentLocation: 'Warehouse B',
    locationHistory: [{ date: '2026-04-02', from: 'Main Store', to: 'Warehouse B' }],
    createdAt: '2026-04-02',
  },
];

export const stockMovementApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockMovements);
    // Backend aggregation endpoint (not implemented)
    return Promise.resolve([] as StockMovementRecord[]);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockMovements.find((m) => m.id === id) || mockMovements[0];
      return Promise.resolve(match);
    }
    return Promise.resolve(null);
  },
  create: async (payload: StockMovementRecord) => {
    if (USE_MOCK) {
      const created = { ...payload, id: `sm-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
      mockMovements = [created, ...mockMovements];
      return created;
    }
    return payload;
  },
  // Helpers to keep backend logic separated by type
  createIssue: async (data: {
    movementNo: string;
    date: string;
    itemId: string;
    itemName: string;
    batchNo: string;
    availableQty: number;
    qty: number;
    mfgDate: string;
    expiryDate: string;
    issuedBy: string;
    mrsId?: string;
    requestedQty?: number;
  }) => {
    if (!USE_MOCK) {
      await issuesApi.create({
        issueNo: data.movementNo,
        date: data.date,
        issueType: 'production',
        mrsId: data.mrsId || '',
        items: [{
          itemId: data.itemId,
          itemName: data.itemName,
          batchNo: data.batchNo,
          availableQty: data.availableQty,
          issueQty: data.qty,
          mfgDate: data.mfgDate,
          expiryDate: data.expiryDate,
          remarks: '',
          requestedQty: data.requestedQty,
        }],
        issuedBy: data.issuedBy,
        approvedBy: '',
        receivedBy: '',
      });
      await ledgerApi.create({
        entries: [{
          date: data.date,
          referenceNo: data.movementNo,
          type: 'issue',
          particulars: 'Stock Issue',
          itemName: data.itemName,
          itemCategory: 'RAW',
          batchNo: data.batchNo,
          mfgDate: data.mfgDate,
          expiryDate: data.expiryDate,
          receiptQty: 0,
          issueQty: data.qty,
          rate: 0,
          remarks: '',
        }],
      });
      return;
    }
  },
  createSampling: async (data: {
    movementNo: string;
    date: string;
    fromLocation: string;
    toLocation: string;
    itemId: string;
    itemName: string;
    batchNo: string;
    availableQty: number;
    qty: number;
    mfgDate: string;
    expiryDate: string;
    issuedBy: string;
    sampleDrawnBy: string;
  }) => {
    if (!USE_MOCK) {
      await samplingApi.create({
        samplingNo: data.movementNo,
        date: data.date,
        fromStore: data.fromLocation,
        toDepartment: data.toLocation,
        items: [{
          itemId: data.itemId,
          itemName: data.itemName,
          batchNo: data.batchNo,
          manufacturedBy: data.itemName,
          mfgDate: data.mfgDate,
          expiryDate: data.expiryDate,
          availableQty: data.availableQty,
          sampleQty: data.qty,
        }],
        issuedBy: data.issuedBy,
        sampleDrawnBy: data.sampleDrawnBy,
      });
      await ledgerApi.create({
        entries: [{
          date: data.date,
          referenceNo: data.movementNo,
          type: 'sampling',
          particulars: 'Sampling',
          itemName: data.itemName,
          itemCategory: 'RAW',
          batchNo: data.batchNo,
          mfgDate: data.mfgDate,
          expiryDate: data.expiryDate,
          receiptQty: 0,
          issueQty: data.qty,
          rate: 0,
          remarks: '',
        }],
      });
      return;
    }
  },
  createTransfer: async (data: {
    movementNo: string;
    date: string;
    fromLocation: string;
    toLocation: string;
    itemName: string;
    batchNo: string;
    qty: number;
  }) => {
    if (!USE_MOCK) {
      await ledgerApi.create({
        entries: [{
          date: data.date,
          referenceNo: data.movementNo,
          type: 'transfer',
          particulars: `${data.fromLocation} → ${data.toLocation}`,
          itemName: data.itemName,
          itemCategory: 'RAW',
          batchNo: data.batchNo,
          mfgDate: '',
          expiryDate: '',
          receiptQty: 0,
          issueQty: 0,
          rate: 0,
          remarks: '',
        }],
      });
      return;
    }
  },
};
