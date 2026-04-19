export interface ProductionOutputRow {
  itemId: string;
  itemName: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  qtyProduced: number;
}

export interface ProductionInputRow {
  itemId: string;
  itemName: string;
  batchNo: string;
  availableQty: number;
  qtyUsed: number;
}

export interface ProductionRecord {
  id: string;
  productionNo: string;
  date: string;
  outputs: ProductionOutputRow[];
  inputs?: ProductionInputRow[];
  createdAt?: string;
}

export type ProductionBatchStatus = 'DRAFT' | 'IN_PROCESS' | 'QA_PENDING' | 'RELEASED' | 'BLOCKED';

export interface ProductionBatch {
  id: string;
  batchNo: string;
  productName: string;
  batchSize: string;
  status: ProductionBatchStatus;
  startDate: string;
  mfgDate: string;
  expDate: string;
}

export type MrsStatus = 'OPEN' | 'PARTIAL' | 'CLOSED';

export interface MrsRecord {
  id: string;
  date: string;
  itemName: string;
  qtyRequested: number;
  qtyIssued: number;
  status: MrsStatus;
}

export type StockMovementType = 'ISSUE' | 'TRANSFER' | 'SAMPLING';

export interface StockMovementRecord {
  id: string;
  date: string;
  reference: string;
  type: StockMovementType;
  itemName: string;
  qty: number;
  mrsId?: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface QaRecord {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string;
  approvedBy: string;
  decidedAt?: string;
}
