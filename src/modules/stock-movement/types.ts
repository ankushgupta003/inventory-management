export type StockMovementType = 'issue' | 'transfer' | 'sampling';

export interface StockMovementItem {
  itemId?: string;
  itemName: string;
  batchNo: string;
  quantity: number;
  availableQty?: number;
  mfgDate?: string;
  expiryDate?: string;
  unit?: string;
  remarks?: string;
  requestedQty?: number;
  issuedQty?: number;
  remainingQty?: number;
}

export interface StockMovementRecord {
  id: string;
  movementNo: string;
  date: string;
  type: StockMovementType;
  mrsId?: string;
  mrsNo?: string;
  productionBatchId?: string;
  productionBatchNo?: string;
  productionNo?: string;
  itemName: string;
  batchNo: string;
  quantity: number;
  items?: StockMovementItem[];
  availableQty?: number;
  fromLocation?: string;
  toLocation?: string;
  currentLocation?: string;
  locationHistory?: { date: string; from: string; to: string }[];
  mfgDate?: string;
  expiryDate?: string;
  issuedBy?: string;
  sampleDrawnBy?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}
