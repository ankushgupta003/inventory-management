import { z } from 'zod';

const itemSchema = z.object({
  proformaInvoiceItemId: z.string().min(1, 'PI line is required'),
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().optional(),
  unit: z.string().optional(),
  batchNo: z.string().optional().default(''),
  availableQty: z.number().min(0),
  orderedQty: z.number().min(0),
  invoicedQty: z.number().min(0),
  remainingQty: z.number().min(0),
  invoiceQty: z.number().min(0),
  rate: z.number().min(0, 'Rate is required'),
  taxPercent: z.number().min(0),
}).superRefine((val, ctx) => {
  if (!val.invoiceQty || val.invoiceQty <= 0) {
    return;
  }

  if (!val.batchNo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Batch is required',
      path: ['batchNo'],
    });
  }

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
  date: z.string().min(1, 'Date is required'),
  proformaInvoiceId: z.string().min(1, 'PI selection is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
}).superRefine((value, ctx) => {
  if (!value.items.some((item) => item.invoiceQty > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter invoice quantity for at least one PI line',
      path: ['items'],
    });
  }
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
