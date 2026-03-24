import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { itemFormSchema, defaultItemValues, type ItemFormValues } from '../schemas/itemSchema';
import type { ItemRecord } from '../types';

const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
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
  editingItem?: ItemRecord | null;
}

export default function ItemFormModal({ open, onClose, onSave, editingItem }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: defaultItemValues,
  });

  const conversionEnabled = watch('conversionEnabled');
  const baseUnit = watch('baseUnit');
  const alternateUnit = watch('alternateUnit');
  const conversionFactor = watch('conversionFactor');

  useEffect(() => {
    if (open) {
      reset(editingItem ? {
        storeName: editingItem.storeName,
        tallyName: editingItem.tallyName,
        type: editingItem.type,
        baseUnit: editingItem.baseUnit,
        conversionEnabled: editingItem.conversionEnabled,
        alternateUnit: editingItem.alternateUnit || '',
        conversionFactor: editingItem.conversionFactor,
        purchaseRate: editingItem.purchaseRate,
        sellingRate: editingItem.sellingRate,
        hsnCode: editingItem.hsnCode,
        taxPercent: editingItem.taxPercent,
        isActive: editingItem.isActive,
      } : defaultItemValues);
    }
  }, [open, editingItem, reset]);

  const onSubmit = (values: ItemFormValues) => {
    onSave(values);
  };

  const altUnitLabel = UNITS.find((u) => u.value === alternateUnit)?.label?.split(' ')[0] || alternateUnit || 'alt unit';
  const baseUnitLabel = UNITS.find((u) => u.value === baseUnit)?.label?.split(' ')[0] || baseUnit || 'base unit';

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
                <Label htmlFor="storeName">Store Name <span className="text-destructive">*</span></Label>
                <Input id="storeName" {...register('storeName')} placeholder="e.g. Steel Rod 10mm" />
                {errors.storeName && <p className="text-xs text-destructive">{errors.storeName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tallyName">Tally Name <span className="text-destructive">*</span></Label>
                <Input id="tallyName" {...register('tallyName')} placeholder="e.g. STEEL-ROD-10" />
                {errors.tallyName && <p className="text-xs text-destructive">{errors.tallyName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Item Type</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                      <SelectItem value="finished_good">Finished Good</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5">
                <Label>Base Unit</Label>
                <Controller name="baseUnit" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: Unit Conversion */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              Unit Conversion
              <Tooltip>
                <TooltipTrigger type="button">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs text-xs">
                  Enable this to define an alternate unit with a conversion factor. Useful when you buy in one unit and sell/use in another.
                </TooltipContent>
              </Tooltip>
            </legend>
            <div className="flex items-center gap-3">
              <Controller name="conversionEnabled" control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} id="conversionEnabled" />
              )} />
              <Label htmlFor="conversionEnabled" className="text-sm cursor-pointer">Enable unit conversion</Label>
            </div>
            {conversionEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-1 border-l-2 border-primary/20 ml-1">
                <div className="space-y-1.5 pl-3">
                  <Label>Alternate Unit</Label>
                  <Controller name="alternateUnit" control={control} render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                      <SelectContent>
                        {UNITS.filter((u) => u.value !== baseUnit).map((u) => (
                          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                  {errors.alternateUnit && <p className="text-xs text-destructive">{errors.alternateUnit.message}</p>}
                </div>
                <div className="space-y-1.5 pl-3">
                  <Label>Conversion Factor</Label>
                  <Input type="number" step="any" {...register('conversionFactor')} placeholder="e.g. 10" />
                  {errors.conversionFactor && <p className="text-xs text-destructive">{errors.conversionFactor.message}</p>}
                </div>
                {alternateUnit && conversionFactor && conversionFactor > 0 && (
                  <p className="col-span-2 pl-3 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2">
                    Example: 1 {altUnitLabel} = {conversionFactor} {baseUnitLabel}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          {/* SECTION 3: Pricing */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Purchase Rate (₹ / {baseUnitLabel})</Label>
                <Input type="number" step="0.01" {...register('purchaseRate')} />
                {errors.purchaseRate && <p className="text-xs text-destructive">{errors.purchaseRate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Selling Rate (₹ / {baseUnitLabel})</Label>
                <Input type="number" step="0.01" {...register('sellingRate')} />
                {errors.sellingRate && <p className="text-xs text-destructive">{errors.sellingRate.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* SECTION 4: Tax & Codes */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tax & Codes</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>HSN Code</Label>
                <Input {...register('hsnCode')} placeholder="e.g. 7214" />
              </div>
              <div className="space-y-1.5">
                <Label>Tax %</Label>
                <Input type="number" step="0.01" {...register('taxPercent')} />
                {errors.taxPercent && <p className="text-xs text-destructive">{errors.taxPercent.message}</p>}
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
