import api, { USE_MOCK } from '@/services/api';
import type { InvoiceRecord } from '../types';
import type { InvoiceFormValues } from '../schemas/invoiceSchema';

let mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-240403-501',
    date: '2026-04-03',
    customerId: 'cust-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 12, Industrial Area',
    piId: 'pi-1',
    piNo: 'PI-240401-101',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', quantity: 40, rate: 4500, taxPercent: 18, amount: 180000 },
    ],
    totalQuantity: 40,
    totalAmount: 180000,
    taxAmount: 32400,
    status: 'completed',
    createdAt: '2026-04-03',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-240404-502',
    date: '2026-04-04',
    customerId: 'cust-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Ring Road, Ahmedabad',
    piId: 'pi-2',
    piNo: 'PI-240402-114',
    items: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', quantity: 20, rate: 8200, taxPercent: 18, amount: 164000 },
    ],
    totalQuantity: 20,
    totalAmount: 164000,
    taxAmount: 29520,
    status: 'completed',
    createdAt: '2026-04-04',
  },
];

export const invoiceApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockInvoices);
    return api.get<InvoiceRecord[]>('/invoice').then((r) => r.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockInvoices.find((r) => r.id === id) || mockInvoices[0];
      return Promise.resolve(match);
    }
    return api.get<InvoiceRecord>(`/invoice/${id}`).then((r) => r.data);
  },
  create: (data: InvoiceFormValues) => {
    if (USE_MOCK) {
      const totalQuantity = data.items.reduce((s, i) => s + (i.invoiceQty || 0), 0);
      const totalAmount = data.items.reduce((s, i) => s + (i.invoiceQty * (i.rate || 0)), 0);
      const taxAmount = data.items.reduce((s, i) => s + (i.invoiceQty * (i.rate || 0) * (i.taxPercent || 0) / 100), 0);
      const created: InvoiceRecord = {
        id: `inv-${Date.now()}`,
        invoiceNo: data.invoiceNo,
        date: data.date,
        customerId: data.customerId,
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        piId: data.piId || '',
        piNo: data.piNo,
        items: data.items.map((i) => ({
          itemId: i.itemId,
          itemName: i.itemName,
          batchNo: i.batchNo,
          quantity: i.invoiceQty,
          rate: i.rate,
          taxPercent: i.taxPercent,
          amount: i.invoiceQty * i.rate,
        })),
        totalQuantity,
        totalAmount,
        taxAmount,
        status: 'completed',
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockInvoices = [created, ...mockInvoices];
      return Promise.resolve(created);
    }
    return api.post<InvoiceRecord>('/invoice', data).then((r) => r.data);
  },
};
