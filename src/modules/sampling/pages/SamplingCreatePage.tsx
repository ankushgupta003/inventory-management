import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import TableActionButton from '@/components/TableActionButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { samplingSchema, type SamplingFormValues } from '../schemas/samplingSchema';
import { samplingApi } from '../services/samplingApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { useSamplingStock } from '../hooks/useSamplingStock';

const createSamplingNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `SMP-${datePart}-${rand}`;
};

const emptyRow = {
  itemId: '',
  itemName: '',
  batchNo: '',
  manufacturedBy: '',
  mfgDate: '',
  expiryDate: '',
  availableQty: 0,
  sampleQty: 0,
};

export default function SamplingCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { items, itemNameById, batchesByItemName } = useSamplingStock();

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<SamplingFormValues>({
    resolver: zodResolver(samplingSchema),
    defaultValues: {
      samplingNo: createSamplingNo(),
      date: today,
      fromStore: 'Main Store',
      toDepartment: 'QC',
      items: [{ ...emptyRow }],
      issuedBy: '',
      sampleDrawnBy: '',
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

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const handleItemChange = (index: number, itemId: string) => {
    const itemName = itemNameById.get(itemId) ?? '';
    setValue(`items.${index}.itemId`, itemId, { shouldValidate: true });
    setValue(`items.${index}.itemName`, itemName, { shouldValidate: true });
    setValue(`items.${index}.batchNo`, '');
    setValue(`items.${index}.availableQty`, 0);
    setValue(`items.${index}.mfgDate`, '');
    setValue(`items.${index}.expiryDate`, '');
    setValue(`items.${index}.manufacturedBy`, '');
  };

  const handleBatchChange = (index: number, batchNo: string) => {
    const itemName = watchedItems?.[index]?.itemName ?? '';
    const batches = batchesByItemName.get(itemName) ?? [];
    const batch = batches.find((b) => b.batchNo === batchNo);
    setValue(`items.${index}.batchNo`, batchNo, { shouldValidate: true });
    setValue(`items.${index}.availableQty`, batch?.availableQty ?? 0, { shouldValidate: true });
    setValue(`items.${index}.mfgDate`, batch?.mfgDate ?? '', { shouldValidate: true });
    setValue(`items.${index}.expiryDate`, batch?.expiryDate ?? '', { shouldValidate: true });
    setValue(`items.${index}.manufacturedBy`, batch?.manufacturedBy ?? '', { shouldValidate: true });
  };

  const onSubmit = async (data: SamplingFormValues) => {
    setSubmitting(true);
    try {
      const created = await samplingApi.create(data);
      const entries = data.items.map((row) => ({
        date: data.date,
        referenceNo: data.samplingNo,
        type: 'sampling',
        particulars: data.toDepartment,
        itemName: row.itemName,
        itemCategory: 'RAW',
        batchNo: row.batchNo,
        mfgDate: row.mfgDate,
        expiryDate: row.expiryDate,
        receiptQty: 0,
        issueQty: row.sampleQty,
        rate: 0,
        remarks: 'Sampling',
      }));
      try {
        await ledgerApi.create({ entries });
        toast.success('Sampling advice saved');
      } catch {
        toast.error('Sampling saved, but ledger update failed. Please retry ledger sync.');
      }
      navigate(`/sampling/${created.id}`);
    } catch {
      toast.error('Failed to save sampling advice');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <TestTube2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Create Sampling Advice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Header</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Sampling No</Label>
              <Input readOnly {...register('samplingNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5">
              <Label>From (Store) *</Label>
              <Input {...register('fromStore')} className={fieldClass(errors.fromStore)} />
            </div>
            <div className="space-y-1.5">
              <Label>To (QC Department) *</Label>
              <Input {...register('toDepartment')} className={fieldClass(errors.toDepartment)} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyRow })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Item Name *','Batch No *','Manufactured By','MFG Date','Expiry Date','Available Qty','Sample Qty *',''].map((h) => (
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
                      <td className="px-2.5 py-2">
                        <Select value={row?.itemId ?? ''} onValueChange={(v) => handleItemChange(idx, v)}>
                          <SelectTrigger className={`w-52 ${fieldClass(re?.itemId)}`}>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.storeName || it.tallyName || it.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {re?.itemId && <p className="text-[10px] text-destructive mt-1">{re.itemId.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Select value={row?.batchNo ?? ''} onValueChange={(v) => handleBatchChange(idx, v)} disabled={!row?.itemName}>
                          <SelectTrigger className={`w-40 ${fieldClass(re?.batchNo)}`}>
                            <SelectValue placeholder={row?.itemName ? 'Select batch' : 'Select item first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {batches.map((b) => (
                              <SelectItem key={b.batchNo} value={b.batchNo}>
                                {b.batchNo} (Avail: {b.availableQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {re?.batchNo && <p className="text-[10px] text-destructive mt-1">{re.batchNo.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.manufacturedBy ?? ''} className="w-40 bg-muted/50" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.mfgDate ?? ''} className="w-[130px] bg-muted/50" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.expiryDate ?? ''} className="w-[130px] bg-muted/50" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.availableQty ?? 0} className="w-24 bg-muted/50" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-24 ${fieldClass(re?.sampleQty)}`} {...register(`items.${idx}.sampleQty`, { valueAsNumber: true })} />
                        {re?.sampleQty && <p className="text-[10px] text-destructive mt-1">{re.sampleQty.message}</p>}
                      </td>
                      <td className="px-2.5 py-2 pt-3">
                        {fields.length > 1 && (
                          <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => remove(idx)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Footer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Issued By *</Label>
              <Input {...register('issuedBy')} className={fieldClass(errors.issuedBy)} />
              {errors.issuedBy && <p className="text-xs text-destructive">{errors.issuedBy.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Sample Drawn By *</Label>
              <Input {...register('sampleDrawnBy')} className={fieldClass(errors.sampleDrawnBy)} />
              {errors.sampleDrawnBy && <p className="text-xs text-destructive">{errors.sampleDrawnBy.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Stock will be reduced and a sampling ledger entry will be created.
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/sampling')}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Sampling'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
