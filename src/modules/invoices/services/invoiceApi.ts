import api from '@/services/api';
import type { InvoiceCreatePayload, InvoiceListParams, InvoiceRecord } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<TData> {
  data: TData;
  meta?: Record<string, unknown>;
}

export const invoiceApi = {
  getAll: (params: InvoiceListParams = {}) =>
    api
      .get<ApiListEnvelope<InvoiceRecord[]>>('/invoices', { params })
      .then((response) => response.data.data),
  getById: (id: string) =>
    api
      .get<ApiEnvelope<InvoiceRecord>>(`/invoices/${id}`)
      .then((response) => response.data.data),
  create: (data: InvoiceCreatePayload) =>
    api
      .post<ApiEnvelope<InvoiceRecord>>('/invoices', data)
      .then((response) => response.data.data),
};
