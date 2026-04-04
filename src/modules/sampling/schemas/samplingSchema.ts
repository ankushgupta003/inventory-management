import { z } from 'zod';

const itemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().min(1, 'Item is required'),
  batchNo: z.string().min(1, 'Batch is required'),
  manufacturedBy: z.string().min(1, 'Manufactured By is required'),
  mfgDate: z.string().min(1, 'MFG date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  availableQty: z.number().min(0),
  sampleQty: z.number().min(0.01, 'Sample qty is required'),
}).superRefine((val, ctx) => {
  if (val.sampleQty > val.availableQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sample qty cannot exceed available qty',
      path: ['sampleQty'],
    });
  }
});

export const samplingSchema = z.object({
  samplingNo: z.string().min(1),
  date: z.string().min(1, 'Date is required'),
  fromStore: z.string().min(1, 'From store is required'),
  toDepartment: z.string().min(1, 'To department is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  issuedBy: z.string().min(1, 'Issued By is required'),
  sampleDrawnBy: z.string().min(1, 'Sample Drawn By is required'),
});

export type SamplingFormValues = z.infer<typeof samplingSchema>;
