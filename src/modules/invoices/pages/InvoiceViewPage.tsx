import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
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
          const fallback = useMock ? mockInvoices.find((invoice) => invoice.id === id) ?? null : null;
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
    const qty = record?.items.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0;
    const subtotal = record?.items.reduce((sum, item) => sum + (item.quantity * item.rate || 0), 0) ?? 0;
    const tax = record?.items.reduce((sum, item) => sum + (item.quantity * item.rate * (item.taxPercent || 0) / 100), 0) ?? 0;
    return { qty, subtotal, tax, total: subtotal + tax };
  }, [record]);

  if (loading) {
    return <p className="text-muted-foreground">Loading invoice...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Invoice View"
        description="Review invoice details, line items, and totals before print or dispatch."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: record.invoiceNo },
        ]}
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="rounded-xl" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        }
      />

      <div className="rounded-xl border border-border bg-card p-6 text-slate-900 print:border-0 print:bg-transparent print:p-0">
        <div className="mb-4 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-wide">{COMPANY_NAME}</h1>
          <p className="text-sm text-muted-foreground">Tax Invoice</p>
        </div>

        <FormSection title="Billing Details" description="Customer and invoice reference information.">
          <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold">Customer</p>
              <p>{record.customerName}</p>
              {record.customerAddress ? <p className="whitespace-pre-line text-muted-foreground">{record.customerAddress}</p> : null}
            </div>
            <div className="space-y-1 text-left md:text-right">
              <p><span className="text-muted-foreground">Invoice No:</span> <span className="font-medium">{record.invoiceNo}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></p>
              <p><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{record.piNo || record.piId}</span></p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Line Items" description="Batch-level quantity and tax breakup.">
          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  {['Sr No', 'Item', 'Batch No', 'Quantity', 'Rate', 'Tax %', 'Amount'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-semibold text-slate-700">
                      {header}
                    </th>
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
                    <td className="px-3 py-2">Rs {row.rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{row.taxPercent}%</td>
                    <td className="px-3 py-2">Rs {(row.amount || row.quantity * row.rate).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title="Totals">
          <div className="flex justify-end text-sm">
            <div className="space-y-1 text-right">
              <p>Total Qty: <span className="font-semibold">{totals.qty}</span></p>
              <p>Subtotal: <span className="font-semibold">Rs {totals.subtotal.toLocaleString('en-IN')}</span></p>
              <p>Tax: <span className="font-semibold">Rs {totals.tax.toLocaleString('en-IN')}</span></p>
              <p>Total Amount: <span className="font-semibold">Rs {totals.total.toLocaleString('en-IN')}</span></p>
            </div>
          </div>
        </FormSection>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div />
          <div className="text-right">
            <div className="inline-block w-56 border-t border-slate-300 pt-2">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
