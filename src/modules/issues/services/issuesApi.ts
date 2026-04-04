import api from '@/services/api';
import type { IssueRecord } from '../types';
import type { IssueFormValues } from '../schemas/issueSchema';

export const issuesApi = {
  getAll: () => api.get<IssueRecord[]>('/issues').then((r) => r.data),
  getById: (id: string) => api.get<IssueRecord>(`/issues/${id}`).then((r) => r.data),
  create: (data: IssueFormValues) => api.post<IssueRecord>('/issues', data).then((r) => r.data),
};
