import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useAvailableItems } from '../hooks/useMRS';
import { mrsFormSchema, type MRSFormValues } from '../schemas/mrsSchema';
import { toast } from 'sonner';

const departments = ['Production', 'Testing', 'Maintenance', 'Quality Control', 'Packaging'];

export default function MRSCreatePage() {
  const navigate = useNavigate();
  const availableItems = useAvailableItems();

  const form = useForm<MRSFormValues>({
    resolver: zodResolver(mrsFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      department: '',
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

  const onSubmit = (data: MRSFormValues) => {
    console.log('MRS Data:', data);
    toast.success('MRS created successfully');
    navigate('/mrs');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/mrs')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Create Material Requisition Slip</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Header</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">MRS No</Label>
                <Input value="Auto-generated" disabled className="bg-muted" />
              </div>
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem>
                  <FormLabel>Department *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* Item Table */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Items</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ itemId: '', itemName: '', unit: '', qtyRequested: 0, remarks: '' })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
              </Button>
            </div>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-12">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Product Description</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Unit</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Qty Requested</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Remarks</th>
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-b last:border-0">
                      <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-2">
                        <Select value={form.watch(`items.${index}.itemId`)} onValueChange={(v) => onItemSelect(index, v)}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
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
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          {...form.register(`items.${index}.qtyRequested`, { valueAsNumber: true })}
                          className="w-28"
                          placeholder="0"
                        />
                        {form.formState.errors.items?.[index]?.qtyRequested && (
                          <p className="text-xs text-destructive mt-1">{form.formState.errors.items[index]?.qtyRequested?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Input {...form.register(`items.${index}.remarks`)} placeholder="Optional" />
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="requisitionBy" render={({ field }) => (
                <FormItem>
                  <FormLabel>Requisition By *</FormLabel>
                  <FormControl><Input {...field} placeholder="Name of requisitioner" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/mrs')}>Cancel</Button>
            <Button type="submit">Submit MRS</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
