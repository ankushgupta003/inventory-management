import { z } from 'zod';

const itemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().min(1, 'Item is required'),
  batchNo: z.string().min(1, 'Batch is required'),
  availableQty: z.number().min(0),
  orderedQty: z.number().min(0),
  invoicedQty: z.number().min(0),
  remainingQty: z.number().min(0),
  invoiceQty: z.number().min(0.01, 'Invoice qty is required'),
  rate: z.number().min(0, 'Rate is required'),
  taxPercent: z.number().min(0),
}).superRefine((val, ctx) => {
  if (val.invoiceQty > val.remainingQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invoice qty cannot exceed remaining qty',
      path: ['invoiceQty'],
    });
  }
  if (val.invoiceQty > val.availableQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invoice qty cannot exceed available qty',
      path: ['invoiceQty'],
    });
  }
});

export const invoiceSchema = z.object({
  invoiceNo: z.string().min(1),
  date: z.string().min(1, 'Date is required'),
  piId: z.string().min(1, 'PI selection is required'),
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
