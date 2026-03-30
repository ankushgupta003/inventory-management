import api from '@/services/api';
import type { PurchaseFormValues } from '../schemas/purchaseSchema';

export const purchasesApi = {
  create: (data: PurchaseFormValues) => api.post('/purchases', data).then((r) => r.data),
};
