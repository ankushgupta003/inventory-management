export type TransactionType =
  | 'purchase'
  | 'issue'
  | 'production'
  | 'invoice'
  | 'return'
  | 'transfer'
  | 'sampling';

export interface LedgerEntry {
  id: string;
  date: string;
  referenceNo: string;
  type: TransactionType;
  particulars: string;
  itemName: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  receiptQty: number;
  issueQty: number;
  rate: number;
  remarks: string;
}

export interface LedgerFilters {
  itemId: string;
  batchNo: string;
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
}
