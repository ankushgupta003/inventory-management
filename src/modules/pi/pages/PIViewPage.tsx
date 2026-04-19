import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import { piApi } from '../services/piApi';
import type { ProformaInvoiceRecord, PIStatus } from '../types';

const STATUS_LABELS: Record<PIStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  closed: 'Closed',
};

const COMPANY_NAME = 'Inventory Management Co.';
const useMock = import.meta.env.DEV;

const mockPI: ProformaInvoiceRecord[] = [
  {
    id: 'pi-1',
    piNo: 'PI-240401-101',
    date: '2026-04-01',
    customerId: 'c-1',
    customerName: 'XYZ Industries',
    customerAddress: 'Plot 21, Industrial Area\nPune, MH 411019',
    items: [
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', quantity: 50, rate: 4500, amount: 225000 },
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, rate: 8200, amount: 164000 },
    ],
    totalQuantity: 70,
    totalAmount: 389000,
    status: 'partial',
    createdAt: '2026-04-01',
  },
  {
    id: 'pi-2',
    piNo: 'PI-240402-114',
    date: '2026-04-02',
    customerId: 'c-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Warehouse Road\nAhmedabad, GJ 380015',
    items: [
      { itemId: 'fg-3', itemName: 'Packing Box Large', quantity: 200, rate: 45, amount: 9000 },
    ],
    totalQuantity: 200,
    totalAmount: 9000,
    status: 'pending',
    createdAt: '2026-04-02',
  },
];

export default function PIViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ProformaInvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!id) return;
        const data = await piApi.getById(id);
        if (active) setRecord(data);
      } catch {
        if (active) {
          const fallback = useMock ? mockPI.find((p) => p.id === id) ?? null : null;
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
    const amount = record?.items?.reduce((s, i) => s + (i.amount || i.quantity * i.rate || 0), 0) ?? 0;
    return { qty, amount };
  }, [record]);

  if (loading) {
    return <p className="text-muted-foreground">Loading PI...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/proforma-invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">PI not found.</p>
      </div>
    );
  }

  const address = record.customerAddress || '';

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Proforma Invoice"
        description={`${record.piNo} | ${record.date}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/proforma-invoices' },
          { label: 'View PI' },
        ]}
        action={(
          <div className="flex items-center justify-between gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/proforma-invoices')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="rounded-xl" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        )}
      />

      <div className="bg-white text-slate-900 border border-border rounded-lg p-6 print:p-0 print:border-0 print:bg-transparent">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wide">{COMPANY_NAME}</h1>
          <p className="text-sm text-muted-foreground">Proforma Invoice</p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <div className="font-semibold">Customer</div>
            <div>{record.customerName}</div>
            {address && <div className="text-muted-foreground whitespace-pre-line">{address}</div>}
          </div>
          <div className="text-right">
            <div><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{record.piNo}</span></div>
            <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{STATUS_LABELS[record.status]}</span></div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                {['Sr No','Item','Quantity','Rate','Amount'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.items.map((row, idx) => (
                <tr key={`${row.itemId}-${idx}`} className="border-b border-slate-200 last:border-0">
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium">{row.itemName}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2">₹{row.rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">₹{(row.amount || row.quantity * row.rate).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4 text-sm">
          <div className="space-y-1 text-right">
            <div>Total Qty: <span className="font-semibold">{totals.qty}</span></div>
            <div>Total Amount: <span className="font-semibold">₹{totals.amount.toLocaleString('en-IN')}</span></div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="border-t border-slate-300 pt-2">Prepared By</div>
          </div>
          <div>
            <div className="border-t border-slate-300 pt-2">Approved By</div>
          </div>
          <div>
            <div className="border-t border-slate-300 pt-2">Customer Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
