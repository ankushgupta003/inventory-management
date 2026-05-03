import api from '@/services/api';
import type { PIListParams, ProformaInvoiceRecord, PIUpsertPayload } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<TData> {
  data: TData;
  meta?: Record<string, unknown>;
}

export const piApi = {
  getAll: (params: PIListParams = {}) =>
    api
      .get<ApiListEnvelope<ProformaInvoiceRecord[]>>('/proforma-invoices', { params })
      .then((response) => response.data.data),
  getById: (id: string) =>
    api
      .get<ApiEnvelope<ProformaInvoiceRecord>>(`/proforma-invoices/${id}`)
      .then((response) => response.data.data),
  create: (data: PIUpsertPayload) =>
    api
      .post<ApiEnvelope<ProformaInvoiceRecord>>('/proforma-invoices', data)
      .then((response) => response.data.data),
  update: (id: string, data: PIUpsertPayload) =>
    api
      .put<ApiEnvelope<ProformaInvoiceRecord>>(`/proforma-invoices/${id}`, data)
      .then((response) => response.data.data),
  close: (id: string) =>
    api
      .post<ApiEnvelope<ProformaInvoiceRecord>>(`/proforma-invoices/${id}/close`, {})
      .then((response) => response.data.data),
};
