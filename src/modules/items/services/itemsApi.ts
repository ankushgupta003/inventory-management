import api from '@/services/api';
import type { ItemCategoryOption, ItemListParams, ItemListResponse, ItemRecord, ItemType } from '../types';
import type { ItemFormValues } from '../schemas/itemSchema';

interface ApiEnvelope<T> {
  data: T;
}

interface ApiListEnvelope<TData, TMeta> {
  data: TData;
  meta: TMeta;
}

const listItems = async (params: ItemListParams = {}) => {
  const response = await api.get<ApiListEnvelope<ItemRecord[], ItemListResponse['meta']>>('/items', { params });
  return response.data;
};

export const itemsApi = {
  list: listItems,
  getAll: async (params: ItemListParams = {}) => {
    const response = await listItems({ paginate: false, ...params });
    return response.data;
  },
  getCategoryOptions: (itemType: 'all' | ItemType = 'all') =>
    api
      .get<ApiEnvelope<ItemCategoryOption[]>>('/items/category-options', { params: { itemType } })
      .then((r) => r.data.data),
  getById: (id: string) => api.get<ApiEnvelope<ItemRecord>>(`/items/${id}`).then((r) => r.data.data),
  create: (data: ItemFormValues) => api.post<ApiEnvelope<ItemRecord>>('/items', data).then((r) => r.data.data),
  update: (id: string, data: ItemFormValues) => api.put<ApiEnvelope<ItemRecord>>(`/items/${id}`, data).then((r) => r.data.data),
  toggleStatus: (id: string, isActive?: boolean) =>
    api.patch<ApiEnvelope<ItemRecord>>(`/items/${id}/status`, isActive === undefined ? {} : { isActive }).then((r) => r.data.data),
};
