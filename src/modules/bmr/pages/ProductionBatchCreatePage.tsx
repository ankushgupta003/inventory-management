import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/PageHeader';
import { productionBatchSchema, type ProductionBatchSchemaValues } from '../schemas/bmrSchema';
import { addBatch } from '@/modules/production/productionStore';
import type { ProductionBatch } from '@/modules/production/types';

export default function ProductionBatchCreatePage() {
  const navigate = useNavigate();

  const form = useForm<ProductionBatchSchemaValues>({
    resolver: zodResolver(productionBatchSchema),
    defaultValues: {
      batchNo: '',
      productName: '',
      batchSize: '',
      mfgDate: '',
      expDate: '',
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = form;

  const onSubmit = (values: ProductionBatchSchemaValues) => {
    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Production Batch"
        description="Create the batch header before filling the BMR document."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Production', href: '/production' },
          { label: 'Create Batch' },
        ]}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Batch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Batch No *</Label>
                <Input {...register('batchNo')} className={fieldClass(errors.batchNo)} />
                {errors.batchNo && <p className="text-xs text-destructive">{errors.batchNo.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Product Name *</Label>
                <Input {...register('productName')} className={fieldClass(errors.productName)} />
                {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
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

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => reset()}>
                Reset
              </Button>
              <Button type="submit" disabled={!isValid}>
                Save & Continue to BMR
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
