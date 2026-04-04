import api from '@/services/api';
import type { InvoiceRecord } from '../types';
import type { InvoiceFormValues } from '../schemas/invoiceSchema';

export const invoiceApi = {
  getAll: () => api.get<InvoiceRecord[]>('/invoice').then((r) => r.data),
  getById: (id: string) => api.get<InvoiceRecord>(`/invoice/${id}`).then((r) => r.data),
  create: (data: InvoiceFormValues) => api.post<InvoiceRecord>('/invoice', data).then((r) => r.data),
};
