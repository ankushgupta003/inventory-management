import api, { USE_MOCK } from '@/services/api';
import type {
  QualityRequestRecord,
  QualityTestResult,
  QualityClosureDecision,
} from '../types';

let mockRequests: QualityRequestRecord[] = [
  {
    id: 'qr-1',
    requestNo: 'QREQ-240404-001',
    date: '2026-04-04',
    itemName: 'Steel Rod 10mm',
    batchNo: 'B-2026-001',
    quantity: 10,
    issueType: 'defect',
    description: 'Surface cracks observed during inspection.',
    remarks: 'Hold batch until QA review.',
    requestedBy: 'Store Admin',
    status: 'pending',
    createdAt: '2026-04-04',
  },
  {
    id: 'qr-2',
    requestNo: 'QREQ-240403-002',
    date: '2026-04-03',
    itemName: 'Copper Wire 2mm',
    batchNo: 'B-2026-002',
    quantity: 5,
    issueType: 'testing',
    description: 'Routine QC testing request.',
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

export const qualityRequestsApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockRequests);
    return api.get<QualityRequestRecord[]>('/quality-requests').then((r) => r.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockRequests.find((r) => r.id === id) || mockRequests[0];
      return Promise.resolve(match);
    }
    return api.get<QualityRequestRecord>(`/quality-requests/${id}`).then((r) => r.data);
  },
  create: (data: QualityRequestRecord) => {
    if (USE_MOCK) {
      const created: QualityRequestRecord = {
        ...data,
        id: `qr-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockRequests = [created, ...mockRequests];
      return Promise.resolve(created);
    }
    return api.post<QualityRequestRecord>('/quality-requests', data).then((r) => r.data);
  },
  approve: (id: string, payload: { approvedBy: string; approvalRemarks?: string }) => {
    if (USE_MOCK) {
      mockRequests = mockRequests.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', approvedBy: payload.approvedBy, approvalRemarks: payload.approvalRemarks || '' }
          : r
      );
      return Promise.resolve(mockRequests.find((r) => r.id === id) as QualityRequestRecord);
    }
    return api.patch<QualityRequestRecord>(`/quality-requests/${id}/approve`, payload).then((r) => r.data);
  },
  addReport: (id: string, payload: { testParameters: string; observations: string; result: QualityTestResult; attachments?: string[] }) => {
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
    return api.post<QualityRequestRecord>(`/quality-requests/${id}/report`, payload).then((r) => r.data);
  },
  close: (id: string, payload: { decision: QualityClosureDecision; remarks?: string }) => {
    if (USE_MOCK) {
      mockRequests = mockRequests.map((r) =>
        r.id === id
          ? { ...r, status: 'closed', closureDecision: payload.decision, closureRemarks: payload.remarks || '' }
          : r
      );
      return Promise.resolve(mockRequests.find((r) => r.id === id) as QualityRequestRecord);
    }
    return api.patch<QualityRequestRecord>(`/quality-requests/${id}/close`, payload).then((r) => r.data);
  },
};
