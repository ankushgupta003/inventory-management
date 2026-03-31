import api from '@/services/api';
import type { ItemRecord } from '../types';
import type { ItemFormValues } from '../schemas/itemSchema';

export const itemsApi = {
  getAll: () => api.get<ItemRecord[]>('/items').then((r) => r.data),
  create: (data: ItemFormValues) => api.post<ItemRecord>('/items', data).then((r) => r.data),
  update: (id: string, data: ItemFormValues) => api.put<ItemRecord>(`/items/${id}`, data).then((r) => r.data),
  toggleStatus: (id: string) => api.patch<ItemRecord>(`/items/${id}/status`).then((r) => r.data),
  delete: (id: string) => api.delete(`/items/${id}`),
};
