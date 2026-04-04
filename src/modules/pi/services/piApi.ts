import api from '@/services/api';
import type { ProformaInvoiceRecord, PIStatus } from '../types';
import type { PIFormValues } from '../schemas/piSchema';

export const piApi = {
  getAll: () => api.get<ProformaInvoiceRecord[]>('/pi').then((r) => r.data),
  getById: (id: string) => api.get<ProformaInvoiceRecord>(`/pi/${id}`).then((r) => r.data),
  create: (data: PIFormValues) => api.post<ProformaInvoiceRecord>('/pi', data).then((r) => r.data),
  updateStatus: (id: string, status: PIStatus) => api.patch(`/pi/${id}/status`, { status }).then((r) => r.data),
};
