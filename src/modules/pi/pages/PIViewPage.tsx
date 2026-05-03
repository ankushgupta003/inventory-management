import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileCheck, Pencil, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import TableActionButton from '@/components/TableActionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { invoiceApi } from '@/modules/invoices/services/invoiceApi';
import type { InvoiceRecord } from '@/modules/invoices/types';
import { piApi } from '../services/piApi';
import type { PIStatus, ProformaInvoiceRecord } from '../types';

const STATUS_LABELS: Record<PIStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  completed: 'Completed',
  closed: 'Closed',
};

const statusColors: Record<PIStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-700',
};

const canEditRecord = (record: ProformaInvoiceRecord) =>
  record.status === 'pending' && record.items.every((item) => (item.invoicedQty || 0) <= 0);

export default function PIViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [record, setRecord] = useState<ProformaInvoiceRecord | null>(null);
  const [linkedInvoices, setLinkedInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewInvoices = hasPermission('invoices.view');
  const canCreateInvoices = hasPermission('invoices.create');
  const canEditPi = hasPermission('proforma_invoices.edit');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        if (!id) return;

        const [piRecord, invoices] = await Promise.all([
          piApi.getById(id),
          canViewInvoices ? invoiceApi.getAll({ proformaInvoiceId: id }) : Promise.resolve([]),
        ]);

        if (!active) return;
        setRecord(piRecord);
        setLinkedInvoices(invoices);
      } catch {
        if (active) {
          setRecord(null);
          setLinkedInvoices([]);
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
  }, [canViewInvoices, id]);

  const totals = useMemo(() => {
    const orderedQty = record?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const invoicedQty = record?.items.reduce((sum, item) => sum + item.invoicedQty, 0) ?? 0;
    const remainingQty = record?.items.reduce((sum, item) => sum + item.remainingQty, 0) ?? 0;
    const amount = record?.totalAmount ?? 0;

    return { orderedQty, invoicedQty, remainingQty, amount };
  }, [record]);

  if (loading) {
    return <p className="text-muted-foreground">Loading PI...</p>;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/proforma-invoices')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-muted-foreground">PI not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Proforma Invoice"
        description={`${record.piNo} | ${record.date}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/proforma-invoices' },
          { label: record.piNo },
        ]}
        action={(
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/proforma-invoices')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {canEditPi && canEditRecord(record) ? (
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/proforma-invoices/${record.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit PI
              </Button>
            ) : null}
            {canCreateInvoices && record.status !== 'completed' && record.status !== 'closed' ? (
              <Button className="rounded-xl" onClick={() => navigate(`/invoices/create?piId=${record.id}`)}>
                <FileCheck className="mr-2 h-4 w-4" /> Convert to Invoice
              </Button>
            ) : null}
            <Button variant="outline" className="rounded-xl" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        )}
      />

      <div className="rounded-xl border border-border bg-card p-6 text-slate-900 print:border-0 print:bg-transparent print:p-0">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="text-lg font-semibold">{record.customerName}</p>
            {record.customerContactPerson ? <p className="text-sm text-muted-foreground">{record.customerContactPerson}</p> : null}
            {record.customerAddress ? <p className="whitespace-pre-line text-sm text-muted-foreground">{record.customerAddress}</p> : null}
          </div>
          <div className="space-y-2 text-sm md:text-right">
            <p><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{record.piNo}</span></p>
            <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{record.date}</span></p>
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={statusColors[record.status]}>{STATUS_LABELS[record.status]}</Badge>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
            <p className="text-muted-foreground">Ordered Qty</p>
            <p className="text-lg font-semibold">{totals.orderedQty.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
            <p className="text-muted-foreground">Invoiced Qty</p>
            <p className="text-lg font-semibold">{totals.invoicedQty.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
            <p className="text-muted-foreground">Remaining Qty</p>
            <p className="text-lg font-semibold">{totals.remainingQty.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-muted-foreground">PI Amount</p>
            <p className="text-lg font-semibold text-primary">Rs {totals.amount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="mb-6 overflow-x-auto rounded-lg border border-slate-300">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100">
                {['#', 'Item', 'Unit', 'Ordered', 'Invoiced', 'Remaining', 'Rate', 'Amount', 'Remarks'].map((header) => (
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
                  <td className="px-3 py-2">{item.quantity.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">{item.invoicedQty.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">{item.remainingQty.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">Rs {item.rate.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2">Rs {item.amount.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Linked Invoice History</p>
              <p className="text-xs text-muted-foreground">
                {canViewInvoices ? 'All saved invoices raised from this PI.' : 'Invoice history is hidden because you do not have invoice view permission.'}
              </p>
            </div>
          </div>

          {canViewInvoices ? (
            linkedInvoices.length ? (
              <div className="overflow-x-auto rounded-lg border border-border/70 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Invoice No', 'Date', 'Qty', 'Amount', 'Status', ''].map((header) => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linkedInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium text-primary">{invoice.invoiceNo}</td>
                        <td className="px-3 py-2">{invoice.date}</td>
                        <td className="px-3 py-2">{invoice.totalQuantity.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2">Rs {(invoice.grandTotal ?? invoice.totalAmount + invoice.taxAmount).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className={invoice.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}>
                            {invoice.status === 'completed' ? 'Completed' : 'Partial'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <TableActionButton label="View Invoice" icon={Eye} tone="blue" onClick={() => navigate(`/invoices/${invoice.id}`)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No invoices have been created from this PI yet.</p>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
