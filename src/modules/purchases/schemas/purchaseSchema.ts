import { z } from 'zod';

export const ginItemSchema = z
  .object({
    itemId: z.string().min(1, 'Item is required'),
    ulpQty: z.number().min(0, 'Cannot be negative'),
    billQty: z.number().min(0, 'Cannot be negative'),
    receivedQty: z.number().min(0, 'Cannot be negative'),
    acceptedQty: z.number().min(0, 'Cannot be negative'),
    rejectedQty: z.number().min(0, 'Cannot be negative'),
    batchNo: z.string().min(1, 'Batch is required'),
    mfgDate: z.string().min(1, 'Required'),
    expiryDate: z.string().min(1, 'Required'),
    rate: z.number().min(0, 'Cannot be negative'),
    remarks: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const qtyDelta = Math.abs((value.acceptedQty + value.rejectedQty) - value.receivedQty);
    if (qtyDelta > 0.000001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedQty'],
        message: 'Accepted + Rejected must equal Received',
      });
    }

    if (value.expiryDate < value.mfgDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date cannot be before MFG date',
      });
    }
  });

export const ginSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  challanNo: z.string().min(1, 'Required'),
  challanDate: z.string().min(1, 'Required'),
  billNo: z.string().min(1, 'Required'),
  billDate: z.string().min(1, 'Required'),
  gateEntryNo: z.string().min(1, 'Required'),
  entryDate: z.string().min(1, 'Required'),
  items: z.array(ginItemSchema).min(1, 'At least one item required'),
  preparedBy: z.string().optional(),
  sanctionedBy: z.string().optional(),
  authorizedSignatory: z.string().optional(),
});

export type GINFormValues = z.infer<typeof ginSchema>;
