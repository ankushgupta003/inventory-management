import api, { USE_MOCK } from '@/services/api';
import type { MRSRecord } from '@/modules/mrs/types';
import type { BmrSchemaValues } from '@/modules/bmr/schemas/bmrSchema';
import type { ProductionBatchFormValues } from '../schemas/productionSchema';
import type { ProductionBatch, ProductionBmrRecord, QaRecord } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<T, TMeta = unknown> {
  data: T;
  meta?: TMeta;
}

const mockProductionBatches: ProductionBatch[] = [
  {
    id: 'batch-1',
    itemId: 'fg-1',
    productionNo: 'PRD-00001',
    batchNo: 'FG-001',
    productName: 'Finished Product A',
    batchSize: '500',
    status: 'QA_PENDING',
    startDate: '2026-04-08',
    mfgDate: '2026-04-08',
    expDate: '2028-04-08',
    expectedQty: 500,
    actualQty: 480,
    rejectedQty: 20,
    bmrStatus: 'SUBMITTED',
    qaApprovedBy: '',
    qaRemarks: '',
    qaDecidedAt: '',
    createdAt: '2026-04-08T00:00:00.000Z',
    updatedAt: '2026-04-08T00:00:00.000Z',
    mrsCount: 2,
    movementCount: 3,
  },
];

export const productionApi = {
  getAll: async (params?: Record<string, string>) => {
    if (USE_MOCK) return mockProductionBatches;
    const response = await api.get<ApiListEnvelope<ProductionBatch[]>>('/production', { params });
    return response.data.data;
  },
  getById: async (id: string) => {
    if (USE_MOCK) return mockProductionBatches.find((batch) => batch.id === id) ?? null;
    const response = await api.get<ApiEnvelope<ProductionBatch>>(`/production/${id}`);
    return response.data.data;
  },
  create: async (data: ProductionBatchFormValues) => {
    if (USE_MOCK) {
      const created: ProductionBatch = {
        id: `batch-${Date.now()}`,
        itemId: data.itemId,
        productionNo: `PRD-${String(Date.now()).slice(-5)}`,
        batchNo: data.batchNo,
        productName: 'Finished Product',
        batchSize: data.batchSize,
        status: 'DRAFT',
        startDate: data.mfgDate,
        mfgDate: data.mfgDate,
        expDate: data.expDate,
        expectedQty: 0,
        actualQty: 0,
        rejectedQty: 0,
        bmrStatus: null,
        qaApprovedBy: '',
        qaRemarks: '',
        qaDecidedAt: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mrsCount: 0,
        movementCount: 0,
      };
      mockProductionBatches.unshift(created);
      return created;
    }
    const response = await api.post<ApiEnvelope<ProductionBatch>>('/production', data);
    return response.data.data;
  },
  getBmr: async (batchId: string) => {
    if (USE_MOCK) return null as ProductionBmrRecord<BmrSchemaValues> | null;
    const response = await api.get<ApiEnvelope<ProductionBmrRecord<BmrSchemaValues> | null>>(`/production/${batchId}/bmr`);
    return response.data.data;
  },
  saveBmr: async (batchId: string, data: BmrSchemaValues) => {
    if (USE_MOCK) {
      return {
        id: `bmr-${batchId}`,
        status: 'DRAFT',
        data,
        submittedAt: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ProductionBmrRecord<BmrSchemaValues>;
    }
    const response = await api.put<ApiEnvelope<ProductionBmrRecord<BmrSchemaValues>>>(`/production/${batchId}/bmr`, { data });
    return response.data.data;
  },
  submitBmr: async (batchId: string, data: BmrSchemaValues) => {
    if (USE_MOCK) {
      return {
        id: `bmr-${batchId}`,
        status: 'SUBMITTED',
        data,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } satisfies ProductionBmrRecord<BmrSchemaValues>;
    }
    const response = await api.post<ApiEnvelope<ProductionBmrRecord<BmrSchemaValues>>>(`/production/${batchId}/bmr/submit`, { data });
    return response.data.data;
  },
  submitQa: async (batchId: string, data: QaRecord) => {
    if (USE_MOCK) {
      return mockProductionBatches[0] ?? null;
    }
    const response = await api.post<ApiEnvelope<ProductionBatch>>(`/production/${batchId}/qa`, data);
    return response.data.data;
  },
  getMrs: async (batchId: string) => {
    if (USE_MOCK) return [] as MRSRecord[];
    const response = await api.get<ApiEnvelope<MRSRecord[]>>(`/production/${batchId}/mrs`);
    return response.data.data;
  },
};
