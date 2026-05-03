import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import TableActionButton from '@/components/TableActionButton';
import FlexibleDateInput from '@/components/FlexibleDateInput';
import FormSection from '@/components/FormSection';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getErrorMessage } from '@/lib/apiError';
import { itemsApi } from '@/modules/items/services/itemsApi';
import type { ItemRecord } from '@/modules/items/types';
import { partiesApi } from '@/modules/parties/services/partiesApi';
import type { PartyRecord } from '@/modules/parties/types';
import { ginSchema, type GINFormValues } from '../schemas/purchaseSchema';
import { purchasesApi } from '../services/purchasesApi';

const emptyRow = {
  itemId: '',
  ulpQty: 0,
  billQty: 0,
  receivedQty: 0,
  acceptedQty: 0,
  rejectedQty: 0,
  batchNo: '',
  mfgDate: '',
  expiryDate: '',
  rate: 0,
  taxableValue: 0,
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  remarks: '',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const computeLineTotals = (row?: GINFormValues['items'][number]) => {
  if (!row) {
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      lineTotalAmount: 0,
    };
  }

  const taxableValue = Number(row.taxableValue || 0);
  const cgstAmount = Number(((taxableValue * (row.cgstRate || 0)) / 100).toFixed(2));
  const sgstAmount = Number(((taxableValue * (row.sgstRate || 0)) / 100).toFixed(2));
  const igstAmount = Number(((taxableValue * (row.igstRate || 0)) / 100).toFixed(2));
  const lineTotalAmount = Number((taxableValue + cgstAmount + sgstAmount + igstAmount).toFixed(2));

  return {
    cgstAmount,
    sgstAmount,
    igstAmount,
    lineTotalAmount,
  };
};

export default function GoodsInwardPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [vendors, setVendors] = useState<PartyRecord[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemRecord[]>([]);
  const today = new Date().toISOString().split('T')[0];

  const defaultValues = useMemo<GINFormValues>(() => ({
    vendorId: '',
    challanNo: '',
    challanDate: today,
    billNo: '',
    billDate: today,
    gateEntryNo: '',
    entryDate: today,
    items: [{ ...emptyRow }],
    preparedBy: '',
    sanctionedBy: '',
    authorizedSignatory: '',
  }), [today]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GINFormValues>({
    resolver: zodResolver(ginSchema),
    defaultValues,
  });

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [parties, items] = await Promise.all([
          partiesApi.getAll({ paginate: false, status: 'active' }),
          itemsApi.getAll({ paginate: false, status: 'active', itemType: 'raw' }),
        ]);
        if (!active) return;
        setVendors(parties.filter((party) => party.partyType === 'vendor' || party.partyType === 'both'));
        setAvailableItems(items.filter((item) => item.itemType === 'raw'));
      } catch (error) {
        if (!active) return;
        setVendors([]);
        setAvailableItems([]);
        toast.error(getErrorMessage(error, 'Failed to load vendor and item options'));
      } finally {
        if (active) setLoadingOptions(false);
      }
    };
    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const lineAmounts = watchedItems?.map((row) => computeLineTotals(row)) ?? [];
  const totals = lineAmounts.reduce(
    (acc, row, index) => ({
      taxableValue: acc.taxableValue + Number(watchedItems[index]?.taxableValue || 0),
      cgstAmount: acc.cgstAmount + row.cgstAmount,
      sgstAmount: acc.sgstAmount + row.sgstAmount,
      igstAmount: acc.igstAmount + row.igstAmount,
      lineTotalAmount: acc.lineTotalAmount + row.lineTotalAmount,
    }),
    {
      taxableValue: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      lineTotalAmount: 0,
    },
  );

  const syncTaxableValue = (idx: number, acceptedQty: number, rate: number) => {
    const nextTaxableValue = Number((Math.max(0, acceptedQty) * Math.max(0, rate)).toFixed(2));
    setValue(`items.${idx}.taxableValue`, nextTaxableValue, { shouldDirty: true, shouldValidate: true });
  };

  const handleReceivedChange = (idx: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setValue(`items.${idx}.receivedQty`, safeValue, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.acceptedQty`, safeValue, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.rejectedQty`, 0, { shouldDirty: true, shouldValidate: true });
    syncTaxableValue(idx, safeValue, watchedItems[idx]?.rate ?? 0);
  };

  const handleAcceptedChange = (idx: number, value: number) => {
    const received = watchedItems[idx]?.receivedQty ?? 0;
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const accepted = Math.min(safeValue, received);
    setValue(`items.${idx}.acceptedQty`, accepted, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.rejectedQty`, received - accepted, { shouldDirty: true, shouldValidate: true });
    syncTaxableValue(idx, accepted, watchedItems[idx]?.rate ?? 0);
  };

  const handleRateChange = (idx: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setValue(`items.${idx}.rate`, safeValue, { shouldDirty: true, shouldValidate: true });
    syncTaxableValue(idx, watchedItems[idx]?.acceptedQty ?? 0, safeValue);
  };

  const onSubmit = async (data: GINFormValues) => {
    setSubmitting(true);
    try {
      await purchasesApi.create(data);
      toast.success('Goods inward note saved successfully');
      reset(defaultValues);
      navigate('/purchases');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save GIN'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err: unknown) => (err ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Goods Inward Note (GIN)"
        description="Capture inbound purchase receipts with taxable value and GST breakup."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/purchases' },
          { label: 'Create GIN' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/purchases')}>
            Back to List
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Header Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Vendor Name *</Label>
              <Select
                value={watch('vendorId')}
                onValueChange={(value) => setValue('vendorId', value, { shouldDirty: true, shouldValidate: true })}
                disabled={loadingOptions}
              >
                <SelectTrigger className={fieldClass(errors.vendorId)}>
                  <SelectValue placeholder={loadingOptions ? 'Loading vendors...' : 'Select vendor'} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId ? <p className="text-xs text-destructive">{errors.vendorId.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Challan No *</Label>
              <Input placeholder="CH-001" {...register('challanNo')} className={fieldClass(errors.challanNo)} />
            </div>
            <div className="space-y-1.5">
              <Label>Challan Date *</Label>
              <Input type="date" {...register('challanDate')} className={fieldClass(errors.challanDate)} />
            </div>

            <div className="space-y-1.5">
              <Label>Bill No *</Label>
              <Input placeholder="BILL-001" {...register('billNo')} className={fieldClass(errors.billNo)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bill Date *</Label>
              <Input type="date" {...register('billDate')} className={fieldClass(errors.billDate)} />
            </div>

            <div className="space-y-1.5">
              <Label>Gate Entry No *</Label>
              <Input placeholder="GE-001" {...register('gateEntryNo')} className={fieldClass(errors.gateEntryNo)} />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Date *</Label>
              <Input type="date" {...register('entryDate')} className={fieldClass(errors.entryDate)} />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Line Items"
          description="Accepted quantity drives the default taxable value. Row dates open a picker, and you can switch to month-only mode when the supplier provides MM/YYYY."
          actions={(
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyRow })}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
            </Button>
          )}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    'Item *',
                    'ULP Qty',
                    'Bill Qty',
                    'Received',
                    'Accepted',
                    'Rejected',
                    'Batch *',
                    'MFG Date',
                    'Expiry Date',
                    'Rate',
                    'Taxable Value',
                    'CGST %',
                    'CGST Amt',
                    'SGST %',
                    'SGST Amt',
                    'IGST %',
                    'IGST Amt',
                    'Line Total',
                    'Remarks',
                    '',
                  ].map((header) => (
                    <th key={header} className="whitespace-nowrap px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const rowErrors = errors.items?.[idx];
                  const line = lineAmounts[idx] ?? { cgstAmount: 0, sgstAmount: 0, igstAmount: 0, lineTotalAmount: 0 };
                  return (
                    <tr key={field.id} className="border-b border-border align-top last:border-0">
                      <td className="px-2.5 py-2">
                        <Select
                          value={watchedItems[idx]?.itemId ?? ''}
                          onValueChange={(value) => setValue(`items.${idx}.itemId`, value, { shouldDirty: true, shouldValidate: true })}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger className={`w-52 ${fieldClass(rowErrors?.itemId)}`}>
                            <SelectValue placeholder={loadingOptions ? 'Loading items...' : 'Select'} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.storeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.001" className="w-[92px]" {...register(`items.${idx}.ulpQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.001" className="w-[92px]" {...register(`items.${idx}.billQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          step="0.001"
                          className={`w-[92px] ${fieldClass(rowErrors?.receivedQty)}`}
                          {...register(`items.${idx}.receivedQty`, { valueAsNumber: true })}
                          onChange={(event) => handleReceivedChange(idx, Number(event.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          step="0.001"
                          name={`items.${idx}.acceptedQty`}
                          className={`w-[92px] ${fieldClass(rowErrors?.acceptedQty)}`}
                          value={watchedItems[idx]?.acceptedQty ?? 0}
                          onChange={(event) => handleAcceptedChange(idx, Number(event.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.001" className="w-[92px] bg-muted/50" value={watchedItems[idx]?.rejectedQty ?? 0} readOnly tabIndex={-1} /></td>
                      <td className="px-2.5 py-2"><Input className={`w-32 ${fieldClass(rowErrors?.batchNo)}`} placeholder="B-001" {...register(`items.${idx}.batchNo`)} /></td>
                      <td className="px-2.5 py-2">
                        <Controller
                          control={control}
                          name={`items.${idx}.mfgDate`}
                          render={({ field }) => (
                            <FlexibleDateInput
                              {...field}
                              className={`w-32 ${fieldClass(rowErrors?.mfgDate)}`}
                            />
                          )}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Controller
                          control={control}
                          name={`items.${idx}.expiryDate`}
                          render={({ field }) => (
                            <FlexibleDateInput
                              {...field}
                              className={`w-32 ${fieldClass(rowErrors?.expiryDate)}`}
                            />
                          )}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          step="0.0001"
                          name={`items.${idx}.rate`}
                          className={`w-28 ${fieldClass(rowErrors?.rate)}`}
                          value={watchedItems[idx]?.rate ?? 0}
                          onChange={(event) => handleRateChange(idx, Number(event.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          className={`w-32 ${fieldClass(rowErrors?.taxableValue)}`}
                          {...register(`items.${idx}.taxableValue`, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.01" className={`w-24 ${fieldClass(rowErrors?.cgstRate)}`} {...register(`items.${idx}.cgstRate`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2 pt-4 text-xs font-medium text-foreground">Rs {formatCurrency(line.cgstAmount)}</td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.01" className={`w-24 ${fieldClass(rowErrors?.sgstRate)}`} {...register(`items.${idx}.sgstRate`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2 pt-4 text-xs font-medium text-foreground">Rs {formatCurrency(line.sgstAmount)}</td>
                      <td className="px-2.5 py-2"><Input type="number" step="0.01" className={`w-24 ${fieldClass(rowErrors?.igstRate)}`} {...register(`items.${idx}.igstRate`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2 pt-4 text-xs font-medium text-foreground">Rs {formatCurrency(line.igstAmount)}</td>
                      <td className="px-2.5 py-2 pt-4 text-xs font-semibold text-primary">Rs {formatCurrency(line.lineTotalAmount)}</td>
                      <td className="px-2.5 py-2"><Input className="w-40" placeholder="-" {...register(`items.${idx}.remarks`)} /></td>
                      <td className="px-2.5 py-2 pt-3">
                        {fields.length > 1 ? (
                          <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => remove(idx)} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title="Signatories">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Prepared By</Label>
              <Input placeholder="Name" {...register('preparedBy')} />
            </div>
            <div className="space-y-1.5">
              <Label>Sanctioned By</Label>
              <Input placeholder="Name" {...register('sanctionedBy')} />
            </div>
            <div className="space-y-1.5">
              <Label>Authorized Signatory</Label>
              <Input placeholder="Name" {...register('authorizedSignatory')} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Review & Submit">
          <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-5">
            <div>
              <div>Taxable Value</div>
              <div className="text-base font-semibold text-foreground">Rs {formatCurrency(totals.taxableValue)}</div>
            </div>
            <div>
              <div>CGST</div>
              <div className="text-base font-semibold text-foreground">Rs {formatCurrency(totals.cgstAmount)}</div>
            </div>
            <div>
              <div>SGST</div>
              <div className="text-base font-semibold text-foreground">Rs {formatCurrency(totals.sgstAmount)}</div>
            </div>
            <div>
              <div>IGST</div>
              <div className="text-base font-semibold text-foreground">Rs {formatCurrency(totals.igstAmount)}</div>
            </div>
            <div>
              <div>Total Amount</div>
              <div className="text-base font-semibold text-primary">Rs {formatCurrency(totals.lineTotalAmount)}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Rates support up to 4 decimals. Tax amounts are calculated automatically from the taxable value.
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/purchases')}>Cancel</Button>
              <Button type="submit" className="rounded-xl" disabled={submitting || loadingOptions}>
                {submitting ? 'Saving...' : 'Save GIN'}
              </Button>
            </div>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
