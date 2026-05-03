export type PurchaseSortBy = 'entryDate' | 'createdAt' | 'ginNo' | 'vendorName' | 'totalAmount';
export type SortOrder = 'asc' | 'desc';

export interface PurchaseGinItem {
  id: string;
  lineNo: number;
  itemId: string;
  itemName: string;
  itemType: 'raw' | 'finished';
  baseUnit: string;
  ulpQty: number;
  billQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  rate: number;
  amount: number;
  remarks: string;
}

export interface PurchaseGinListRow {
  id: string;
  ginNo: string;
  vendorId: string;
  vendorName: string;
  challanNo: string;
  billNo: string;
  gateEntryNo: string;
  entryDate: string;
  totalAmount: number;
  totalAcceptedQty: number;
  totalRejectedQty: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseGinRecord {
  id: string;
  ginNo: string;
  vendorId: string;
  vendorName: string;
  challanNo: string;
  challanDate: string;
  billNo: string;
  billDate: string;
  gateEntryNo: string;
  entryDate: string;
  preparedBy: string;
  sanctionedBy: string;
  authorizedSignatory: string;
  totalAmount: number;
  totalAcceptedQty: number;
  totalRejectedQty: number;
  items: PurchaseGinItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseListParams {
  search?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: PurchaseSortBy;
  sortOrder?: SortOrder;
  paginate?: boolean;
}

export interface PurchaseListSummary {
  count: number;
  totalAmount: number;
  totalAcceptedQty: number;
  totalRejectedQty: number;
  vendorCount: number;
}

export interface PurchaseListMeta {
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
    vendorId: string;
    dateFrom: string;
    dateTo: string;
  };
  sort: {
    sortBy: PurchaseSortBy;
    sortOrder: SortOrder;
  };
  summary: PurchaseListSummary;
}

export interface PurchaseListResponse {
  data: PurchaseGinListRow[];
  meta: PurchaseListMeta;
}
