import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Trash2, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { invoiceSchema, type InvoiceFormValues } from '../schemas/invoiceSchema';
import { invoiceApi } from '../services/invoiceApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { piApi } from '@/modules/pi/services/piApi';
import { useInvoiceStock } from '../hooks/useInvoiceStock';
import type { ProformaInvoiceRecord } from '@/modules/pi/types';

const createInvoiceNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${datePart}-${rand}`;
};

const emptyRow = {
  itemId: '',
  itemName: '',
  batchNo: '',
  availableQty: 0,
  orderedQty: 0,
  invoicedQty: 0,
  remainingQty: 0,
  invoiceQty: 0,
  rate: 0,
  taxPercent: 18,
};

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
      { itemId: 'fg-1', itemName: 'Motor Assembly A1', quantity: 50, invoicedQty: 10, rate: 4500, amount: 225000 },
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, invoicedQty: 0, rate: 8200, amount: 164000 },
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
      { itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, invoicedQty: 0, rate: 8200, amount: 164000 },
    ],
    totalQuantity: 20,
    totalAmount: 164000,
    status: 'pending',
    createdAt: '2026-04-02',
  },
];

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [piOptions, setPiOptions] = useState<ProformaInvoiceRecord[]>([]);
  const [loadingPI, setLoadingPI] = useState(true);
  const { batchesByItemName } = useInvoiceStock();

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNo: createInvoiceNo(),
      date: today,
      piId: '',
      customerId: '',
      items: [{ ...emptyRow }],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, replace, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedPiId = watch('piId');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await piApi.getAll();
        if (!active) return;
        if (useMock && data.length === 0) {
          setPiOptions(mockPI);
        } else {
          setPiOptions(data);
        }
      } catch {
        if (!active) return;
        setPiOptions(useMock ? mockPI : []);
      } finally {
        if (active) setLoadingPI(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPiId) return;
    let active = true;
    const loadPI = async () => {
      try {
        const data = await piApi.getById(selectedPiId);
        if (!active) return;
        const rows = data.items.map((it) => {
          const invoiced = it.invoicedQty ?? 0;
          const remaining = Math.max(0, it.quantity - invoiced);
          return {
            ...emptyRow,
            itemId: it.itemId,
            itemName: it.itemName,
            orderedQty: it.quantity,
            invoicedQty: invoiced,
            remainingQty: remaining,
            rate: it.rate,
          };
        });
        setValue('customerId', data.customerId, { shouldValidate: true });
        replace(rows.length ? rows : [{ ...emptyRow }]);
      } catch {
        const fallback = useMock ? mockPI.find((p) => p.id === selectedPiId) : null;
        if (fallback) {
          const rows = fallback.items.map((it) => {
            const invoiced = it.invoicedQty ?? 0;
            const remaining = Math.max(0, it.quantity - invoiced);
            return {
              ...emptyRow,
              itemId: it.itemId,
              itemName: it.itemName,
              orderedQty: it.quantity,
              invoicedQty: invoiced,
              remainingQty: remaining,
              rate: it.rate,
            };
          });
          setValue('customerId', fallback.customerId, { shouldValidate: true });
          replace(rows.length ? rows : [{ ...emptyRow }]);
        }
      }
    };
    loadPI();
    return () => {
      active = false;
    };
  }, [selectedPiId, replace, setValue]);

  useEffect(() => {
    if (!selectedPiId) {
      replace([{ ...emptyRow }]);
    }
  }, [selectedPiId, replace]);

  const handleBatchChange = (index: number, batchNo: string) => {
    const itemName = watchedItems?.[index]?.itemName ?? '';
    const batches = batchesByItemName.get(itemName) ?? [];
    const batch = batches.find((b) => b.batchNo === batchNo);
    setValue(`items.${index}.batchNo`, batchNo, { shouldValidate: true });
    setValue(`items.${index}.availableQty`, batch?.availableQty ?? 0, { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setSubmitting(true);
    try {
      const created = await invoiceApi.create(data);
      const entries = data.items.map((row) => ({
        date: data.date,
        referenceNo: data.invoiceNo,
        type: 'invoice',
        particulars: 'Sales',
        itemName: row.itemName,
        itemCategory: 'FINISHED',
        batchNo: row.batchNo,
        mfgDate: '',
        expiryDate: '',
        receiptQty: 0,
        issueQty: row.invoiceQty,
        rate: row.rate,
        remarks: 'Invoice',
      }));
      try {
        await ledgerApi.create({ entries });
      } catch {
        toast.error('Invoice saved, but ledger update failed. Please retry ledger sync.');
      }

      // Update PI status (partial/completed) based on remaining qty
      try {
        const remaining = data.items.reduce((s, i) => s + (i.remainingQty - i.invoiceQty), 0);
        const status = remaining <= 0 ? 'completed' : 'partial';
        await piApi.updateStatus(data.piId, status);
      } catch {
        // non-blocking
      }

      toast.success('Invoice created');
      navigate(`/invoices/${created.id}`);
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const qty = watchedItems?.reduce((s, r) => s + (r.invoiceQty || 0), 0) ?? 0;
    const subtotal = watchedItems?.reduce((s, r) => s + (r.invoiceQty * r.rate || 0), 0) ?? 0;
    const tax = watchedItems?.reduce((s, r) => s + (r.invoiceQty * r.rate * (r.taxPercent || 0) / 100), 0) ?? 0;
    return { qty, subtotal, tax, total: subtotal + tax };
  }, [watchedItems]);

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <FileCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 1: Select PI</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice No</Label>
              <Input readOnly {...register('invoiceNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Select PI *</Label>
              <Select
                value={watch('piId')}
                onValueChange={(v) => setValue('piId', v, { shouldValidate: true })}
                disabled={loadingPI}
              >
                <SelectTrigger className={fieldClass(errors.piId)}>
                  <SelectValue placeholder={loadingPI ? 'Loading...' : 'Select PI'} />
                </SelectTrigger>
                <SelectContent>
                  {piOptions.map((pi) => (
                    <SelectItem key={pi.id} value={pi.id}>{pi.piNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.piId && <p className="text-xs text-destructive">{errors.piId.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 2: Items</h3>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Item','Ordered','Invoiced','Remaining','Batch','Available','Invoice Qty *','Rate','Tax %','Amount',''].map((h) => (
                    <th key={h} className="text-left px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const re = errors.items?.[idx];
                  const row = watchedItems?.[idx];
                  const itemName = row?.itemName ?? '';
                  const batches = itemName ? (batchesByItemName.get(itemName) ?? []) : [];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-2.5 py-2 font-medium">{row?.itemName || '—'}</td>
                      <td className="px-2.5 py-2">{row?.orderedQty ?? 0}</td>
                      <td className="px-2.5 py-2">{row?.invoicedQty ?? 0}</td>
                      <td className="px-2.5 py-2">{row?.remainingQty ?? 0}</td>
                      <td className="px-2.5 py-2">
                        <Select value={row?.batchNo ?? ''} onValueChange={(v) => handleBatchChange(idx, v)} disabled={!row?.itemName}>
                          <SelectTrigger className={`w-40 ${fieldClass(re?.batchNo)}`}>
                            <SelectValue placeholder={row?.itemName ? 'Select batch' : 'Select PI first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.batchNo} value={b.batchNo}>
                                {b.batchNo} (Avail: {b.availableQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.availableQty ?? 0} className="w-20 bg-muted/50" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-24 ${fieldClass(re?.invoiceQty)}`} {...register(`items.${idx}.invoiceQty`, { valueAsNumber: true })} />
                        {re?.invoiceQty && <p className="text-[10px] text-destructive mt-1">{re.invoiceQty.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className="w-24" {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className="w-20" {...register(`items.${idx}.taxPercent`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2 font-medium">
                        ₹{((row?.invoiceQty ?? 0) * (row?.rate ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2.5 py-2 pt-3">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Step 3: Totals</h3>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Total Qty: <span className="font-medium text-foreground">{totals.qty}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Subtotal: <span className="font-medium text-foreground">₹{totals.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Tax: <span className="font-medium text-foreground">₹{totals.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              Total: <span className="text-primary">₹{totals.total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
