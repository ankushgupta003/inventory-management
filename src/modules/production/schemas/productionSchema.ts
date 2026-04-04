import { z } from 'zod';

const outputSchema = z.object({
  itemId: z.string().min(1, 'Finished item is required'),
  itemName: z.string().min(1, 'Finished item is required'),
  batchNo: z.string().min(1, 'Batch is required'),
  mfgDate: z.string().min(1, 'MFG date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  qtyProduced: z.number().min(0.01, 'Produced qty is required'),
});

const inputSchema = z.object({
  itemId: z.string().min(1, 'Raw material is required'),
  itemName: z.string().min(1, 'Raw material is required'),
  batchNo: z.string().min(1, 'Batch is required'),
  availableQty: z.number().min(0),
  qtyUsed: z.number().min(0.01, 'Qty used is required'),
}).superRefine((val, ctx) => {
  if (val.qtyUsed > val.availableQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Qty used cannot exceed available qty',
      path: ['qtyUsed'],
    });
  }
});

export const productionSchema = z.object({
  productionNo: z.string().min(1),
  date: z.string().min(1, 'Date is required'),
  outputs: z.array(outputSchema).min(1, 'At least one finished good is required'),
  inputs: z.array(inputSchema).optional(),
});

export type ProductionFormValues = z.infer<typeof productionSchema>;
