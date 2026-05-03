export type ItemType = 'raw' | 'finished';
export type ItemStatusFilter = 'all' | 'active' | 'inactive';
export type ItemListSortBy = 'storeName' | 'tallyName' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface ItemRecord {
  id: string;
  storeName: string;
  tallyName: string;
  sku: string;
  itemType: ItemType;
  category: string;
  baseUnit: string;
  hsnCode: string;
  gstRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ItemFilters = {
  search: string;
  status: ItemStatusFilter;
  itemType: 'all' | ItemType;
};

export interface ItemListParams {
  search?: string;
  status?: ItemStatusFilter;
  itemType?: 'all' | ItemType;
  category?: string;
  baseUnit?: string;
  page?: number;
  limit?: number;
  sortBy?: ItemListSortBy;
  sortOrder?: SortOrder;
  paginate?: boolean;
}

export interface ItemListSummary {
  total: number;
  active: number;
  inactive: number;
  raw: number;
  finished: number;
}

export interface ItemListMeta {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    paginate: boolean;
  };
  filters: {
    search: string;
    status: ItemStatusFilter;
    itemType: 'all' | ItemType;
    category: string;
    baseUnit: string;
  };
  sort: {
    sortBy: ItemListSortBy;
    sortOrder: SortOrder;
  };
  summary: ItemListSummary;
}

export interface ItemListResponse {
  data: ItemRecord[];
  meta: ItemListMeta;
}
