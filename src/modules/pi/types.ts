export type PIStatus = 'pending' | 'partial' | 'completed' | 'closed';

export interface PIItemRow {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  invoicedQty: number;
  remainingQty: number;
  rate: number;
  amount: number;
  remarks: string;
}

export interface ProformaInvoiceRecord {
  id: string;
  piNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerContactPerson?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstNumber?: string;
  customerPanNumber?: string;
  customerAddress?: string;
  items: PIItemRow[];
  totalQuantity: number;
  totalAmount: number;
  status: PIStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface PIListParams {
  search?: string;
  status?: 'all' | PIStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PIFormItemInput {
  id?: string;
  itemId: string;
  itemName?: string;
  unit?: string;
  quantity: number;
  rate: number;
  remarks?: string;
}

export interface PIUpsertPayload {
  date: string;
  customerId: string;
  items: PIFormItemInput[];
}
