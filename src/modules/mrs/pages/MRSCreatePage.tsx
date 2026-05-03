import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import TableActionButton from '@/components/TableActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailableItems } from '../hooks/useMRS';
import { mrsFormSchema, type MRSFormValues } from '../schemas/mrsSchema';
import { useProductionBatches } from '@/modules/production/hooks/useProductionBatches';
import { toast } from 'sonner';
import mrsApi from '../services/mrsApi';
import { useState } from 'react';

const departments = ['Production', 'Testing', 'Maintenance', 'Quality Control', 'Packaging'];

export default function MRSCreatePage() {
  const navigate = useNavigate();
  const { options: availableItems, loading: itemsLoading } = useAvailableItems();
  const { options: batchOptions, loading: batchLoading } = useProductionBatches();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MRSFormValues>({
    resolver: zodResolver(mrsFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      department: '',
      productionBatchId: '',
      productionBatchNo: '',
      productionNo: '',
      requisitionBy: '',
      items: [{ itemId: '', itemName: '', unit: '', qtyRequested: 0, remarks: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  const onItemSelect = (index: number, itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId);
    if (item) {
      form.setValue(`items.${index}.itemId`, item.id);
      form.setValue(`items.${index}.itemName`, item.name);
      form.setValue(`items.${index}.unit`, item.unit);
    }
  };

  const onBatchSelect = (batchId: string) => {
    const selected = batchOptions.find((opt) => opt.id === batchId);
    form.setValue('productionBatchId', batchId, { shouldValidate: true });
    form.setValue('productionBatchNo', selected?.batchNo || '');
    form.setValue('productionNo', selected?.productionNo || '');
  };

  const onSubmit = async (data: MRSFormValues) => {
    setSubmitting(true);
    try {
      const created = await mrsApi.create({
        productionBatchId: data.productionBatchId,
        date: data.date,
        department: data.department,
        requisitionBy: data.requisitionBy,
        items: data.items.map((item) => ({
          itemId: item.itemId,
          qtyRequested: item.qtyRequested,
          remarks: item.remarks,
        })),
      });
      toast.success('MRS created successfully');
      navigate(`/mrs/${created.id}`);
    } catch {
      toast.error('Failed to create MRS');
    } finally {
      setSubmitting(false);
    }
  };

  const watchedItems = form.watch('items');
  const selectedBatchId = form.watch('productionBatchId');
  const batchLabel = useMemo(() => {
    const selected = batchOptions.find((opt) => opt.id === selectedBatchId);
    if (!selected) return '';
    return `${selected.productionNo} | ${selected.batchNo} | ${selected.itemName}`;
  }, [batchOptions, selectedBatchId]);

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Material Requisition Slip"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/mrs' },
          { label: 'Create MRS' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/mrs')}>
            Back to List
          </Button>
        )}
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Header" description="Capture document metadata and production linkage.">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">MRS No</Label>
              <Input value="Auto-generated" disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...form.register('date')} />
              {form.formState.errors.date && (
                <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={form.watch('department')} onValueChange={(v) => form.setValue('department', v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.formState.errors.department && (
                <p className="text-xs text-destructive">{form.formState.errors.department.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Production Batch *</Label>
              <Select
                value={form.watch('productionBatchId')}
                onValueChange={onBatchSelect}
                disabled={batchLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={batchLoading ? 'Loading batches...' : 'Select production batch'} />
                </SelectTrigger>
                <SelectContent>
                  {batchOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.productionNo} | {opt.batchNo} | {opt.itemName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {batchLabel && (
                <p className="text-xs text-muted-foreground">Selected: {batchLabel}</p>
              )}
              {form.formState.errors.productionBatchId && (
                <p className="text-xs text-destructive">{form.formState.errors.productionBatchId.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Items"
          description="Requested quantities will drive remaining and issue tracking."
          actions={(
            <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: '', itemName: '', unit: '', qtyRequested: 0, remarks: '' })}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
            </Button>
          )}
        >
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-12">#</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Item</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Unit</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground w-32">Qty Requested</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Qty Issued</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground w-32">Remaining Qty</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Remarks</th>
                  <th className="px-3 py-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const row = watchedItems[index];
                  const requested = Number(row?.qtyRequested || 0);
                  const issued = 0;
                  const remaining = Math.max(0, requested - issued);
                  return (
                    <tr key={field.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2">
                        <Select value={form.watch(`items.${index}.itemId`)} onValueChange={(v) => onItemSelect(index, v)}>
                          <SelectTrigger className="w-full" disabled={itemsLoading}><SelectValue placeholder={itemsLoading ? 'Loading items...' : 'Select item'} /></SelectTrigger>
                          <SelectContent>
                            {availableItems.map((it) => <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.items?.[index]?.itemId && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.items[index]?.itemId?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input value={form.watch(`items.${index}.unit`)} disabled className="bg-muted w-20" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          {...form.register(`items.${index}.qtyRequested`, { valueAsNumber: true })}
                          className="w-28 text-right"
                          placeholder="0"
                        />
                        {form.formState.errors.items?.[index]?.qtyRequested && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.items[index]?.qtyRequested?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input value={issued} readOnly className="w-24 bg-muted text-right" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input value={remaining} readOnly className="w-28 bg-muted text-right" />
                      </td>
                      <td className="px-3 py-2">
                        <Input {...form.register(`items.${index}.remarks`)} placeholder="Optional" />
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <TableActionButton label="Remove Row" icon={Trash2} tone="rose" onClick={() => remove(index)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FormSection>

        <FormSection title="Signatories" description="Requester details used for approvals and issue tracking.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Requisition By *</Label>
              <Input {...form.register('requisitionBy')} placeholder="Name of requisitioner" />
              {form.formState.errors.requisitionBy && (
                <p className="text-xs text-destructive">{form.formState.errors.requisitionBy.message}</p>
              )}
            </div>
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/mrs')}>Cancel</Button>
          <Button type="submit" className="rounded-xl" disabled={submitting}>{submitting ? 'Saving...' : 'Submit MRS'}</Button>
        </div>
      </form>
    </div>
  );
}
