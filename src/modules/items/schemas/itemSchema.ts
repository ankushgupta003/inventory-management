import { z } from 'zod';

export const itemFormSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required').max(100),
  tallyName: z.string().trim().min(1, 'Tally name is required').max(100),
  type: z.enum(['raw_material', 'finished_good']),
  baseUnit: z.string().min(1, 'Base unit is required'),
  conversionEnabled: z.boolean(),
  alternateUnit: z.string().optional(),
  conversionFactor: z.coerce.number().positive('Must be positive').optional(),
  purchaseRate: z.coerce.number().min(0, 'Must be 0 or more'),
  sellingRate: z.coerce.number().min(0, 'Must be 0 or more'),
  hsnCode: z.string().max(20).optional(),
  taxPercent: z.coerce.number().min(0, 'Min 0').max(100, 'Max 100'),
  isActive: z.boolean(),
}).refine(
  (data) => !data.conversionEnabled || (data.alternateUnit && data.alternateUnit.length > 0),
  { message: 'Alternate unit is required when conversion is enabled', path: ['alternateUnit'] }
).refine(
  (data) => !data.conversionEnabled || (data.conversionFactor && data.conversionFactor > 0),
  { message: 'Conversion factor is required when conversion is enabled', path: ['conversionFactor'] }
);

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const defaultItemValues: ItemFormValues = {
  storeName: '',
  tallyName: '',
  type: 'raw_material',
  baseUnit: 'kg',
  conversionEnabled: false,
  alternateUnit: '',
  conversionFactor: undefined,
  purchaseRate: 0,
  sellingRate: 0,
  hsnCode: '',
  taxPercent: 18,
  isActive: true,
};
