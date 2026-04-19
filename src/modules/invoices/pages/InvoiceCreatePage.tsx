import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
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
import { getBatchByBatchNo } from '@/modules/production/productionStore';

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
    id: 'pi-3',
    piNo: 'PI-FG-001',
    date: '2026-04-08',
    customerId: 'cust-a',
    customerName: 'Customer A',
    customerAddress: 'Unit 12, Industrial Park',
    items: [{ itemId: 'fg-1', itemName: 'Finished Product A', quantity: 480, invoicedQty: 0, rate: 250, amount: 120000 }],
    totalQuantity: 480,
    totalAmount: 120000,
    status: 'pending',
    createdAt: '2026-04-08',
  },
  {
    id: 'pi-2',
    piNo: 'PI-240402-114',
    date: '2026-04-02',
    customerId: 'c-2',
    customerName: 'PQR Trading Co.',
    customerAddress: 'Warehouse Road\nAhmedabad, GJ 380015',
    items: [{ itemId: 'fg-2', itemName: 'Gear Box GB-200', quantity: 20, invoicedQty: 0, rate: 8200, amount: 164000 }],
    totalQuantity: 20,
    totalAmount: 164000,
    status: 'pending',
    createdAt: '2026-04-02',
  },
];

export function InvoiceCreatePage() {
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
        setPiOptions(useMock && data.length === 0 ? mockPI : data);
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

    const hydrateFromPi = (rowsSource: ProformaInvoiceRecord['items'], customerId: string) => {
      const rows = rowsSource.map((it) => {
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
      setValue('customerId', customerId, { shouldValidate: true });
      replace(rows.length ? rows : [{ ...emptyRow }]);
    };

    const loadPI = async () => {
      try {
        const data = await piApi.getById(selectedPiId);
        if (!active) return;
        hydrateFromPi(data.items, data.customerId);
      } catch {
        const fallback = useMock ? mockPI.find((p) => p.id === selectedPiId) : null;
        if (!fallback || !active) return;
        hydrateFromPi(fallback.items, fallback.customerId);
      }
    };

    loadPI();
    return () => {
      active = false;
    };
  }, [replace, selectedPiId, setValue]);

  useEffect(() => {
    if (!selectedPiId) replace([{ ...emptyRow }]);
  }, [replace, selectedPiId]);

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
      const blocked = data.items.find((row) => {
        if (!row.batchNo) return false;
        const batch = getBatchByBatchNo(row.batchNo);
        return batch?.status === 'BLOCKED';
      });

      if (blocked) {
        toast.error(`Cannot sell blocked batch ${blocked.batchNo}`);
        setSubmitting(false);
        return;
      }

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

      try {
        const remaining = data.items.reduce((sum, item) => sum + (item.remainingQty - item.invoiceQty), 0);
        await piApi.updateStatus(data.piId, remaining <= 0 ? 'completed' : 'partial');
      } catch {
        // Non-blocking status sync.
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
    const qty = watchedItems?.reduce((sum, row) => sum + (row.invoiceQty || 0), 0) ?? 0;
    const subtotal = watchedItems?.reduce((sum, row) => sum + (row.invoiceQty * row.rate || 0), 0) ?? 0;
    const tax = watchedItems?.reduce((sum, row) => sum + (row.invoiceQty * row.rate * (row.taxPercent || 0) / 100), 0) ?? 0;
    return { qty, subtotal, tax, total: subtotal + tax };
  }, [watchedItems]);

  const fieldClass = (err: unknown) => (err ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Invoice"
        description="Generate customer invoice from approved PI with batch-level quantity control."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: 'Create Invoice' },
        ]}
        action={
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <FormSection title="Header" description="Select the source PI and invoice metadata.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                onValueChange={(value) => setValue('piId', value, { shouldValidate: true })}
                disabled={loadingPI}
              >
                <SelectTrigger className={fieldClass(errors.piId)}>
                  <SelectValue placeholder={loadingPI ? 'Loading PI...' : 'Select PI'} />
                </SelectTrigger>
                <SelectContent>
                  {piOptions.map((pi) => (
                    <SelectItem key={pi.id} value={pi.id}>
                      {pi.piNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.piId ? <p className="text-xs text-destructive">{errors.piId.message}</p> : null}
            </div>
          </div>
        </FormSection>

        <FormSection title="Invoice Items" description="Pick sale batch, quantity, and taxes for each PI line.">
          <div className="overflow-x-auto rounded-xl border border-border/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Item', 'Ordered', 'Invoiced', 'Remaining', 'Batch', 'Available', 'Invoice Qty *', 'Rate', 'Tax %', 'Amount', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const row = watchedItems?.[idx];
                  const rowErrors = errors.items?.[idx];
                  const batches = row?.itemName ? (batchesByItemName.get(row.itemName) ?? []) : [];

                  return (
                    <tr key={field.id} className="border-b border-border last:border-b-0 align-top">
                      <td className="px-3 py-2.5 font-medium">{row?.itemName || '-'}</td>
                      <td className="px-3 py-2.5">{row?.orderedQty ?? 0}</td>
                      <td className="px-3 py-2.5">{row?.invoicedQty ?? 0}</td>
                      <td className="px-3 py-2.5">{row?.remainingQty ?? 0}</td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={row?.batchNo ?? ''}
                          onValueChange={(value) => handleBatchChange(idx, value)}
                          disabled={!row?.itemName}
                        >
                          <SelectTrigger className={`w-44 ${fieldClass(rowErrors?.batchNo)}`}>
                            <SelectValue placeholder={row?.itemName ? 'Select batch' : 'Select PI first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((batch) => (
                              <SelectItem key={batch.batchNo} value={batch.batchNo}>
                                {batch.batchNo} (Avail: {batch.availableQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5">
                        <Input readOnly value={row?.availableQty ?? 0} className="w-24 bg-muted/40" />
                      </td>
                      <td className="px-3 py-2.5">
                        <Input
                          type="number"
                          className={`w-28 ${fieldClass(rowErrors?.invoiceQty)}`}
                          {...register(`items.${idx}.invoiceQty`, { valueAsNumber: true })}
                        />
                        {rowErrors?.invoiceQty ? <p className="mt-1 text-[11px] text-destructive">{rowErrors.invoiceQty.message}</p> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <Input type="number" className="w-24" {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Input type="number" className="w-20" {...register(`items.${idx}.taxPercent`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-3 py-2.5 font-medium">
                        Rs {((row?.invoiceQty ?? 0) * (row?.rate ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5">
                        {fields.length > 1 ? (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title="Totals" description="Review invoice totals before submit.">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="text-muted-foreground">Total Qty</p>
              <p className="text-lg font-semibold">{totals.qty}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="text-lg font-semibold">Rs {totals.subtotal.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="text-muted-foreground">Tax</p>
              <p className="text-lg font-semibold">Rs {totals.tax.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-muted-foreground">Grand Total</p>
              <p className="text-lg font-semibold text-primary">Rs {totals.total.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Review" description="Submit after validating quantities and batch selection.">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl min-w-32" disabled={submitting}>
              <FileCheck className="h-4 w-4 mr-2" />
              {submitting ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}

export default InvoiceCreatePage;
