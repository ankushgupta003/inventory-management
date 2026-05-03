export type PartyType = 'vendor' | 'customer' | 'both';
export type PartyStatusFilter = 'all' | 'active' | 'inactive';
export type PartyListSortBy = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface PartyRecord {
  id: string;
  name: string;
  partyType: PartyType;
  contactPerson: string;
  phone: string;
  altPhone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  openingBalance: number;
  creditLimit: number;
  remarks: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PartyFilters = {
  search: string;
  status: PartyStatusFilter;
  partyType: 'all' | PartyType;
};

export interface PartyListParams {
  search?: string;
  status?: PartyStatusFilter;
  partyType?: 'all' | PartyType;
  page?: number;
  limit?: number;
  sortBy?: PartyListSortBy;
  sortOrder?: SortOrder;
  paginate?: boolean;
}

export interface PartyListSummary {
  total: number;
  active: number;
  inactive: number;
  vendors: number;
  customers: number;
  both: number;
}

export interface PartyListMeta {
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
    status: PartyStatusFilter;
    partyType: 'all' | PartyType;
  };
  sort: {
    sortBy: PartyListSortBy;
    sortOrder: SortOrder;
  };
  summary: PartyListSummary;
}

export interface PartyListResponse {
  data: PartyRecord[];
  meta: PartyListMeta;
}
