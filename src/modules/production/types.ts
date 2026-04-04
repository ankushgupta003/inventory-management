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
