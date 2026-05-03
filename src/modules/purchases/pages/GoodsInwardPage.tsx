import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import TableActionButton from '@/components/TableActionButton';
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
  remarks: '',
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

  const lineValue = (idx: number) => {
    const row = watchedItems?.[idx];
    return row ? row.acceptedQty * row.rate : 0;
  };

  const grandTotal = watchedItems?.reduce((sum, row) => sum + row.acceptedQty * row.rate, 0) ?? 0;

  const handleReceivedChange = (idx: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    setValue(`items.${idx}.receivedQty`, safeValue, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.acceptedQty`, safeValue, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.rejectedQty`, 0, { shouldDirty: true, shouldValidate: true });
  };

  const handleAcceptedChange = (idx: number, value: number) => {
    const received = watchedItems[idx]?.receivedQty ?? 0;
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const accepted = Math.min(safeValue, received);
    setValue(`items.${idx}.acceptedQty`, accepted, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${idx}.rejectedQty`, received - accepted, { shouldDirty: true, shouldValidate: true });
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
        description="Capture inbound purchase receipts with accepted/rejected stock split."
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
          description="Only accepted quantity contributes to stock."
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
                  {['Item *', 'ULP Qty', 'Bill Qty', 'Received', 'Accepted', 'Rejected', 'Batch *', 'MFG Date *', 'Expiry *', 'Rate (Rs)', 'Value', 'Remarks', ''].map((header) => (
                    <th key={header} className="whitespace-nowrap px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const rowErrors = errors.items?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border align-top last:border-0">
                      <td className="px-2.5 py-2">
                        <Select
                          value={watchedItems[idx]?.itemId ?? ''}
                          onValueChange={(value) => setValue(`items.${idx}.itemId`, value, { shouldDirty: true, shouldValidate: true })}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger className={`w-44 ${fieldClass(rowErrors?.itemId)}`}>
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
                      <td className="px-2.5 py-2"><Input type="number" className="w-[72px]" {...register(`items.${idx}.ulpQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2"><Input type="number" className="w-[72px]" {...register(`items.${idx}.billQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          className={`w-[72px] ${fieldClass(rowErrors?.receivedQty)}`}
                          {...register(`items.${idx}.receivedQty`, { valueAsNumber: true })}
                          onChange={(event) => handleReceivedChange(idx, Number(event.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          type="number"
                          className={`w-[72px] ${fieldClass(rowErrors?.acceptedQty)}`}
                          value={watchedItems[idx]?.acceptedQty ?? 0}
                          onChange={(event) => handleAcceptedChange(idx, Number(event.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2"><Input type="number" className="w-[72px] bg-muted/50" value={watchedItems[idx]?.rejectedQty ?? 0} readOnly tabIndex={-1} /></td>
                      <td className="px-2.5 py-2"><Input className={`w-24 ${fieldClass(rowErrors?.batchNo)}`} placeholder="B-001" {...register(`items.${idx}.batchNo`)} /></td>
                      <td className="px-2.5 py-2"><Input type="date" className={`w-[130px] ${fieldClass(rowErrors?.mfgDate)}`} {...register(`items.${idx}.mfgDate`)} /></td>
                      <td className="px-2.5 py-2"><Input type="date" className={`w-[130px] ${fieldClass(rowErrors?.expiryDate)}`} {...register(`items.${idx}.expiryDate`)} /></td>
                      <td className="px-2.5 py-2"><Input type="number" className={`w-20 ${fieldClass(rowErrors?.rate)}`} {...register(`items.${idx}.rate`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2 pt-4 text-xs font-medium text-foreground">Rs {lineValue(idx).toLocaleString('en-IN')}</td>
                      <td className="px-2.5 py-2"><Input className="w-24" placeholder="-" {...register(`items.${idx}.remarks`)} /></td>
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
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold text-foreground">
              Total (Accepted): <span className="text-primary">Rs {grandTotal.toLocaleString('en-IN')}</span>
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
