export type MRSStatus = 'pending' | 'approved' | 'issued';

export interface MRSItemRow {
  itemId: string;
  itemName: string;
  unit: string;
  qtyRequested: number;
  qtyIssued: number;
  remainingQty: number;
  batchNo: string;
  remarks: string;
}

export interface MRSRecord {
  id: string;
  mrsNo: string;
  date: string;
  department: string;
  productionBatchId: string;
  productionBatchNo: string;
  productionNo?: string;
  requisitionBy: string;
  approvedBy: string;
  approvedAt?: string;
  sanctionedBy: string;
  issuedBy: string;
  receivedBy: string;
  status: MRSStatus;
  items: MRSItemRow[];
  createdAt: string;
  updatedAt?: string;
}

export type MRSFilters = {
  search: string;
  status: 'all' | MRSStatus;
};
