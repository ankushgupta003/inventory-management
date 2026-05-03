import api, { USE_MOCK } from '@/services/api';
import type {
  QualityRequestApprovePayload,
  QualityRequestClosePayload,
  QualityRequestCreatePayload,
  QualityRequestRecord,
  QualityRequestReportPayload,
  QualityRequestSourceType,
} from '../types';

interface ApiEnvelope<T> {
  data: T;
}

let mockRequests: QualityRequestRecord[] = [
  {
    id: 'qr-1',
    requestNo: 'QREQ-240404-001',
    sourceType: 'sampling',
    stockMovementId: 'sm-1',
    stockMovementItemId: 'smi-1',
    stockMovementNo: 'MOV-00001',
    itemId: 'fg-1',
    itemType: 'finished',
    productionBatchId: 'batch-1',
    productionBatchNo: 'FG-001',
    productionNo: 'PRD-00001',
    date: '2026-04-04',
    itemName: 'Finished Product A',
    batchNo: 'FG-001',
    quantity: 10,
    issueType: 'testing',
    description: 'Auto-created from sampling movement MOV-00001.',
    remarks: 'Hold sample for QC review.',
    requestedBy: 'Store Admin',
    status: 'pending',
    createdAt: '2026-04-04',
  },
  {
    id: 'qr-2',
    requestNo: 'QREQ-240403-002',
    sourceType: 'sampling',
    stockMovementId: 'sm-2',
    stockMovementItemId: 'smi-2',
    stockMovementNo: 'MOV-00002',
    itemId: 'rm-1',
    itemType: 'raw',
    date: '2026-04-03',
    itemName: 'Cotton',
    batchNo: 'RM-001',
    quantity: 5,
    issueType: 'testing',
    description: 'Routine raw-material sampling request.',
    remarks: '',
    requestedBy: 'QC Lead',
    status: 'under_testing',
    approvedBy: 'QA Manager',
    approvalRemarks: 'Proceed with standard checks.',
    testParameters: 'Conductivity, insulation',
    observations: 'Conductivity normal, insulation pending',
    createdAt: '2026-04-03',
  },
];

export type QualityRequestListParams = {
  sourceType?: 'all' | QualityRequestSourceType;
  stockMovementId?: string;
};

export const qualityRequestsApi = {
  getAll: (params?: QualityRequestListParams) => {
    if (USE_MOCK) {
      return Promise.resolve(
        mockRequests.filter((request) => {
          if (params?.sourceType && params.sourceType !== 'all' && request.sourceType !== params.sourceType) {
            return false;
          }
          if (params?.stockMovementId && request.stockMovementId !== params.stockMovementId) {
            return false;
          }
          return true;
        }),
      );
    }
    return api
      .get<ApiEnvelope<QualityRequestRecord[]>>('/quality-requests', { params })
      .then((response) => response.data.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockRequests.find((r) => r.id === id) || mockRequests[0];
      return Promise.resolve(match);
    }
    return api.get<ApiEnvelope<QualityRequestRecord>>(`/quality-requests/${id}`).then((response) => response.data.data);
  },
  create: (data: QualityRequestCreatePayload) => {
    if (USE_MOCK) {
      const created: QualityRequestRecord = {
        ...data,
        id: `qr-${Date.now()}`,
        requestNo: data.requestNo || `QREQ-${String(Date.now()).slice(-5)}`,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockRequests = [created, ...mockRequests];
      return Promise.resolve(created);
    }
    return api.post<ApiEnvelope<QualityRequestRecord>>('/quality-requests', data).then((response) => response.data.data);
  },
  approve: (id: string, payload: QualityRequestApprovePayload) => {
    if (USE_MOCK) {
      mockRequests = mockRequests.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', approvedBy: payload.approvedBy, approvalRemarks: payload.approvalRemarks || '' }
          : r
      );
      return Promise.resolve(mockRequests.find((r) => r.id === id) as QualityRequestRecord);
    }
    return api.patch<ApiEnvelope<QualityRequestRecord>>(`/quality-requests/${id}/approve`, payload).then((response) => response.data.data);
  },
  addReport: (id: string, payload: QualityRequestReportPayload) => {
    if (USE_MOCK) {
      mockRequests = mockRequests.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'completed',
              testParameters: payload.testParameters,
              observations: payload.observations,
              testResult: payload.result,
              attachments: payload.attachments || [],
            }
          : r
      );
      return Promise.resolve(mockRequests.find((r) => r.id === id) as QualityRequestRecord);
    }
    return api.post<ApiEnvelope<QualityRequestRecord>>(`/quality-requests/${id}/report`, payload).then((response) => response.data.data);
  },
  close: (id: string, payload: QualityRequestClosePayload) => {
    if (USE_MOCK) {
      mockRequests = mockRequests.map((r) =>
        r.id === id
          ? { ...r, status: 'closed', closureDecision: payload.decision, closureRemarks: payload.remarks || '' }
          : r
      );
      return Promise.resolve(mockRequests.find((r) => r.id === id) as QualityRequestRecord);
    }
    return api.patch<ApiEnvelope<QualityRequestRecord>>(`/quality-requests/${id}/close`, payload).then((response) => response.data.data);
  },
};
