import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { piSchema, type PIFormValues } from '../schemas/piSchema';
import { piApi } from '../services/piApi';
import { partiesApi } from '@/modules/parties/services/partiesApi';
import { itemsApi } from '@/modules/items/services/itemsApi';
import type { PartyRecord } from '@/modules/parties/types';
import type { ItemRecord } from '@/modules/items/types';

const createPiNo = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `PI-${datePart}-${rand}`;
};

const emptyRow = {
  itemId: '',
  itemName: '',
  quantity: 0,
  rate: 0,
  amount: 0,
  remarks: '',
};

export default function PICreatePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<PartyRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<PIFormValues>({
    resolver: zodResolver(piSchema),
    defaultValues: {
      piNo: createPiNo(),
      date: today,
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

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [partyData, itemData] = await Promise.all([
          partiesApi.getAll(),
          itemsApi.getAll(),
        ]);
        if (!active) return;
        setCustomers(partyData.filter((p) => p.partyType === 'customer' || p.partyType === 'both'));
        setItems(itemData.filter((i) => i.itemType === 'finished'));
      } catch {
        if (!active) return;
        setCustomers([]);
        setItems([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (data: PIFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        items: data.items.map((row) => ({
          ...row,
          amount: row.quantity * row.rate,
        })),
      };
      await piApi.create(payload);
      toast.success('Proforma Invoice created');
      navigate('/proforma-invoices');
    } catch {
      toast.error('Failed to create PI');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const totalQty = watchedItems?.reduce((s, r) => s + (r.quantity || 0), 0) ?? 0;
    const totalAmount = watchedItems?.reduce((s, r) => s + (r.quantity * r.rate || 0), 0) ?? 0;
    return { totalQty, totalAmount };
  }, [watchedItems]);

  const fieldClass = (err: unknown) => err ? 'border-destructive' : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Create Proforma Invoice</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Header</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>PI No</Label>
              <Input readOnly {...register('piNo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Customer *</Label>
              <Select value={watch('customerId')} onValueChange={(v) => setValue('customerId', v, { shouldValidate: true })}>
                <SelectTrigger className={fieldClass(errors.customerId)}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
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
                  {['Item *','Quantity *','Rate','Amount','Remarks',''].map((h) => (
                    <th key={h} className="text-left px-2.5 py-2.5 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const re = errors.items?.[idx];
                  const row = watchedItems?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-2.5 py-2">
                        <Select
                          value={row?.itemId ?? ''}
                          onValueChange={(v) => {
                            const item = items.find((i) => i.id === v);
                            setValue(`items.${idx}.itemId`, v, { shouldValidate: true });
                            setValue(`items.${idx}.itemName`, item?.storeName || item?.tallyName || item?.sku || '', { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className={`w-56 ${fieldClass(re?.itemId)}`}>
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
                        <Input type="number" className={`w-24 ${fieldClass(re?.quantity)}`} {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                        {re?.quantity && <p className="text-[10px] text-destructive mt-1">{re.quantity.message}</p>}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className="w-24" {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2 font-medium">
                        ₹{((row?.quantity ?? 0) * (row?.rate ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2.5 py-2">
                        <Textarea rows={1} className="w-40" {...register(`items.${idx}.remarks`)} />
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

        <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Total Qty: <span className="font-medium text-foreground">{totals.totalQty}</span>
          </div>
          <div className="text-lg font-semibold text-foreground">
            Total Amount: <span className="text-primary">₹{totals.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/proforma-invoices')}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save PI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
