import api from '@/services/api';
import type { ProductionRecord } from '../types';
import type { ProductionFormValues } from '../schemas/productionSchema';

export const productionApi = {
  getAll: () => api.get<ProductionRecord[]>('/production').then((r) => r.data),
  create: (data: ProductionFormValues) => api.post<ProductionRecord>('/production', data).then((r) => r.data),
};
