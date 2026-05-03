import { z } from 'zod';

const dateSchema = z.string().min(1, 'Date is required');

export const productionBatchSchema = z
  .object({
    itemId: z.string().min(1, 'Finished item is required'),
    batchNo: z.string().min(1, 'Batch no is required'),
    batchSize: z.string().min(1, 'Batch size is required'),
    mfgDate: dateSchema,
    expDate: dateSchema,
  })
  .superRefine((value, ctx) => {
    if (value.expDate < value.mfgDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expDate'],
        message: 'EXP date cannot be before MFG date',
      });
    }
  });

export type ProductionBatchFormValues = z.infer<typeof productionBatchSchema>;
