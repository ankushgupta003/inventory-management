import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { itemsApi } from '@/modules/items/services/itemsApi';
import type { ItemRecord } from '@/modules/items/types';
import { useInvoiceStock } from '@/modules/invoices/hooks/useInvoiceStock';
import { partiesApi } from '@/modules/parties/services/partiesApi';
import type { PartyRecord } from '@/modules/parties/types';
import { piSchema, type PIFormValues } from '../schemas/piSchema';
import { piApi } from '../services/piApi';
import type { ProformaInvoiceRecord } from '../types';

const emptyRow = {
  id: undefined,
  itemId: '',
  itemName: '',
  unit: '',
  quantity: 0,
  rate: 0,
  remarks: '',
};

export default function PICreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [customers, setCustomers] = useState<PartyRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [record, setRecord] = useState<ProformaInvoiceRecord | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { batchesByItemId, loading: loadingStock } = useInvoiceStock();

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<PIFormValues>({
    resolver: zodResolver(piSchema),
    defaultValues: {
      date: today,
      customerId: '',
      items: [{ ...emptyRow }],
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedCustomer = customers.find((customer) => customer.id === watch('customerId')) ?? null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [partyData, itemData, existingRecord] = await Promise.all([
          partiesApi.getAll({ paginate: false, status: 'active', partyType: 'all' }),
          itemsApi.getAll({ paginate: false, status: 'active', itemType: 'finished' }),
          isEditMode && id ? piApi.getById(id) : Promise.resolve(null),
        ]);

        if (!active) return;

        const nextCustomers = partyData.filter((party) => party.partyType === 'customer' || party.partyType === 'both');
        setCustomers(nextCustomers);
        setItems(itemData);
        setRecord(existingRecord);

        if (existingRecord) {
          reset({
            date: existingRecord.date,
            customerId: existingRecord.customerId,
            items: existingRecord.items.map((item) => ({
              id: item.id,
              itemId: item.itemId,
              itemName: item.itemName,
              unit: item.unit,
              quantity: item.quantity,
              rate: item.rate,
              remarks: item.remarks ?? '',
            })),
          });
        } else {
          reset({
            date: today,
            customerId: '',
            items: [{ ...emptyRow }],
          });
        }
      } catch {
        if (!active) return;
        toast.error(isEditMode ? 'Failed to load PI for editing' : 'Failed to load PI form data');
        if (isEditMode) {
          navigate('/proforma-invoices');
        }
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id, isEditMode, navigate, reset, today]);

  const onSubmit = async (data: PIFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        date: data.date,
        customerId: data.customerId,
        items: data.items.map((row) => ({
          id: row.id,
          itemId: row.itemId,
          quantity: row.quantity,
          rate: row.rate,
          remarks: row.remarks?.trim() || undefined,
        })),
      };

      const saved = isEditMode && id
        ? await piApi.update(id, payload)
        : await piApi.create(payload);

      toast.success(isEditMode ? 'Proforma invoice updated' : 'Proforma invoice created');
      navigate(isEditMode ? `/proforma-invoices/${saved.id}` : '/proforma-invoices');
    } catch {
      toast.error(isEditMode ? 'Failed to update PI' : 'Failed to create PI');
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    const totalQty = watchedItems.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalAmount = watchedItems.reduce((sum, row) => sum + ((row.quantity || 0) * (row.rate || 0)), 0);
    return { totalQty, totalAmount };
  }, [watchedItems]);

  const fieldClass = (error: unknown) => (error ? 'border-destructive' : '');

  if (bootstrapping) {
    return <p className="text-sm text-muted-foreground">Loading PI form...</p>;
  }

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title={isEditMode ? 'Edit Proforma Invoice' : 'Create Proforma Invoice'}
        description={isEditMode ? 'Update the PI before any invoicing has started.' : 'Prepare customer-wise PI lines for downstream invoicing.'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/proforma-invoices' },
          { label: isEditMode ? 'Edit PI' : 'Create PI' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate(isEditMode && id ? `/proforma-invoices/${id}` : '/proforma-invoices')}>
            {isEditMode ? 'Back to PI' : 'Back to List'}
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Header">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>PI No</Label>
              <Input readOnly value={record?.piNo ?? 'Auto-generated on save'} className="bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} className={fieldClass(errors.date)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Customer *</Label>
              <Select value={watch('customerId')} onValueChange={(value) => setValue('customerId', value, { shouldValidate: true })}>
                <SelectTrigger className={fieldClass(errors.customerId)}>
                  <SelectValue placeholder="Select active customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId ? <p className="text-xs text-destructive">{errors.customerId.message}</p> : null}
              {selectedCustomer ? (
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.contactPerson ? `${selectedCustomer.contactPerson} · ` : ''}
                  {[selectedCustomer.address1, selectedCustomer.address2, selectedCustomer.city, selectedCustomer.state, selectedCustomer.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Items"
          description="Use active finished items only. Available finished-goods stock is shown as a reference while drafting the PI."
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
                  {['Item *', 'Unit', 'Available Qty', 'Quantity *', 'Rate', 'Amount', 'Remarks', ''].map((header) => (
                    <th key={header} className="whitespace-nowrap px-2.5 py-2.5 text-left text-xs font-medium text-muted-foreground">
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
                  const availableQty = batches.reduce((sum, batch) => sum + batch.availableQty, 0);

                  return (
                    <tr key={field.id} className="border-b border-border align-top last:border-0">
                      <td className="px-2.5 py-2">
                        <Select
                          value={row?.itemId ?? ''}
                          onValueChange={(value) => {
                            const selectedItem = items.find((item) => item.id === value);
                            setValue(`items.${index}.itemId`, value, { shouldValidate: true });
                            setValue(`items.${index}.itemName`, selectedItem?.storeName || '', { shouldValidate: false });
                            setValue(`items.${index}.unit`, selectedItem?.baseUnit || '', { shouldValidate: false });
                          }}
                        >
                          <SelectTrigger className={`w-56 ${fieldClass(rowErrors?.itemId)}`}>
                            <SelectValue placeholder="Select finished item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.storeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {rowErrors?.itemId ? <p className="mt-1 text-[11px] text-destructive">{rowErrors.itemId.message}</p> : null}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input readOnly value={row?.unit ?? ''} className="w-24 bg-muted/40" />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input
                          readOnly
                          value={row?.itemId ? (loadingStock ? 'Loading...' : availableQty) : ''}
                          className="w-28 bg-muted/40"
                        />
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-24 ${fieldClass(rowErrors?.quantity)}`} {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                        {rowErrors?.quantity ? <p className="mt-1 text-[11px] text-destructive">{rowErrors.quantity.message}</p> : null}
                      </td>
                      <td className="px-2.5 py-2">
                        <Input type="number" className={`w-24 ${fieldClass(rowErrors?.rate)}`} {...register(`items.${index}.rate`, { valueAsNumber: true })} />
                      </td>
                      <td className="px-2.5 py-2 font-medium">
                        Rs {(((row?.quantity ?? 0) * (row?.rate ?? 0)) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-2.5 py-2">
                        <Textarea rows={1} className="w-44" {...register(`items.${index}.remarks`)} />
                      </td>
                      <td className="px-2.5 py-2 pt-3">
                        {fields.length > 1 ? (
                          <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => remove(index)} />
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
              Total Qty: <span className="font-medium text-foreground">{totals.totalQty.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-lg font-semibold text-foreground">
              Total Amount: <span className="text-primary">Rs {totals.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(isEditMode && id ? `/proforma-invoices/${id}` : '/proforma-invoices')}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={submitting}>
            {submitting ? 'Saving...' : isEditMode ? 'Update PI' : 'Save PI'}
          </Button>
        </div>
      </form>
    </div>
  );
}
