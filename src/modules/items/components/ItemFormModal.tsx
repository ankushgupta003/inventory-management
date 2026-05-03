import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { itemFormSchema, defaultItemValues, type ItemFormValues } from '../schemas/itemSchema';
import type { ItemCategoryOption, ItemRecord } from '../types';

const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'nos', label: 'Numbers (nos)' },
  { value: 'ltr', label: 'Litre (ltr)' },
  { value: 'mtr', label: 'Metre (mtr)' },
  { value: 'set', label: 'Set' },
  { value: 'ton', label: 'Ton' },
  { value: 'box', label: 'Box' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'roll', label: 'Roll' },
  { value: 'bag', label: 'Bag' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (values: ItemFormValues) => void;
  categoryOptions: ItemCategoryOption[];
  editingItem?: ItemRecord | null;
}

export default function ItemFormModal({ open, onClose, onSave, categoryOptions, editingItem }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaultItemValues,
  });

  useEffect(() => {
    if (open) {
      reset(editingItem ? {
        storeName: editingItem.storeName,
        tallyName: editingItem.tallyName,
        sku: editingItem.sku || '',
        itemType: editingItem.itemType,
        categoryId: editingItem.categoryId || '',
        baseUnit: editingItem.baseUnit,
        hsnCode: editingItem.hsnCode || '',
        gstRate: editingItem.gstRate,
        isActive: editingItem.isActive,
      } : defaultItemValues);
    }
  }, [open, editingItem, reset]);

  const selectedItemType = watch('itemType');
  const selectedCategoryId = watch('categoryId');

  const filteredCategories = useMemo(() => {
    return categoryOptions.filter((category) => {
      if (category.itemType !== selectedItemType) return false;
      if (category.isActive) return true;
      return category.id === selectedCategoryId;
    });
  }, [categoryOptions, selectedCategoryId, selectedItemType]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    const matchingCategory = categoryOptions.find((category) => category.id === selectedCategoryId);
    if (!matchingCategory || matchingCategory.itemType !== selectedItemType) {
      setValue('categoryId', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [categoryOptions, selectedCategoryId, selectedItemType, setValue]);

  const onSubmit = (values: ItemFormValues) => onSave(values);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-6">
          {/* SECTION 1: Basic Information */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="storeName">Store Item Name <span className="text-destructive">*</span></Label>
                <Input id="storeName" {...register('storeName')} placeholder="e.g. Steel Rod 10mm" />
                {errors.storeName && <p className="text-xs text-destructive">{errors.storeName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tallyName">Tally Item Name <span className="text-destructive">*</span></Label>
                <Input id="tallyName" {...register('tallyName')} placeholder="e.g. STEEL-ROD-10" />
                {errors.tallyName && <p className="text-xs text-destructive">{errors.tallyName.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register('sku')} placeholder="e.g. SR-10MM (optional, must be unique)" />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
          </fieldset>

          {/* SECTION 2: Classification */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Classification</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Item Type <span className="text-destructive">*</span></Label>
                <Controller name="itemType" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw">Raw Material</SelectItem>
                      <SelectItem value="finished">Finished Good</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.itemType && <p className="text-xs text-destructive">{errors.itemType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Controller name="categoryId" control={control} render={({ field }) => (
                  <Select value={field.value || '_none'} onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}{category.isActive ? '' : ' (inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
          </fieldset>

          {/* SECTION 3: Unit */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unit</legend>
            <div className="space-y-1.5">
              <Label>Base Unit <span className="text-destructive">*</span></Label>
              <Controller name="baseUnit" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </fieldset>

          {/* SECTION 4: Tax */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tax</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input id="hsnCode" {...register('hsnCode')} placeholder="e.g. 7214" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gstRate">GST Rate (%)</Label>
                <Input id="gstRate" type="number" step="0.01" {...register('gstRate')} />
                {errors.gstRate && <p className="text-xs text-destructive">{errors.gstRate.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* SECTION 5: Status */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</legend>
            <div className="flex items-center gap-3">
              <Controller name="isActive" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="isActive" />
              )} />
              <Label htmlFor="isActive" className="text-sm cursor-pointer">
                {watch('isActive') ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
