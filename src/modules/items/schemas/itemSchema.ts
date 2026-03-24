import { z } from 'zod';

export const itemFormSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required').max(100),
  tallyName: z.string().trim().min(1, 'Tally name is required').max(100),
  sku: z.string().trim().max(50).optional().or(z.literal('')),
  baseUnit: z.string().min(1, 'Base unit is required'),
  tallyUnit: z.string().trim().max(20).optional().or(z.literal('')),
  conversionFactor: z.coerce.number().positive('Must be positive').optional().or(z.literal(0).transform(() => undefined)),
  hsnCode: z.string().max(20).optional().or(z.literal('')),
  gstRate: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  gstEffectiveFrom: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const defaultItemValues: ItemFormValues = {
  storeName: '',
  tallyName: '',
  sku: '',
  baseUnit: 'kg',
  tallyUnit: '',
  conversionFactor: undefined,
  hsnCode: '',
  gstRate: 18,
  gstEffectiveFrom: '',
  isActive: true,
};
