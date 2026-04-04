export type IssueType = 'production' | 'sample' | 'damage' | 'other';

export interface IssueItemRow {
  itemId: string;
  itemName: string;
  batchNo: string;
  availableQty: number;
  issueQty: number;
  mfgDate: string;
  expiryDate: string;
  remarks: string;
  requestedQty?: number;
}

export interface IssueRecord {
  id: string;
  issueNo: string;
  date: string;
  type: IssueType;
  mrsId?: string;
  mrsNo?: string;
  totalItems: number;
  items: IssueItemRow[];
  issuedBy?: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt?: string;
}

export type IssueFilters = {
  search: string;
  type: 'all' | IssueType;
};
