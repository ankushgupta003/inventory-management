import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { itemsApi } from '@/modules/items/services/itemsApi';
import type { ItemRecord } from '@/modules/items/types';
import { productionBatchSchema, type ProductionBatchFormValues } from '../schemas/productionSchema';
import { productionApi } from '../services/productionApi';

export default function ProductionCreatePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProductionBatchFormValues>({
    resolver: zodResolver(productionBatchSchema),
    defaultValues: {
      itemId: '',
      batchNo: '',
      batchSize: '',
      mfgDate: '',
      expDate: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await itemsApi.getAll({ paginate: false, status: 'active', itemType: 'finished' });
        if (!active) return;
        setItems(data);
      } catch {
        if (!active) return;
        setItems([]);
      } finally {
        if (active) setLoadingItems(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  const onSubmit = async (values: ProductionBatchFormValues) => {
    setSubmitting(true);
    try {
      const created = await productionApi.create(values);
      toast.success('Batch created');
      navigate(`/production/${created.id}`);
    } catch {
      toast.error('Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err?: unknown) => (err ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Batch"
        description="Start a new production batch before recording MRS, movements, BMR, and QA."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Production Batches', href: '/production' },
          { label: 'Create Batch' },
        ]}
        action={(
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/production')}>
            Back to List
          </Button>
        )}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Batch Details" className="max-w-3xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Finished Item *</Label>
              <Select
                value={watch('itemId')}
                onValueChange={(value) => setValue('itemId', value, { shouldValidate: true })}
                disabled={loadingItems}
              >
                <SelectTrigger className={fieldClass(errors.itemId)}>
                  <SelectValue placeholder={loadingItems ? 'Loading items...' : 'Select finished item'} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && <p className="text-xs text-destructive">{errors.itemId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Batch No *</Label>
              <Input {...register('batchNo')} className={fieldClass(errors.batchNo)} />
              {errors.batchNo && <p className="text-xs text-destructive">{errors.batchNo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Batch Size *</Label>
              <Input {...register('batchSize')} className={fieldClass(errors.batchSize)} />
              {errors.batchSize && <p className="text-xs text-destructive">{errors.batchSize.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>MFG Date *</Label>
              <Input type="date" {...register('mfgDate')} className={fieldClass(errors.mfgDate)} />
              {errors.mfgDate && <p className="text-xs text-destructive">{errors.mfgDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>EXP Date *</Label>
              <Input type="date" {...register('expDate')} className={fieldClass(errors.expDate)} />
              {errors.expDate && <p className="text-xs text-destructive">{errors.expDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/production')}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={!isValid || submitting}>
              {submitting ? 'Saving...' : 'Save Batch'}
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
