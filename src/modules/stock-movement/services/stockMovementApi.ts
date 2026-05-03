import api, { USE_MOCK } from '@/services/api';
import type { StockMovementRecord } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

export type StockMovementCreatePayload = {
  type: 'issue' | 'sampling' | 'transfer';
  productionBatchId?: string;
  materialRequisitionId?: string;
  date: string;
  fromLocation?: string;
  toLocation?: string;
  issuedBy?: string;
  sampleDrawnBy?: string;
  remarks?: string;
  items: Array<{
    itemId: string;
    batchNo: string;
    quantity: number;
    remarks?: string;
  }>;
};

let mockMovements: StockMovementRecord[] = [
  {
    id: 'sm-1',
    movementNo: 'MOV-00001',
    date: '2026-04-04',
    type: 'issue',
    mrsId: 'mrs-1',
    mrsNo: 'MRS-00001',
    productionBatchId: 'batch-1',
    productionBatchNo: 'FG-001',
    productionNo: 'PRD-00001',
    itemName: 'Steel Rod 10mm',
    batchNo: 'RM-001',
    quantity: 80,
    availableQty: 320,
    items: [
      {
        itemId: '1',
        itemName: 'Steel Rod 10mm',
        batchNo: 'RM-001',
        quantity: 80,
        availableQty: 320,
        mfgDate: '2026-01-15',
        expiryDate: '2028-01-15',
        requestedQty: 100,
        issuedQty: 80,
        remainingQty: 20,
      },
    ],
    issuedBy: 'Store Admin',
    qualityRequests: [],
    createdAt: '2026-04-04',
  },
];

export const stockMovementApi = {
  getAll: async (params?: Record<string, string>) => {
    if (USE_MOCK) return mockMovements;
    const response = await api.get<ApiEnvelope<StockMovementRecord[]>>('/stock-movements', { params });
    return response.data.data;
  },
  getById: async (id: string) => {
    if (USE_MOCK) return mockMovements.find((movement) => movement.id === id) ?? null;
    const response = await api.get<ApiEnvelope<StockMovementRecord>>(`/stock-movements/${id}`);
    return response.data.data;
  },
  create: async (payload: StockMovementCreatePayload) => {
    if (USE_MOCK) {
      const created: StockMovementRecord = {
        id: `sm-${Date.now()}`,
        movementNo: `MOV-${String(Date.now()).slice(-5)}`,
        date: payload.date,
        type: payload.type,
        mrsId: payload.materialRequisitionId,
        productionBatchId: payload.productionBatchId,
        itemName: '',
        batchNo: '',
        quantity: payload.items.reduce((sum, item) => sum + item.quantity, 0),
        fromLocation: payload.fromLocation,
        toLocation: payload.toLocation,
        issuedBy: payload.issuedBy,
        sampleDrawnBy: payload.sampleDrawnBy,
        remarks: payload.remarks,
        items: payload.items.map((item) => ({
          itemId: item.itemId,
          itemName: '',
          batchNo: item.batchNo,
          quantity: item.quantity,
          remarks: item.remarks,
        })),
        qualityRequests:
          payload.type === 'sampling'
            ? payload.items.map((item, index) => ({
                id: `qr-${Date.now()}-${index + 1}`,
                requestNo: `QREQ-${String(Date.now() + index).slice(-5)}`,
                status: 'pending',
                itemName: '',
                batchNo: item.batchNo,
              }))
            : [],
        createdAt: new Date().toISOString(),
      };
      mockMovements = [created, ...mockMovements];
      return created;
    }
    const response = await api.post<ApiEnvelope<StockMovementRecord>>('/stock-movements', payload);
    return response.data.data;
  },
  createIssue: (data: {
    date: string;
    itemId: string;
    batchNo: string;
    qty: number;
    issuedBy?: string;
    mrsId?: string;
  }) =>
    stockMovementApi.create({
      type: 'issue',
      materialRequisitionId: data.mrsId,
      date: data.date,
      issuedBy: data.issuedBy,
      items: [
        {
          itemId: data.itemId,
          batchNo: data.batchNo,
          quantity: data.qty,
        },
      ],
    }),
  createSampling: (data: {
    date: string;
    productionBatchId?: string;
    fromLocation: string;
    toLocation: string;
    itemId: string;
    batchNo: string;
    qty: number;
    issuedBy?: string;
    sampleDrawnBy?: string;
  }) =>
    stockMovementApi.create({
      type: 'sampling',
      date: data.date,
      productionBatchId: data.productionBatchId,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      issuedBy: data.issuedBy,
      sampleDrawnBy: data.sampleDrawnBy,
      items: [
        {
          itemId: data.itemId,
          batchNo: data.batchNo,
          quantity: data.qty,
        },
      ],
    }),
  createTransfer: (data: {
    date: string;
    fromLocation: string;
    toLocation: string;
    itemId: string;
    batchNo: string;
    qty: number;
  }) =>
    stockMovementApi.create({
      type: 'transfer',
      date: data.date,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      items: [
        {
          itemId: data.itemId,
          batchNo: data.batchNo,
          quantity: data.qty,
        },
      ],
    }),
};
