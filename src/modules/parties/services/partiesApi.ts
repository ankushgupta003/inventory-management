import api from '@/services/api';
import type { PartyListParams, PartyListResponse, PartyRecord } from '../types';
import type { PartyFormValues } from '../schemas/partySchema';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<TData, TMeta> {
  data: TData;
  meta: TMeta;
}

const listParties = async (params: PartyListParams = {}) => {
  const response = await api.get<ApiListEnvelope<PartyRecord[], PartyListResponse['meta']>>('/parties', { params });
  return response.data;
};

export const partiesApi = {
  list: listParties,
  getAll: async (params: PartyListParams = {}) => {
    const response = await listParties({ paginate: false, ...params });
    return response.data;
  },
  getById: (id: string) => api.get<ApiEnvelope<PartyRecord>>(`/parties/${id}`).then((r) => r.data.data),
  create: (data: PartyFormValues) => api.post<ApiEnvelope<PartyRecord>>('/parties', data).then((r) => r.data.data),
  update: (id: string, data: PartyFormValues) => api.put<ApiEnvelope<PartyRecord>>(`/parties/${id}`, data).then((r) => r.data.data),
  toggleStatus: (id: string, isActive?: boolean) =>
    api.patch<ApiEnvelope<PartyRecord>>(`/parties/${id}/status`, isActive === undefined ? {} : { isActive }).then((r) => r.data.data),
};
