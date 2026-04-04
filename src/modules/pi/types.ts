export type PIStatus = 'pending' | 'partial' | 'completed' | 'closed';

export interface PIItemRow {
  itemId: string;
  itemName: string;
  quantity: number;
  invoicedQty?: number;
  rate: number;
  amount: number;
  remarks?: string;
}

export interface ProformaInvoiceRecord {
  id: string;
  piNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  items: PIItemRow[];
  totalQuantity: number;
  totalAmount: number;
  status: PIStatus;
  createdAt?: string;
}
