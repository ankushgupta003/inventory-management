export type QualityIssueType = 'defect' | 'testing' | 'complaint';
export type QualityRequestStatus = 'pending' | 'approved' | 'under_testing' | 'completed' | 'closed';
export type QualityTestResult = 'pass' | 'fail';
export type QualityClosureDecision = 'accept' | 'reject';
export type QualityRequestSourceType = 'sampling';

export interface QualityRequestCreatePayload {
  requestNo?: string;
  date: string;
  itemName: string;
  batchNo: string;
  quantity?: number;
  issueType: QualityIssueType;
  description: string;
  remarks: string;
  requestedBy: string;
}

export interface QualityRequestApprovePayload {
  approvedBy?: string;
  approvalRemarks?: string;
}

export interface QualityRequestReportPayload {
  testParameters: string;
  observations: string;
  result: QualityTestResult;
  attachments?: string[];
}

export interface QualityRequestClosePayload {
  decision: QualityClosureDecision;
  remarks?: string;
}

export interface QualityRequestRecord {
  id: string;
  sourceType?: QualityRequestSourceType;
  stockMovementId?: string;
  stockMovementItemId?: string;
  stockMovementNo?: string;
  itemId?: string;
  itemType?: 'raw' | 'finished';
  productionBatchId?: string;
  productionBatchNo?: string;
  productionNo?: string;
  requestNo: string;
  date: string;
  itemName: string;
  batchNo: string;
  quantity?: number;
  issueType: QualityIssueType;
  description: string;
  remarks: string;
  requestedBy: string;
  status: QualityRequestStatus;
  approvedBy?: string;
  approvalRemarks?: string;
  testParameters?: string;
  observations?: string;
  testResult?: QualityTestResult;
  attachments?: string[];
  closureDecision?: QualityClosureDecision;
  closureRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
