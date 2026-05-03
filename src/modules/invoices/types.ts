export type InvoiceStatus = 'completed' | 'partial';

export interface InvoiceItemRow {
  id: string;
  proformaInvoiceItemId: string;
  itemId: string;
  itemName: string;
  unit: string;
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
  customerContactPerson?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstNumber?: string;
  customerPanNumber?: string;
  customerAddress?: string;
  piId: string;
  piNo?: string;
  items: InvoiceItemRow[];
  totalQuantity: number;
  totalAmount: number;
  taxAmount: number;
  grandTotal?: number;
  status: InvoiceStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceListParams {
  search?: string;
  status?: 'all' | InvoiceStatus;
  customerId?: string;
  proformaInvoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InvoiceCreateLinePayload {
  proformaInvoiceItemId: string;
  itemId: string;
  batchNo: string;
  invoiceQty: number;
  rate: number;
  taxPercent: number;
}

export interface InvoiceCreatePayload {
  date: string;
  proformaInvoiceId: string;
  items: InvoiceCreateLinePayload[];
}
