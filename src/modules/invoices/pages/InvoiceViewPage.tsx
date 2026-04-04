import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoiceApi } from '../services/invoiceApi';
import type { InvoiceRecord } from '../types';

const useMock = import.meta.env.DEV;

const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-240403-501',
    date: '2026-04-03',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21, Industrial Area\nPune, MH 411019',
    piId: 'pi-1',
    piNo: 'PI-240401-101',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', batchNo: 'FG-240401-01', quantity: 40, rate: 4500, taxPercent: 18, amount: 180000 },
    ],
    totalQuantity: 40,
    totalAmount: 212400,
    taxAmount: 32400,
    status: 'partial',
    createdAt: '2026-04-03',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-240404-502',
    date: '2026-04-04',
    customerId: 'c-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Warehouse Road\nAhmedabad, GJ 380015',
    piId: 'pi-2',
    piNo: 'PI-240402-114',
    items: [
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', batchNo: 'FG-240402-02', quantity: 20, rate: 8200, taxPercent: 18, amount: 164000 },
    ],
    totalQuantity: 20,
    totalAmount: 193520,
    taxAmount: 29520,
    status: 'completed',
    createdAt: '2026-04-04',
  },
];

const COMPANY_NAME = 'Inventory Management Co.';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await invoiceApi.getById(id);
        if (active) setRecord(data);
      } catch {
        if (active) {
          const fallback = useMock ? mockInvoices.find((s) => s.id === id) ?? null : null;
          setRecord(fallback);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const totals = useMemo(() => {
    const qty = record?.items?.reduce((s, i) => s + (i.quantity || 0), 0) ?? 0;
    const subtotal = record?.items?.reduce((s, i) => s + (i.quantity * i.rate || 0), 0) ?? 0;
    const tax = record?.items?.reduce((s, i) => s + (i.quantity * i.rate * (i.taxPercent || 0) / 100), 0) ?? 0;
    return { qty, subtotal, tax, total: subtotal + tax };
  }, [record]);

  if (loading) {
    return <p className="text-muted-foreground">Loading invoice...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  const address = record.customerAddress || '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-white text-slate-900 border border-border rounded-lg p-6 print:p-0 print:border-0 print:bg-transparent">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wide">{COMPANY_NAME}</h1>
          <p className="text-sm text-muted-foreground">TAX INVOICE</p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <div className="font-semibold">Customer</div>
            <div>{record.customerName}</div>
            {address && <div className="text-muted-foreground whitespace-pre-line">{address}</div>}
          </div>
          <div className="text-right">
            <div><span className="text-muted-foreground">Invoice No:</span> <span className="font-medium">{record.invoiceNo}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></div>
            <div><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{record.piNo || record.piId}</span></div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                {['Sr No','Item','Batch No','Quantity','Rate','Tax %','Amount'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.items.map((row, idx) => (
                <tr key={`${row.itemId}-${idx}`} className="border-b border-slate-200 last:border-0">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.itemName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.batchNo}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">₹{row.rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">{row.taxPercent}%</td>
                  <td className="px-3 py-2">₹{(row.amount || row.quantity * row.rate).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4 text-sm">
          <div className="space-y-1 text-right">
            <div>Total Qty: <span className="font-semibold">{totals.qty}</span></div>
            <div>Subtotal: <span className="font-semibold">₹{totals.subtotal.toLocaleString('en-IN')}</span></div>
            <div>Tax: <span className="font-semibold">₹{totals.tax.toLocaleString('en-IN')}</span></div>
            <div>Total Amount: <span className="font-semibold">₹{totals.total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div />
          <div className="text-right">
            <div className="border-t border-slate-300 pt-2 inline-block w-56">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
