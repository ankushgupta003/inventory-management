import api from '@/services/api';
import type { GINFormValues } from '../schemas/purchaseSchema';

export const purchasesApi = {
  create: (data: GINFormValues) => api.post('/purchases', data).then((r) => r.data),
};
