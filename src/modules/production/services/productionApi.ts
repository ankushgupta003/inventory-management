import api, { USE_MOCK } from '@/services/api';
import type { ProductionRecord } from '../types';
import type { ProductionFormValues } from '../schemas/productionSchema';

let mockProduction: ProductionRecord[] = [
  {
    id: 'prd-1',
    productionNo: 'PRD-240401-201',
    date: '2026-04-01',
    outputs: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', mfgDate: '2026-04-01', expiryDate: '2028-04-01', qtyProduced: 120 },
    ],
    inputs: [
      { itemId: 'rm-1', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', availableQty: 320, qtyUsed: 80 },
    ],
    createdAt: '2026-04-01',
  },
  {
    id: 'prd-2',
    productionNo: 'PRD-240402-203',
    date: '2026-04-02',
    outputs: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', mfgDate: '2026-04-02', expiryDate: '2028-04-02', qtyProduced: 60 },
    ],
    inputs: [
      { itemId: 'rm-2', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', availableQty: 180, qtyUsed: 30 },
    ],
    createdAt: '2026-04-02',
  },
];

export const productionApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockProduction);
    return api.get<ProductionRecord[]>('/production').then((r) => r.data);
  },
  create: (data: ProductionFormValues) => {
    if (USE_MOCK) {
      const created: ProductionRecord = {
        id: `prd-${Date.now()}`,
        productionNo: data.productionNo,
        date: data.date,
        outputs: data.outputs,
        inputs: data.inputs,
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockProduction = [created, ...mockProduction];
      return Promise.resolve(created);
    }
    return api.post<ProductionRecord>('/production', data).then((r) => r.data);
  },
};
