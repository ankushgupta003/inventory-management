import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { purchaseSchema, type PurchaseFormValues } from '../schemas/purchaseSchema';
import { purchasesApi } from '../services/purchasesApi';

// TODO: Replace with API-fetched data
const vendors = [
  { id: '1', name: 'ABC Steel Suppliers' },
  { id: '2', name: 'PQR Trading Co.' },
  { id: '3', name: 'Shree Chemicals Ltd.' },
];

const availableItems = [
  { id: '1', name: 'Steel Rod 10mm', unit: 'kg' },
  { id: '2', name: 'Copper Wire 2mm', unit: 'kg' },
  { id: '3', name: 'Packing Box Large', unit: 'pcs' },
  { id: '4', name: 'Chemical Solvent A', unit: 'liter' },
];

const emptyRow = {
  itemId: '',
  batchNo: '',
  mfgDate: '',
  expiryDate: '',
  receivedQty: 0,
  acceptedQty: 0,
  rejectedQty: 0,
  rate: 0,
};

export default function GoodsInwardPage() {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      vendorId: '',
      date: new Date().toISOString().split('T')[0],
      challanNo: '',
      items: [{ ...emptyRow }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');

  const lineTotal = (idx: number) => {
    const row = watchedItems?.[idx];
    if (!row) return 0;
    return row.acceptedQty * row.rate;
  };

  const grandTotal = watchedItems?.reduce((sum, row) => sum + row.acceptedQty * row.rate, 0) ?? 0;

  const onSubmit = async (data: PurchaseFormValues) => {
    setSubmitting(true);
    try {
      await purchasesApi.create(data);
      toast.success('Goods Inward Note saved successfully');
      reset({
        vendorId: '',
        date: new Date().toISOString().split('T')[0],
        challanNo: '',
        items: [{ ...emptyRow }],
      });
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivedChange = (idx: number, val: number) => {
    setValue(`items.${idx}.receivedQty`, val);
    setValue(`items.${idx}.acceptedQty`, val);
    setValue(`items.${idx}.rejectedQty`, 0);
  };

  const handleAcceptedChange = (idx: number, val: number) => {
    const received = watchedItems[idx]?.receivedQty ?? 0;
    const accepted = Math.min(val, received);
    setValue(`items.${idx}.acceptedQty`, accepted);
    setValue(`items.${idx}.rejectedQty`, received - accepted);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <PackageCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Goods Inward Note</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header fields */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Vendor *</Label>
              <Select
                value={watch('vendorId')}
                onValueChange={(v) => setValue('vendorId', v, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.vendorId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={errors.date ? 'border-destructive' : ''} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Challan / Bill No *</Label>
              <Input
                placeholder="e.g. CH-2024-001"
                {...register('challanNo')}
                className={errors.challanNo ? 'border-destructive' : ''}
              />
              {errors.challanNo && <p className="text-xs text-destructive">{errors.challanNo.message}</p>}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyRow })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          {errors.items?.root && (
            <p className="text-xs text-destructive">{errors.items.root.message}</p>
          )}

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Item *</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Batch No *</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">MFG Date *</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Expiry *</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Received</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Accepted</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Rejected</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Rate (₹)</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const rowErrors = errors.items?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-3 py-2">
                        <Select
                          value={watchedItems[idx]?.itemId ?? ''}
                          onValueChange={(v) => setValue(`items.${idx}.itemId`, v, { shouldValidate: true })}
                        >
                          <SelectTrigger className={`w-44 ${rowErrors?.itemId ? 'border-destructive' : ''}`}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.name} ({it.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {rowErrors?.itemId && <p className="text-xs text-destructive mt-1">{rowErrors.itemId.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className={`w-28 ${rowErrors?.batchNo ? 'border-destructive' : ''}`}
                          placeholder="B-001"
                          {...register(`items.${idx}.batchNo`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="date"
                          className={`w-36 ${rowErrors?.mfgDate ? 'border-destructive' : ''}`}
                          {...register(`items.${idx}.mfgDate`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="date"
                          className={`w-36 ${rowErrors?.expiryDate ? 'border-destructive' : ''}`}
                          {...register(`items.${idx}.expiryDate`)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className={`w-20 ${rowErrors?.receivedQty ? 'border-destructive' : ''}`}
                          {...register(`items.${idx}.receivedQty`, { valueAsNumber: true })}
                          onChange={(e) => handleReceivedChange(idx, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className={`w-20 ${rowErrors?.acceptedQty ? 'border-destructive' : ''}`}
                          value={watchedItems[idx]?.acceptedQty ?? 0}
                          onChange={(e) => handleAcceptedChange(idx, Number(e.target.value))}
                        />
                        {rowErrors?.acceptedQty && <p className="text-xs text-destructive mt-1">{rowErrors.acceptedQty.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className="w-20 bg-muted/50"
                          value={watchedItems[idx]?.rejectedQty ?? 0}
                          readOnly
                          tabIndex={-1}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className={`w-24 ${rowErrors?.rate ? 'border-destructive' : ''}`}
                          {...register(`items.${idx}.rate`, { valueAsNumber: true })}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap pt-4">
                        ₹{lineTotal(idx).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 pt-3">
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

          <p className="text-xs text-muted-foreground">
            * Only <strong>Accepted Qty</strong> will be added to stock. Rejected items are recorded but excluded from inventory.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="text-lg font-semibold text-foreground">
            Total (Accepted): <span className="text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? 'Saving…' : 'Save Goods Inward Note'}
          </Button>
        </div>
      </form>
    </div>
  );
}
