import api from '@/services/api';
import type { SamplingRecord } from '../types';
import type { SamplingFormValues } from '../schemas/samplingSchema';

export const samplingApi = {
  getAll: () => api.get<SamplingRecord[]>('/sampling').then((r) => r.data),
  getById: (id: string) => api.get<SamplingRecord>(`/sampling/${id}`).then((r) => r.data),
  create: (data: SamplingFormValues) => api.post<SamplingRecord>('/sampling', data).then((r) => r.data),
};
