export interface PurchaseItemRow {
  itemId: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rate: number;
}

export interface PurchaseEntry {
  id: string;
  vendorId: string;
  date: string;
  challanNo: string;
  items: PurchaseItemRow[];
  totalAmount: number;
  createdAt: string;
}
