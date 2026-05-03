import { z } from 'zod';

const itemSchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate is required'),
  remarks: z.string().optional(),
});

export const piSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

export type PIFormValues = z.infer<typeof piSchema>;
