import { z } from 'zod';

export const issueItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  itemName: z.string().min(1, 'Item is required'),
  batchNo: z.string().min(1, 'Batch is required'),
  availableQty: z.number().min(0),
  issueQty: z.number().min(0.01, 'Issue qty is required'),
  mfgDate: z.string().min(1, 'MFG date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  remarks: z.string().optional().default(''),
  requestedQty: z.number().optional(),
}).superRefine((val, ctx) => {
  if (val.issueQty > val.availableQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Issue qty cannot exceed available qty',
      path: ['issueQty'],
    });
  }
  if (typeof val.requestedQty === 'number' && val.issueQty > val.requestedQty) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Issue qty cannot exceed requested qty',
      path: ['issueQty'],
    });
  }
});

export const issueSchema = z.object({
  issueNo: z.string().min(1),
  date: z.string().min(1, 'Date is required'),
  issueType: z.enum(['production', 'sample', 'damage', 'other']),
  mrsId: z.string().optional(),
  items: z.array(issueItemSchema).min(1, 'At least one item is required'),
  issuedBy: z.string().min(1, 'Issued By is required'),
  approvedBy: z.string().optional(),
  receivedBy: z.string().optional(),
});

export type IssueFormValues = z.infer<typeof issueSchema>;
