import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ginSchema, type GINFormValues } from '../schemas/purchaseSchema';
import { purchasesApi } from '../services/purchasesApi';

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
  itemId: '', ulpQty: 0, billQty: 0, receivedQty: 0, acceptedQty: 0,
  rejectedQty: 0, batchNo: '', mfgDate: '', expiryDate: '', rate: 0, remarks: '',
};

export default function GoodsInwardPage() {
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const {
    register, control, handleSubmit, setValue, watch, reset,
    formState: { errors },
  } = useForm<GINFormValues>({
    resolver: zodResolver(ginSchema),
    defaultValues: {
      vendorId: '', challanNo: '', challanDate: today, billNo: '', billDate: today,
      gateEntryNo: '', entryDate: today, items: [{ ...emptyRow }],
      preparedBy: '', sanctionedBy: '', authorizedSignatory: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const lineValue = (idx: number) => {
    const r = watchedItems?.[idx];
    return r ? r.acceptedQty * r.rate : 0;
  };
  const grandTotal = watchedItems?.reduce((s, r) => s + r.acceptedQty * r.rate, 0) ?? 0;

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

  const onSubmit = async (data: GINFormValues) => {
    setSubmitting(true);
    try {
      await purchasesApi.create(data);
      toast.success('Goods Inward Note saved successfully');
      reset();
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <PackageCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Goods Inward Note (GIN)</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Header ── */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Header Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label>Vendor Name *</Label>
              <Select value={watch('vendorId')} onValueChange={(v) => setValue('vendorId', v, { shouldValidate: true })}>
                <SelectTrigger className={fieldClass(errors.vendorId)}>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Challan No *</Label>
              <Input placeholder="CH-001" {...register('challanNo')} className={fieldClass(errors.challanNo)} />
              {errors.challanNo && <p className="text-xs text-destructive">{errors.challanNo.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Challan Date *</Label>
              <Input type="date" {...register('challanDate')} className={fieldClass(errors.challanDate)} />
            </div>

            <div className="space-y-1.5">
              <Label>Bill No *</Label>
              <Input placeholder="BILL-001" {...register('billNo')} className={fieldClass(errors.billNo)} />
              {errors.billNo && <p className="text-xs text-destructive">{errors.billNo.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Bill Date *</Label>
              <Input type="date" {...register('billDate')} className={fieldClass(errors.billDate)} />
            </div>

            <div className="space-y-1.5">
              <Label>Gate Entry No *</Label>
              <Input placeholder="GE-001" {...register('gateEntryNo')} className={fieldClass(errors.gateEntryNo)} />
              {errors.gateEntryNo && <p className="text-xs text-destructive">{errors.gateEntryNo.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Entry Date *</Label>
              <Input type="date" {...register('entryDate')} className={fieldClass(errors.entryDate)} />
            </div>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyRow })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Item *','ULP Qty','Bill Qty','Received','Accepted','Rejected','Batch *','MFG Date *','Expiry *','Rate (₹)','Value','Remarks',''].map((h) => (
                    <th key={h} className="text-left px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const re = errors.items?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-2.5 py-2">
                        <Select value={watchedItems[idx]?.itemId ?? ''} onValueChange={(v) => setValue(`items.${idx}.itemId`, v, { shouldValidate: true })}>
                          <SelectTrigger className={`w-40 ${fieldClass(re?.itemId)}`}><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{availableItems.map((it) => <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-2"><Input type="number" className="w-[72px]" {...register(`items.${idx}.ulpQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2"><Input type="number" className="w-[72px]" {...register(`items.${idx}.billQty`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-[72px] ${fieldClass(re?.receivedQty)}`}
                          {...register(`items.${idx}.receivedQty`, { valueAsNumber: true })}
                          onChange={(e) => handleReceivedChange(idx, Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-[72px] ${fieldClass(re?.acceptedQty)}`}
                          value={watchedItems[idx]?.acceptedQty ?? 0}
                          onChange={(e) => handleAcceptedChange(idx, Number(e.target.value))}
                        />
                        {re?.acceptedQty && <p className="text-[10px] text-destructive mt-0.5 w-20">{re.acceptedQty.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className="w-[72px] bg-muted/50" value={watchedItems[idx]?.rejectedQty ?? 0} readOnly tabIndex={-1} />
                      </td>
                      <td className="px-2.5 py-2"><Input className={`w-24 ${fieldClass(re?.batchNo)}`} placeholder="B-001" {...register(`items.${idx}.batchNo`)} /></td>
                      <td className="px-2.5 py-2"><Input type="date" className={`w-[130px] ${fieldClass(re?.mfgDate)}`} {...register(`items.${idx}.mfgDate`)} /></td>
                      <td className="px-2.5 py-2"><Input type="date" className={`w-[130px] ${fieldClass(re?.expiryDate)}`} {...register(`items.${idx}.expiryDate`)} /></td>
                      <td className="px-2.5 py-2"><Input type="number" className={`w-20 ${fieldClass(re?.rate)}`} {...register(`items.${idx}.rate`, { valueAsNumber: true })} /></td>
                      <td className="px-2.5 py-2 font-medium text-foreground whitespace-nowrap pt-4 text-xs">₹{lineValue(idx).toLocaleString('en-IN')}</td>
                      <td className="px-2.5 py-2"><Input className="w-24" placeholder="—" {...register(`items.${idx}.remarks`)} /></td>
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
          <p className="text-xs text-muted-foreground">* Only <strong>Accepted Qty</strong> adds to stock. Rejected items are recorded but excluded.</p>
        </div>

        {/* ── Footer / Signatories ── */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Signatories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

        {/* ── Submit ── */}
        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="text-lg font-semibold text-foreground">
            Total (Accepted): <span className="text-primary">₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? 'Saving…' : 'Save GIN'}
          </Button>
        </div>
      </form>
    </div>
  );
}
