export interface SamplingItemRow {
  itemId: string;
  itemName: string;
  batchNo: string;
  manufacturedBy: string;
  mfgDate: string;
  expiryDate: string;
  availableQty: number;
  sampleQty: number;
}

export interface SamplingRecord {
  id: string;
  samplingNo: string;
  date: string;
  fromStore: string;
  toDepartment: string;
  items: SamplingItemRow[];
  issuedBy: string;
  sampleDrawnBy: string;
  createdAt?: string;
}
