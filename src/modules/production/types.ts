export type ProductionBatchStatus = 'DRAFT' | 'IN_PROCESS' | 'QA_PENDING' | 'RELEASED' | 'BLOCKED';
export type ProductionBmrStatus = 'DRAFT' | 'SUBMITTED';

export interface ProductionBatch {
  id: string;
  itemId: string;
  productionNo: string;
  batchNo: string;
  productName: string;
  batchSize: string;
  status: ProductionBatchStatus;
  startDate: string;
  mfgDate: string;
  expDate: string;
  expectedQty: number;
  actualQty: number;
  rejectedQty: number;
  bmrStatus: ProductionBmrStatus | null;
  qaApprovedBy: string;
  qaRemarks: string;
  qaDecidedAt: string;
  createdAt: string;
  updatedAt: string;
  mrsCount?: number;
  movementCount?: number;
}

export interface ProductionBmrRecord<TData = unknown> {
  id: string;
  status: ProductionBmrStatus;
  data: TData;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface QaRecord {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string;
  approvedBy: string;
  decidedAt?: string;
}
