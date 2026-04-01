import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { partyFormSchema, defaultPartyValues, type PartyFormValues } from '../schemas/partySchema';
import type { PartyRecord } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (values: PartyFormValues) => void;
  editingParty?: PartyRecord | null;
}

export default function PartyFormModal({ open, onClose, onSave, editingParty }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema),
    defaultValues: defaultPartyValues,
  });

  useEffect(() => {
    if (open) {
      reset(editingParty ? {
        name: editingParty.name,
        partyType: editingParty.partyType,
        contactPerson: editingParty.contactPerson || '',
        phone: editingParty.phone || '',
        altPhone: editingParty.altPhone || '',
        email: editingParty.email || '',
        address1: editingParty.address1 || '',
        address2: editingParty.address2 || '',
        city: editingParty.city || '',
        state: editingParty.state || '',
        pincode: editingParty.pincode || '',
        gstNumber: editingParty.gstNumber || '',
        panNumber: editingParty.panNumber || '',
        openingBalance: editingParty.openingBalance || 0,
        creditLimit: editingParty.creditLimit || 0,
        remarks: editingParty.remarks || '',
        isActive: editingParty.isActive,
      } : defaultPartyValues);
    }
  }, [open, editingParty, reset]);

  const onSubmit = (values: PartyFormValues) => onSave(values);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingParty ? 'Edit Party' : 'Add New Party'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-6">
          {/* SECTION 1: Basic Details */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Details</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Party Name <span className="text-destructive">*</span></Label>
                <Input id="name" {...register('name')} placeholder="e.g. ABC Steel Suppliers" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Party Type <span className="text-destructive">*</span></Label>
                <Controller name="partyType" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
                {errors.partyType && <p className="text-xs text-destructive">{errors.partyType.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: Contact Details */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Details</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" {...register('contactPerson')} placeholder="e.g. Rajesh Kumar" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register('phone')} placeholder="e.g. 9876543210" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="altPhone">Alternate Phone</Label>
                <Input id="altPhone" {...register('altPhone')} placeholder="Optional" />
                {errors.altPhone && <p className="text-xs text-destructive">{errors.altPhone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="e.g. contact@company.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* SECTION 3: Address */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Address</legend>
            <div className="space-y-1.5">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input id="address1" {...register('address1')} placeholder="Street / Plot / Building" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" {...register('address2')} placeholder="Area / Landmark (optional)" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register('city')} placeholder="e.g. Mumbai" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...register('state')} placeholder="e.g. Maharashtra" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" {...register('pincode')} placeholder="e.g. 400001" />
              </div>
            </div>
          </fieldset>

          {/* SECTION 4: Tax Details */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tax Details</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input id="gstNumber" {...register('gstNumber')} placeholder="e.g. 27AABCU9603R1ZM" className="uppercase" />
                {errors.gstNumber && <p className="text-xs text-destructive">{errors.gstNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input id="panNumber" {...register('panNumber')} placeholder="e.g. AABCU9603R" className="uppercase" />
                {errors.panNumber && <p className="text-xs text-destructive">{errors.panNumber.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* SECTION 5: Business Info */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Business Info</legend>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="openingBalance">Opening Balance (₹)</Label>
                <Input id="openingBalance" type="number" step="0.01" {...register('openingBalance')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                <Input id="creditLimit" type="number" step="0.01" {...register('creditLimit')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" {...register('remarks')} rows={2} placeholder="Any additional notes..." />
            </div>
          </fieldset>

          {/* SECTION 6: Status */}
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
              {editingParty ? 'Update Party' : 'Create Party'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
