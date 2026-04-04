import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productionSchema, type ProductionFormValues } from '../schemas/productionSchema';
import { productionApi } from '../services/productionApi';
import { ledgerApi } from '@/modules/ledger/services/ledgerApi';
import { useProductionStock } from '../hooks/useProductionStock';

const createProductionNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `PRD-${datePart}-${rand}`;
};

const emptyOutput = {
  itemId: '',
  itemName: '',
  batchNo: '',
  mfgDate: '',
  expiryDate: '',
  qtyProduced: 0,
};

const emptyInput = {
  itemId: '',
  itemName: '',
  batchNo: '',
  availableQty: 0,
  qtyUsed: 0,
};

export default function ProductionCreatePage() {
  const [submitting, setSubmitting] = useState(false);
  const { items, itemNameById, batchesByItemName } = useProductionStock();

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      productionNo: createProductionNo(),
      date: today,
      outputs: [{ ...emptyOutput }],
      inputs: [],
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

  const outputArray = useFieldArray({ control, name: 'outputs' });
  const inputArray = useFieldArray({ control, name: 'inputs' });

  const outputs = watch('outputs');
  const inputs = watch('inputs');

  const finishedItems = items.filter((i) => i.itemType === 'finished');
  const rawItems = items.filter((i) => i.itemType === 'raw');

  const handleOutputItem = (index: number, itemId: string) => {
    const itemName = itemNameById.get(itemId) ?? '';
    setValue(`outputs.${index}.itemId`, itemId, { shouldValidate: true });
    setValue(`outputs.${index}.itemName`, itemName, { shouldValidate: true });
  };

  const handleInputItem = (index: number, itemId: string) => {
    const itemName = itemNameById.get(itemId) ?? '';
    setValue(`inputs.${index}.itemId`, itemId, { shouldValidate: true });
    setValue(`inputs.${index}.itemName`, itemName, { shouldValidate: true });
    setValue(`inputs.${index}.batchNo`, '');
    setValue(`inputs.${index}.availableQty`, 0);
    setValue(`inputs.${index}.qtyUsed`, 0);
  };

  const handleInputBatch = (index: number, batchNo: string) => {
    const itemName = inputs?.[index]?.itemName ?? '';
    const batches = batchesByItemName.get(itemName) ?? [];
    const batch = batches.find((b) => b.batchNo === batchNo);
    setValue(`inputs.${index}.batchNo`, batchNo, { shouldValidate: true });
    setValue(`inputs.${index}.availableQty`, batch?.availableQty ?? 0, { shouldValidate: true });
  };

  const onSubmit = async (data: ProductionFormValues) => {
    setSubmitting(true);
    try {
      const created = await productionApi.create(data);
      const ledgerEntries = [
        ...data.outputs.map((row) => {
          const item = items.find((it) => it.id === row.itemId);
          const itemCategory = item?.itemType === 'finished' ? 'FINISHED' : 'RAW';
          return {
            date: data.date,
            referenceNo: data.productionNo,
            type: 'production',
            particulars: 'Finished Goods',
            itemName: row.itemName,
            itemCategory,
            batchNo: row.batchNo,
            mfgDate: row.mfgDate,
            expiryDate: row.expiryDate,
            receiptQty: row.qtyProduced,
            issueQty: 0,
            rate: 0,
            remarks: '',
          };
        }),
        ...(data.inputs ?? []).map((row) => {
          const item = items.find((it) => it.id === row.itemId);
          const itemCategory = item?.itemType === 'finished' ? 'FINISHED' : 'RAW';
          return {
            date: data.date,
            referenceNo: data.productionNo,
            type: 'production',
            particulars: 'Raw Material Consumption',
            itemName: row.itemName,
            itemCategory,
            batchNo: row.batchNo,
            mfgDate: '',
            expiryDate: '',
            receiptQty: 0,
            issueQty: row.qtyUsed,
            rate: 0,
            remarks: '',
          };
        }),
      ];
      try {
        await ledgerApi.create({ entries: ledgerEntries });
        toast.success('Production entry saved');
      } catch {
        toast.error('Production saved, but ledger update failed. Please retry ledger sync.');
      }
      form.reset({
        productionNo: createProductionNo(),
        date: today,
        outputs: [{ ...emptyOutput }],
        inputs: [],
      });
    } catch {
      toast.error('Failed to save production entry');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Factory className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Production Entry</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Header</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Production No</Label>
              <Input readOnly {...register('productionNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Output (Finished Goods)</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => outputArray.append({ ...emptyOutput })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {['Finished Item *','Batch No *','MFG Date *','Expiry Date *','Qty Produced *',''].map((h) => (
                    <th key={h} className="text-left px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outputArray.fields.map((field, idx) => {
                  const re = errors.outputs?.[idx];
                  const row = outputs?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-2.5 py-2">
                        <Select value={row?.itemId ?? ''} onValueChange={(v) => handleOutputItem(idx, v)}>
                          <SelectTrigger className={`w-56 ${fieldClass(re?.itemId)}`}>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {finishedItems.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.storeName || it.tallyName || it.sku}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {re?.itemId && <p className="text-[10px] text-destructive mt-1">{re.itemId.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input className={`w-32 ${fieldClass(re?.batchNo)}`} {...register(`outputs.${idx}.batchNo`)} placeholder="FG-2026-001" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="date" className={`w-[135px] ${fieldClass(re?.mfgDate)}`} {...register(`outputs.${idx}.mfgDate`)} />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="date" className={`w-[135px] ${fieldClass(re?.expiryDate)}`} {...register(`outputs.${idx}.expiryDate`)} />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-28 ${fieldClass(re?.qtyProduced)}`} {...register(`outputs.${idx}.qtyProduced`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2 pt-3">
                        {outputArray.fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => outputArray.remove(idx)}>
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

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Input (Raw Materials)</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => inputArray.append({ ...emptyInput })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          </div>

          {inputArray.fields.length === 0 && (
            <p className="text-xs text-muted-foreground">Optional. Add raw material consumption if required.</p>
          )}

          {inputArray.fields.length > 0 && (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    {['Raw Material Item *','Batch *','Available Qty','Qty Used *',''].map((h) => (
                      <th key={h} className="text-left px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inputArray.fields.map((field, idx) => {
                    const re = errors.inputs?.[idx];
                    const row = inputs?.[idx];
                    const itemName = row?.itemName ?? '';
                    const batches = itemName ? (batchesByItemName.get(itemName) ?? []) : [];
                    return (
                      <tr key={field.id} className="border-b border-border last:border-0 align-top">
                        <td className="px-2.5 py-2">
                          <Select value={row?.itemId ?? ''} onValueChange={(v) => handleInputItem(idx, v)}>
                            <SelectTrigger className={`w-56 ${fieldClass(re?.itemId)}`}>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {rawItems.map((it) => (
                                <SelectItem key={it.id} value={it.id}>
                                  {it.storeName || it.tallyName || it.sku}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {re?.itemId && <p className="text-[10px] text-destructive mt-1">{re.itemId.message}</p>}
                        </td>
                        <td className="px-2.5 py-2">
                          <Select value={row?.batchNo ?? ''} onValueChange={(v) => handleInputBatch(idx, v)} disabled={!row?.itemName}>
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
                          <Input readOnly value={row?.availableQty ?? 0} className="w-24 bg-muted/50" />
                        </td>
                        <td className="px-2.5 py-2">
                          <Input type="number" className={`w-24 ${fieldClass(re?.qtyUsed)}`} {...register(`inputs.${idx}.qtyUsed`, { valueAsNumber: true })} />
                          {re?.qtyUsed && <p className="text-[10px] text-destructive mt-1">{re.qtyUsed.message}</p>}
                        </td>
                        <td className="px-2.5 py-2 pt-3">
                          <Button type="button" variant="ghost" size="sm" onClick={() => inputArray.remove(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Finished goods add to stock. Raw material rows will be deducted from stock.
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Production'}
          </Button>
        </div>
      </form>
    </div>
  );
}
