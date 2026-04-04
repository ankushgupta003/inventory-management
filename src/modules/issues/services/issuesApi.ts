import api, { USE_MOCK } from '@/services/api';
import type { IssueRecord } from '../types';
import type { IssueFormValues } from '../schemas/issueSchema';

let mockIssues: IssueRecord[] = [
  {
    id: 'iss-1',
    issueNo: 'ISS-240403-112',
    date: '2026-04-03',
    type: 'production',
    mrsNo: 'MRS-240401-101',
    totalItems: 2,
    items: [
      { itemId: 'rm-1', itemName: 'Steel Rod 10mm', batchNo: 'B-2026-001', availableQty: 320, issueQty: 80, mfgDate: '2026-01-15', expiryDate: '2028-01-15', remarks: '' },
      { itemId: 'rm-2', itemName: 'Copper Wire 2mm', batchNo: 'B-2026-002', availableQty: 180, issueQty: 5, mfgDate: '2026-02-10', expiryDate: '2027-04-25', remarks: 'Damage' },
    ],
    issuedBy: 'Store Admin',
    approvedBy: 'Factory Manager',
    receivedBy: 'Production Lead',
    createdAt: '2026-04-03',
  },
];

export const issuesApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockIssues);
    return api.get<IssueRecord[]>('/issues').then((r) => r.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockIssues.find((i) => i.id === id) || mockIssues[0];
      return Promise.resolve(match);
    }
    return api.get<IssueRecord>(`/issues/${id}`).then((r) => r.data);
  },
  create: (data: IssueFormValues) => {
    if (USE_MOCK) {
      const created: IssueRecord = {
        id: `iss-${Date.now()}`,
        issueNo: data.issueNo,
        date: data.date,
        type: data.issueType,
        mrsId: data.mrsId || undefined,
        totalItems: data.items.length,
        items: data.items.map((row) => ({
          itemId: row.itemId,
          itemName: row.itemName,
          batchNo: row.batchNo,
          availableQty: row.availableQty ?? 0,
          issueQty: row.issueQty,
          mfgDate: row.mfgDate,
          expiryDate: row.expiryDate,
          remarks: row.remarks || '',
          requestedQty: row.requestedQty,
        })),
        issuedBy: data.issuedBy,
        approvedBy: data.approvedBy,
        receivedBy: data.receivedBy,
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockIssues = [created, ...mockIssues];
      return Promise.resolve(created);
    }
    return api.post<IssueRecord>('/issues', data).then((r) => r.data);
  },
};
