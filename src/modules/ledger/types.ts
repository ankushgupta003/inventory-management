export type TransactionType =
  | 'purchase'
  | 'issue'
  | 'production'
  | 'invoice'
  | 'return'
  | 'transfer'
  | 'sampling';

export type ItemCategory = 'RAW' | 'FINISHED';
export type LedgerCategory = ItemCategory | 'MIXED';
export type LedgerSourceModule = 'purchases' | 'stock-movement' | 'production' | 'invoices' | 'ledger';

export interface LedgerEntry {
  id: string;
  itemId: string;
  date: string;
  createdAt: string;
  referenceNo: string;
  type: TransactionType;
  particulars: string;
  itemName: string;
  itemCategory: ItemCategory;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  receiptQty: number;
  issueQty: number;
  rate: number;
  remarks: string;
  transactionValue: number;
  purchaseGinId: string;
  productionBatchId: string;
  stockMovementId: string;
  invoiceId: string;
  sourceModule: LedgerSourceModule;
  sourceId: string;
  sourcePath: string;
  sourceLabel: string;
}

export interface LedgerFilters {
  search: string;
  itemId: string;
  batchNo: string;
  dateFrom: string;
  dateTo: string;
  type: 'all' | TransactionType;
  itemCategory?: 'all' | ItemCategory;
  paginate?: boolean;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  referenceNo: string;
  type: TransactionType;
  particulars: string;
  itemCategory: LedgerCategory;
  itemCategories: ItemCategory[];
  itemNames: string[];
  batchNos: string[];
  receiptQty: number;
  issueQty: number;
  netQty: number;
  transactionValue: number;
  lineCount: number;
  itemCount: number;
  remarks: string[];
  sourceModule: LedgerSourceModule;
  sourceId: string;
  sourcePath: string;
  sourceLabel: string;
}
