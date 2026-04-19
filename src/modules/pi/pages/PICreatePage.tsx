import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
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
      toast.success('Proforma invoice created');
      navigate('/proforma-invoices');
    } catch {
      toast.error('Failed to create PI');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const totalQty = watchedItems?.reduce((sum, row) => sum + (row.quantity || 0), 0) ?? 0;
    const totalAmount = watchedItems?.reduce((sum, row) => sum + (row.quantity * row.rate || 0), 0) ?? 0;
    return { totalQty, totalAmount };
  }, [watchedItems]);

  const fieldClass = (err: unknown) => (err ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Proforma Invoice"
        description="Prepare customer-wise PI lines for downstream invoicing."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/proforma-invoices' },
          { label: 'Create PI' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/proforma-invoices')}>
            Back to List
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Header">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId ? <p className="text-xs text-destructive">{errors.customerId.message}</p> : null}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Items"
          actions={(
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyRow })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          )}
        >
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Item *', 'Quantity *', 'Rate', 'Amount', 'Remarks', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => {
                  const rowErrors = errors.items?.[idx];
                  const row = watchedItems?.[idx];
                  return (
                    <tr key={field.id} className="border-b border-border align-top last:border-0">
                      <td className="px-2.5 py-2">
                        <Select
                          value={row?.itemId ?? ''}
                          onValueChange={(v) => {
                            const item = items.find((i) => i.id === v);
                            setValue(`items.${idx}.itemId`, v, { shouldValidate: true });
                            setValue(`items.${idx}.itemName`, item?.storeName || item?.tallyName || item?.sku || '', { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className={`w-56 ${fieldClass(rowErrors?.itemId)}`}>
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
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-24 ${fieldClass(rowErrors?.quantity)}`} {...register(`items.${idx}.quantity`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className="w-24" {...register(`items.${idx}.rate`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2 font-medium">Rs {((row?.quantity ?? 0) * (row?.rate ?? 0)).toLocaleString('en-IN')}</td>
                      <td className="px-2.5 py-2">
                        <Textarea rows={1} className="w-40" {...register(`items.${idx}.remarks`)} />
                      </td>
                      <td className="px-2.5 py-2 pt-3">
                        {fields.length > 1 ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

        <FormSection title="Totals">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Total Qty: <span className="font-medium text-foreground">{totals.totalQty}</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              Total Amount: <span className="text-primary">Rs {totals.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/proforma-invoices')}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save PI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
