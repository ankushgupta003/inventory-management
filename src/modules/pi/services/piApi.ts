import api, { USE_MOCK } from '@/services/api';
import type { ProformaInvoiceRecord, PIStatus } from '../types';
import type { PIFormValues } from '../schemas/piSchema';

let mockPI: ProformaInvoiceRecord[] = [
  {
    id: 'pi-1',
    piNo: 'PI-240401-101',
    date: '2026-04-01',
    customerId: 'cust-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 12, Industrial Area',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', quantity: 50, invoicedQty: 10, rate: 4500, amount: 225000 },
    ],
    totalQuantity: 50,
    totalAmount: 225000,
    status: 'partial',
    createdAt: '2026-04-01',
  },
  {
    id: 'pi-3',
    piNo: 'PI-FG-001',
    date: '2026-04-08',
    customerId: 'cust-a',
    customerName: 'Customer A',
    customerAddress: 'Unit 12, Industrial Park',
    items: [
      { itemId: 'fg-1', itemName: 'Finished Product A', quantity: 480, invoicedQty: 0, rate: 250, amount: 120000 },
    ],
    totalQuantity: 480,
    totalAmount: 120000,
    status: 'pending',
    createdAt: '2026-04-08',
  },
  {
    id: 'pi-2',
    piNo: 'PI-240402-114',
    date: '2026-04-02',
    customerId: 'cust-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Ring Road, Ahmedabad',
    items: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, invoicedQty: 20, rate: 8200, amount: 164000 },
    ],
    totalQuantity: 20,
    totalAmount: 164000,
    status: 'completed',
    createdAt: '2026-04-02',
  },
];

export const piApi = {
  getAll: () => {
    if (USE_MOCK) return Promise.resolve(mockPI);
    return api.get<ProformaInvoiceRecord[]>('/pi').then((r) => r.data);
  },
  getById: (id: string) => {
    if (USE_MOCK) {
      const match = mockPI.find((r) => r.id === id) || mockPI[0];
      return Promise.resolve(match);
    }
    return api.get<ProformaInvoiceRecord>(`/pi/${id}`).then((r) => r.data);
  },
  create: (data: PIFormValues) => {
    if (USE_MOCK) {
      const totalQuantity = data.items.reduce((s, i) => s + (i.quantity || 0), 0);
      const totalAmount = data.items.reduce((s, i) => s + (i.amount || 0), 0);
      const created: ProformaInvoiceRecord = {
        id: `pi-${Date.now()}`,
        piNo: data.piNo,
        date: data.date,
        customerId: data.customerId,
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        items: data.items,
        totalQuantity,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockPI = [created, ...mockPI];
      return Promise.resolve(created);
    }
    return api.post<ProformaInvoiceRecord>('/pi', data).then((r) => r.data);
  },
  updateStatus: (id: string, status: PIStatus) => {
    if (USE_MOCK) {
      mockPI = mockPI.map((r) => (r.id === id ? { ...r, status } : r));
      return Promise.resolve(mockPI.find((r) => r.id === id));
    }
    return api.patch(`/pi/${id}/status`, { status }).then((r) => r.data);
  },
};
