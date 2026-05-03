import { useState } from 'react';
import { Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import FormModal from '@/components/FormModal';
import StatusBadge from '@/components/StatusBadge';
import TableActionButton from '@/components/TableActionButton';

interface InvoiceData {
  id: string; piId: string; customerName: string; date: string;
  items: { name: string; qty: number; rate: number; taxPercent: number }[];
  subtotal: number; taxAmount: number; total: number;
}

const invoices: InvoiceData[] = [
  {
    id: 'INV-001', piId: 'PI-001', customerName: 'XYZ Industries', date: '2024-03-10',
    items: [{ name: 'Motor Assembly A1', qty: 30, rate: 4500, taxPercent: 12 }],
    subtotal: 135000, taxAmount: 16200, total: 151200,
  },
];

export default function FinalInvoicePage() {
  const [viewInvoice, setViewInvoice] = useState<InvoiceData | null>(null);

  const columns = [
    { key: 'id', header: 'Invoice #' },
    { key: 'piId', header: 'PI Ref' },
    { key: 'customerName', header: 'Customer' },
    { key: 'date', header: 'Date' },
    { key: 'total', header: 'Total', render: (r: InvoiceData) => `₹${r.total.toLocaleString()}` },
    { key: 'status', header: 'Status', render: () => <StatusBadge status="completed" label="Generated" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="erp-page-header">Final Invoices</h1>

      <DataTable
        columns={columns}
        data={invoices}
        searchKey="customerName"
        searchPlaceholder="Search invoices..."
        actions={(row) => {
          
          return (
            <div className="flex items-center justify-end gap-1">
              <TableActionButton label="View" icon={Eye} tone="blue" onClick={() => setViewInvoice(row)} />
              <TableActionButton label="Print" icon={Printer} tone="indigo" onClick={() => window.print()} />
            </div>
          );
        }}
      />

      <FormModal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details" wide>
        {viewInvoice && (
          <div className="space-y-6 print:p-8" id="invoice-print">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-foreground">INVOICE</h2>
                <p className="text-sm text-muted-foreground">{viewInvoice.id}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Date: <strong className="text-foreground">{viewInvoice.date}</strong></p>
                <p className="text-muted-foreground">PI Ref: <strong className="text-foreground">{viewInvoice.piId}</strong></p>
              </div>
            </div>
            <div className="text-sm"><span className="text-muted-foreground">Bill To:</span> <strong className="text-foreground">{viewInvoice.customerName}</strong></div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50 border-b"><th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th><th className="text-right px-3 py-2 font-medium text-muted-foreground">Qty</th><th className="text-right px-3 py-2 font-medium text-muted-foreground">Rate</th><th className="text-right px-3 py-2 font-medium text-muted-foreground">Tax %</th><th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th></tr></thead>
                <tbody>
                  {viewInvoice.items.map((item, i) => (
                    <tr key={i} className="border-b"><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2 text-right">{item.qty}</td><td className="px-3 py-2 text-right">₹{item.rate.toLocaleString()}</td><td className="px-3 py-2 text-right">{item.taxPercent}%</td><td className="px-3 py-2 text-right font-medium">₹{(item.qty * item.rate).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₹{viewInvoice.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="text-foreground">₹{viewInvoice.taxAmount.toLocaleString()}</span></div>
                <div className="flex justify-between border-t pt-1 font-bold text-base"><span className="text-foreground">Total</span><span className="text-foreground">₹{viewInvoice.total.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="flex justify-end print:hidden">
              <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
