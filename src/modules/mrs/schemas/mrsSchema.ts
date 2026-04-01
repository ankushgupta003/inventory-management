import { z } from 'zod';

export const mrsItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string(),
  unit: z.string(),
  qtyRequested: z.coerce.number().positive('Qty must be > 0'),
  remarks: z.string().optional().default(''),
});

export const mrsFormSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  department: z.string().min(1, 'Department is required'),
  requisitionBy: z.string().min(1, 'Requisition By is required'),
  items: z.array(mrsItemSchema).min(1, 'At least one item is required'),
});

export type MRSFormValues = z.infer<typeof mrsFormSchema>;
