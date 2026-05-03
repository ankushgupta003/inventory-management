import { z } from 'zod';

const dateTextSchema = z.union([
  z.literal(''),
  z.string().regex(/^\d{2}\/\d{4}$/, 'Use MM/YYYY, DD/MM/YYYY, or YYYY-MM-DD'),
  z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use MM/YYYY, DD/MM/YYYY, or YYYY-MM-DD'),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use MM/YYYY, DD/MM/YYYY, or YYYY-MM-DD'),
]);

const toComparableIsoDate = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
  return null;
};

export const ginItemSchema = z
  .object({
    itemId: z.string().min(1, 'Item is required'),
    ulpQty: z.number().min(0, 'Cannot be negative'),
    billQty: z.number().min(0, 'Cannot be negative'),
    receivedQty: z.number().min(0, 'Cannot be negative'),
    acceptedQty: z.number().min(0, 'Cannot be negative'),
    rejectedQty: z.number().min(0, 'Cannot be negative'),
    batchNo: z.string().min(1, 'Batch is required'),
    mfgDate: dateTextSchema,
    expiryDate: dateTextSchema,
    rate: z.number().min(0, 'Cannot be negative'),
    taxableValue: z.number().min(0, 'Cannot be negative'),
    cgstRate: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
    sgstRate: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
    igstRate: z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
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

    const comparableMfgDate = toComparableIsoDate(value.mfgDate);
    const comparableExpiryDate = toComparableIsoDate(value.expiryDate);
    if (comparableMfgDate && comparableExpiryDate && comparableExpiryDate < comparableMfgDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date cannot be before MFG date',
      });
    }

    if (value.igstRate > 0 && (value.cgstRate > 0 || value.sgstRate > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['igstRate'],
        message: 'Use IGST or CGST/SGST, not both',
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
