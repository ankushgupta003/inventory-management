import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import PageHeader from '@/components/PageHeader';
import FormSection from '@/components/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addBatch } from '../productionStore';
import type { ProductionBatch } from '../types';

const batchSchema = z.object({
  productName: z.string().min(1, 'Product is required'),
  batchNo: z.string().min(1, 'Batch no is required'),
  batchSize: z.string().min(1, 'Batch size is required'),
  mfgDate: z.string().min(1, 'MFG date is required'),
  expDate: z.string().min(1, 'EXP date is required'),
});

type BatchFormValues = z.infer<typeof batchSchema>;

const createBatchId = () => `batch-${Date.now()}`;

export default function ProductionCreatePage() {
  const navigate = useNavigate();
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      productName: '',
      batchNo: '',
      batchSize: '',
      mfgDate: '',
      expDate: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const onSubmit = (values: BatchFormValues) => {
    const newBatch: ProductionBatch = {
      id: createBatchId(),
      batchNo: values.batchNo,
      productName: values.productName,
      batchSize: values.batchSize,
      status: 'DRAFT',
      startDate: values.mfgDate,
      mfgDate: values.mfgDate,
      expDate: values.expDate,
    };
    addBatch(newBatch);
    toast.success('Batch created');
    navigate(`/production/${newBatch.id}`);
  };

  const fieldClass = (err?: unknown) => (err ? 'border-destructive' : '');

  return (
    <div className="space-y-7 animate-fade-in">
      <PageHeader
        title="Create Batch"
        description="Start a new production batch before recording BMR and QA."
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Product *</Label>
                <Input {...register('productName')} className={fieldClass(errors.productName)} />
                {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
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
              <Button type="submit" className="rounded-xl" disabled={!isValid}>
                Save Batch
              </Button>
            </div>
        </FormSection>
      </form>
    </div>
  );
}
