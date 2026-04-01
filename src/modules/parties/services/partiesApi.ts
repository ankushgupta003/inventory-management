import api from '@/services/api';
import type { PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';

export const partiesApi = {
  getAll: () => api.get<PartyRecord[]>('/parties').then((r) => r.data),
  create: (data: PartyFormValues) => api.post<PartyRecord>('/parties', data).then((r) => r.data),
  update: (id: string, data: PartyFormValues) => api.put<PartyRecord>(`/parties/${id}`, data).then((r) => r.data),
  toggleStatus: (id: string) => api.patch<PartyRecord>(`/parties/${id}/status`).then((r) => r.data),
};
