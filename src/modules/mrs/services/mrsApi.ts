import api from '@/services/api';
import type { MRSRecord, MRSStatus } from '../types';

const mrsApi = {
  getAll: () => api.get<MRSRecord[]>('/mrs').then((r) => r.data),
  getById: (id: string) => api.get<MRSRecord>(`/mrs/${id}`).then((r) => r.data),
  create: (data: Partial<MRSRecord>) => api.post<MRSRecord>('/mrs', data).then((r) => r.data),
  updateStatus: (id: string, status: MRSStatus) => api.patch(`/mrs/${id}/status`, { status }),
};

export default mrsApi;
