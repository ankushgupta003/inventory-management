import api, { USE_MOCK } from '@/services/api';
import { mockMRSRecords } from '../data/mockMRS';
import type { MRSRecord } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

export type MRSCreatePayload = {
  productionBatchId: string;
  date: string;
  department: string;
  requisitionBy: string;
  items: Array<{
    itemId: string;
    qtyRequested: number;
    remarks?: string;
  }>;
};

const toLegacyCompatibleRecord = (record: MRSRecord): MRSRecord => ({
  ...record,
  sanctionedBy: record.approvedBy || '',
  issuedBy: record.issuedBy || '',
  receivedBy: record.receivedBy || '',
  items: record.items.map((item) => ({
    ...item,
    batchNo: item.batchNo || '',
  })),
});

const mrsApi = {
  getAll: async () => {
    if (USE_MOCK) return mockMRSRecords;
    const response = await api.get<ApiEnvelope<MRSRecord[]>>('/mrs');
    return response.data.data.map(toLegacyCompatibleRecord);
  },
  getById: async (id: string) => {
    if (USE_MOCK) {
      const record = mockMRSRecords.find((item) => item.id === id);
      return record ? toLegacyCompatibleRecord(record) : null;
    }
    const response = await api.get<ApiEnvelope<MRSRecord>>(`/mrs/${id}`);
    return toLegacyCompatibleRecord(response.data.data);
  },
  create: async (data: MRSCreatePayload) => {
    if (USE_MOCK) {
      return toLegacyCompatibleRecord({
        id: `mrs-${Date.now()}`,
        mrsNo: `MRS-${String(Date.now()).slice(-5)}`,
        date: data.date,
        department: data.department,
        productionBatchId: data.productionBatchId,
        productionBatchNo: '',
        productionNo: '',
        requisitionBy: data.requisitionBy,
        approvedBy: '',
        approvedAt: '',
        sanctionedBy: '',
        issuedBy: '',
        receivedBy: '',
        status: 'pending',
        items: data.items.map((item) => ({
          itemId: item.itemId,
          itemName: '',
          unit: '',
          qtyRequested: item.qtyRequested,
          qtyIssued: 0,
          remainingQty: item.qtyRequested,
          batchNo: '',
          remarks: item.remarks || '',
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    const response = await api.post<ApiEnvelope<MRSRecord>>('/mrs', data);
    return toLegacyCompatibleRecord(response.data.data);
  },
  approve: async (id: string, approvedBy?: string) => {
    if (USE_MOCK) {
      const record = mockMRSRecords.find((item) => item.id === id);
      if (!record) return null;
      return toLegacyCompatibleRecord({
        ...record,
        status: 'approved',
        approvedBy: approvedBy || 'Approver',
        approvedAt: new Date().toISOString(),
        sanctionedBy: approvedBy || 'Approver',
      });
    }
    const response = await api.post<ApiEnvelope<MRSRecord>>(`/mrs/${id}/approve`, approvedBy ? { approvedBy } : {});
    return toLegacyCompatibleRecord(response.data.data);
  },
};

export default mrsApi;
