export type InvoiceStatus = 'completed' | 'partial';

export interface InvoiceItemRow {
  itemId: string;
  itemName: string;
  batchNo: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress?: string;
  piId: string;
  piNo?: string;
  items: InvoiceItemRow[];
  totalQuantity: number;
  totalAmount: number;
  taxAmount: number;
  status: InvoiceStatus;
  createdAt?: string;
}
