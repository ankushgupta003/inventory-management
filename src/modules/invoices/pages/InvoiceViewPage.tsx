import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { invoiceApi } from '../services/invoiceApi';
import type { InvoiceRecord } from '../types';

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
        if (active) {
          setRecord(data);
        }
      } catch {
        if (active) {
          setRecord(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const totals = useMemo(() => {
    const qty = record?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const subtotal = record?.totalAmount ?? 0;
    const tax = record?.taxAmount ?? 0;
    const total = record?.grandTotal ?? (subtotal + tax);
    return { qty, subtotal, tax, total };
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
        description="Review the saved immutable invoice, its PI reference, and print-ready line items."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: record.invoiceNo },
        ]}
        action={(
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button className="rounded-xl" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        )}
      />

      <div className="rounded-xl border border-border bg-card p-6 text-slate-900 print:border-0 print:bg-transparent print:p-0">
        <div className="mb-4 border-b pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-wide">InventoryX</h1>
          <p className="text-sm text-muted-foreground">Tax Invoice</p>
        </div>

        <FormSection title="Billing Details" description="Saved customer snapshot and source PI information.">
          <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold">Customer</p>
              <p>{record.customerName}</p>
              {record.customerContactPerson ? <p className="text-muted-foreground">{record.customerContactPerson}</p> : null}
              {record.customerAddress ? <p className="whitespace-pre-line text-muted-foreground">{record.customerAddress}</p> : null}
            </div>
            <div className="space-y-1 text-left md:text-right">
              <p><span className="text-muted-foreground">Invoice No:</span> <span className="font-medium">{record.invoiceNo}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></p>
              <p><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{record.piNo || record.piId}</span></p>
              <p><span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize">{record.status}</span></p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Line Items" description="Batch-level quantities saved against the selected PI lines.">
          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100">
                  {['#', 'Item', 'Unit', 'PI Line', 'Batch No', 'Quantity', 'Rate', 'Tax %', 'Amount'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-semibold text-slate-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-200 last:border-0">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium">{item.itemName}</td>
                    <td className="px-3 py-2">{item.unit}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.proformaInvoiceItemId}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.batchNo}</td>
                    <td className="px-3 py-2">{item.quantity.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">Rs {item.rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{item.taxPercent}%</td>
                    <td className="px-3 py-2">Rs {item.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title="Totals">
          <div className="flex justify-end text-sm">
            <div className="space-y-1 text-right">
              <p>Total Qty: <span className="font-semibold">{totals.qty.toLocaleString('en-IN')}</span></p>
              <p>Subtotal: <span className="font-semibold">Rs {totals.subtotal.toLocaleString('en-IN')}</span></p>
              <p>Tax: <span className="font-semibold">Rs {totals.tax.toLocaleString('en-IN')}</span></p>
              <p>Total Amount: <span className="font-semibold">Rs {totals.total.toLocaleString('en-IN')}</span></p>
            </div>
          </div>
        </FormSection>
      </div>
    </div>
  );
}
