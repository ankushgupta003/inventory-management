import api, { USE_MOCK } from '@/services/api';
import type { SamplingRecord } from '../types';
import type { SamplingFormValues } from '../schemas/samplingSchema';

let mockSampling: SamplingRecord[] = [
  {
    id: 'smp-1',
    samplingNo: 'SMP-240401-301',
    date: '2026-04-01',
    fromStore: 'Main Store',
    toDepartment: 'QC',
    items: [
      { itemId: '1', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', manufacturedBy: 'ABC Steel Pvt Ltd', mfgDate: '2026-01-15', expiryDate: '2028-01-15', availableQty: 320, sampleQty: 5 },
    ],
    issuedBy: 'Store Admin',
    sampleDrawnBy: 'QC Analyst',
    createdAt: '2026-04-01',
  },
  {
    id: 'smp-2',
    samplingNo: 'SMP-240402-302',
    date: '2026-04-02',
    fromStore: 'Warehouse B',
    toDepartment: 'QC',
    items: [
      { itemId: '2', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', manufacturedBy: 'CopperWorks India', mfgDate: '2026-02-10', expiryDate: '2029-02-10', availableQty: 180, sampleQty: 3 },
    ],
    issuedBy: 'Store Lead',
    sampleDrawnBy: 'QC Lead',
    createdAt: '2026-04-02',
  },
];

export const samplingApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockSampling);
    return api.get<SamplingRecord[]>('/sampling').then((r) => r.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockSampling.find((i) => i.id === id) || mockSampling[0];
      return Promise.resolve(match);
    }
    return api.get<SamplingRecord>(`/sampling/${id}`).then((r) => r.data);
  },
  create: (data: SamplingFormValues) => {
    if (USE_MOCK) {
      const created: SamplingRecord = {
        id: `smp-${Date.now()}`,
        samplingNo: data.samplingNo,
        date: data.date,
        fromStore: data.fromStore,
        toDepartment: data.toDepartment,
        items: data.items,
        issuedBy: data.issuedBy,
        sampleDrawnBy: data.sampleDrawnBy,
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockSampling = [created, ...mockSampling];
      return Promise.resolve(created);
    }
    return api.post<SamplingRecord>('/sampling', data).then((r) => r.data);
  },
};
