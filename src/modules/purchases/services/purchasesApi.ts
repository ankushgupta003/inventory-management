import api from '@/services/api';
import type { GINFormValues } from '../schemas/purchaseSchema';
import type { PurchaseGinRecord, PurchaseListParams, PurchaseListResponse } from '../types';

interface ApiEnvelope<T> {
  data: T;
}

export const purchasesApi = {
  list: (params: PurchaseListParams = {}) =>
    api.get<PurchaseListResponse>('/purchases', { params }).then((r) => r.data),
  getById: (id: string) => api.get<ApiEnvelope<PurchaseGinRecord>>(`/purchases/${id}`).then((r) => r.data.data),
  create: (data: GINFormValues) => api.post<ApiEnvelope<PurchaseGinRecord>>('/purchases', data).then((r) => r.data.data),
};
