import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoiceStock } from '../hooks/useInvoiceStock';
import { invoiceSchema, type InvoiceFormValues } from '../schemas/invoiceSchema';
import { invoiceApi } from '../services/invoiceApi';
import { piApi } from '@/modules/pi/services/piApi';
import type { ProformaInvoiceRecord } from '@/modules/pi/types';

const emptyValues: InvoiceFormValues = {
  date: new Date().toISOString().split('T')[0],
  proformaInvoiceId: '',
  items: [],
};

const hasRemainingLines = (record: ProformaInvoiceRecord) =>
  record.status !== 'completed'
  && record.status !== 'closed'
  && record.items.some((item) => item.remainingQty > 0);

export function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPiId = searchParams.get('piId') ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [piOptions, setPiOptions] = useState<ProformaInvoiceRecord[]>([]);
  const [selectedPi, setSelectedPi] = useState<ProformaInvoiceRecord | null>(null);
  const [loadingPi, setLoadingPi] = useState(true);
  const { items: stockItems, batchesByItemId } = useInvoiceStock();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: emptyValues,
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const { fields, replace } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedPiId = watch('proformaInvoiceId');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const records = await piApi.getAll();
        if (!active) return;

        const openOptions = records.filter(hasRemainingLines);
        setPiOptions(openOptions);

        const initialPiId = requestedPiId && openOptions.some((record) => record.id === requestedPiId)
          ? requestedPiId
          : '';

        reset({
          ...emptyValues,
          proformaInvoiceId: initialPiId,
        });
      } catch {
        if (active) {
          setPiOptions([]);
          toast.error('Failed to load PI options');
        }
      } finally {
        if (active) {
          setLoadingPi(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [requestedPiId, reset]);

  useEffect(() => {
    if (!selectedPiId) {
      setSelectedPi(null);
      replace([]);
      return;
    }

    let active = true;

    const loadPi = async () => {
      try {
        const record = await piApi.getById(selectedPiId);
        if (!active) return;

        setSelectedPi(record);
        replace(
          record.items
            .filter((item) => item.remainingQty > 0)
            .map((item) => ({
              proformaInvoiceItemId: item.id,
              itemId: item.itemId,
              itemName: item.itemName,
              unit: item.unit,
              batchNo: '',
              availableQty: 0,
              orderedQty: item.quantity,
              invoicedQty: item.invoicedQty,
              remainingQty: item.remainingQty,
              invoiceQty: 0,
              rate: item.rate,
              taxPercent: stockItems.find((stockItem) => stockItem.id === item.itemId)?.gstRate ?? 0,
            })),
        );
      } catch {
        if (!active) return;
        setSelectedPi(null);
        replace([]);
        toast.error('Failed to load PI details');
      }
    };

    loadPi();

    return () => {
      active = false;
    };
  }, [replace, selectedPiId, stockItems]);

  const handlePiSelection = (value: string) => {
    setValue('proformaInvoiceId', value, { shouldValidate: true });
    if (value) {
      setSearchParams({ piId: value });
    } else {
      setSearchParams({});
    }
  };

  const handleBatchChange = (index: number, batchNo: string) => {
    const row = watchedItems[index];
    const batches = row?.itemId ? (batchesByItemId.get(row.itemId) ?? []) : [];
    const batch = batches.find((candidate) => candidate.batchNo === batchNo);
    setValue(`items.${index}.batchNo`, batchNo, { shouldValidate: true });
    setValue(`items.${index}.availableQty`, batch?.availableQty ?? 0, { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        date: data.date,
        proformaInvoiceId: data.proformaInvoiceId,
        items: data.items
          .filter((item) => item.invoiceQty > 0)
          .map((item) => ({
            proformaInvoiceItemId: item.proformaInvoiceItemId,
            itemId: item.itemId,
            batchNo: item.batchNo,
            invoiceQty: item.invoiceQty,
            rate: item.rate,
            taxPercent: item.taxPercent,
          })),
      };

      const created = await invoiceApi.create(payload);
      toast.success('Invoice created');
      navigate(`/invoices/${created.id}`);
    } catch {
      toast.error('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const qty = watchedItems.reduce((sum, row) => sum + (row.invoiceQty || 0), 0);
    const subtotal = watchedItems.reduce((sum, row) => sum + ((row.invoiceQty || 0) * (row.rate || 0)), 0);
    const tax = watchedItems.reduce((sum, row) => sum + (((row.invoiceQty || 0) * (row.rate || 0) * (row.taxPercent || 0)) / 100), 0);
    return { qty, subtotal, tax, total: subtotal + tax };
  }, [watchedItems]);

  const invoiceableLines = watchedItems.filter((item) => item.remainingQty > 0);
  const rowsWithQty = watchedItems.filter((item) => item.invoiceQty > 0);
  const fieldClass = (error: unknown) => (error ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Invoice"
        description="Review remaining PI lines, choose finished-goods batches, and save the final invoice."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Invoices', href: '/invoices' },
          { label: 'Create Invoice' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
            Back to List
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <FormSection title="Header" description="Select the source PI. Invoice numbering is generated by the backend when you save.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Invoice No</Label>
              <Input readOnly value="Auto-generated on save" className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Select PI *</Label>
              <Select value={selectedPiId} onValueChange={handlePiSelection} disabled={loadingPi}>
                <SelectTrigger className={fieldClass(errors.proformaInvoiceId)}>
                  <SelectValue placeholder={loadingPi ? 'Loading PI...' : 'Select open PI'} />
                </SelectTrigger>
                <SelectContent>
                  {piOptions.map((pi) => (
                    <SelectItem key={pi.id} value={pi.id}>
                      {pi.piNo} · {pi.customerName} · Remaining {pi.items.reduce((sum, item) => sum + item.remainingQty, 0).toLocaleString('en-IN')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.proformaInvoiceId ? <p className="text-xs text-destructive">{errors.proformaInvoiceId.message}</p> : null}
            </div>
          </div>

          {selectedPi ? (
            <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{selectedPi.customerName}</p>
                  {selectedPi.customerAddress ? <p className="whitespace-pre-line text-muted-foreground">{selectedPi.customerAddress}</p> : null}
                </div>
                <div className="space-y-1 text-left md:text-right">
                  <p><span className="text-muted-foreground">PI No:</span> <span className="font-medium">{selectedPi.piNo}</span></p>
                  <p><span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize">{selectedPi.status}</span></p>
                </div>
              </div>
            </div>
          ) : null}
        </FormSection>

        <FormSection title="Invoice Items" description="Only PI lines with remaining quantity are available for conversion. Enter qty only on the lines you want to invoice now.">
          {selectedPiId && !invoiceableLines.length ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
              This PI has no remaining quantity available for invoicing.
            </div>
          ) : null}

          {!selectedPiId ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
              Select an open PI to review remaining lines and available finished-goods batches.
            </div>
          ) : null}

          {invoiceableLines.length ? (
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Item', 'Unit', 'Ordered', 'Invoiced', 'Remaining', 'Batch', 'Available', 'Invoice Qty', 'Rate', 'Tax %', 'Amount'].map((header) => (
                      <th key={header} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const row = watchedItems[index];
                    const rowErrors = errors.items?.[index];
                    const batches = row?.itemId ? (batchesByItemId.get(row.itemId) ?? []) : [];

                    return (
                      <tr key={field.id} className="border-b border-border align-top last:border-0">
                        <td className="px-3 py-2.5 font-medium">{row?.itemName || '-'}</td>
                        <td className="px-3 py-2.5">{row?.unit || '-'}</td>
                        <td className="px-3 py-2.5">{row?.orderedQty ?? 0}</td>
                        <td className="px-3 py-2.5">{row?.invoicedQty ?? 0}</td>
                        <td className="px-3 py-2.5">{row?.remainingQty ?? 0}</td>
                        <td className="px-3 py-2.5">
                          <Select
                            value={row?.batchNo ?? ''}
                            onValueChange={(value) => handleBatchChange(index, value)}
                          >
                            <SelectTrigger className={`w-44 ${fieldClass(rowErrors?.batchNo)}`}>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {batches.map((batch) => (
                                <SelectItem key={batch.batchNo} value={batch.batchNo}>
                                  {batch.batchNo} (Avail: {batch.availableQty.toLocaleString('en-IN')})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {rowErrors?.batchNo ? <p className="mt-1 text-[11px] text-destructive">{rowErrors.batchNo.message}</p> : null}
                        </td>
                        <td className="px-3 py-2.5">
                          <Input readOnly value={row?.availableQty ?? 0} className="w-24 bg-muted/40" />
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="number"
                            className={`w-28 ${fieldClass(rowErrors?.invoiceQty)}`}
                            {...register(`items.${index}.invoiceQty`, { valueAsNumber: true })}
                          />
                          {rowErrors?.invoiceQty ? <p className="mt-1 text-[11px] text-destructive">{rowErrors.invoiceQty.message}</p> : null}
                        </td>
                        <td className="px-3 py-2.5">
                          <Input type="number" className="w-24" {...register(`items.${index}.rate`, { valueAsNumber: true })} />
                        </td>
                        <td className="px-3 py-2.5">
                          <Input type="number" className="w-20" {...register(`items.${index}.taxPercent`, { valueAsNumber: true })} />
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          Rs {(((row?.invoiceQty ?? 0) * (row?.rate ?? 0)) || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </FormSection>

        <FormSection title="Totals" description="Totals update from the rows you have entered for this invoice save.">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3">
              <p className="text-muted-foreground">Invoice Qty</p>
              <p className="text-lg font-semibold">{totals.qty.toLocaleString('en-IN')}</p>
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

        <FormSection title="Review" description="Saved invoices are immutable in this flow. Validate quantities and batches before saving.">
          {errors.items?.message ? <p className="text-sm text-destructive">{errors.items.message}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate('/invoices')}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-32 rounded-xl" disabled={submitting || !invoiceableLines.length || !rowsWithQty.length}>
              <FileCheck className="mr-2 h-4 w-4" />
              {submitting ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}

export default InvoiceCreatePage;
