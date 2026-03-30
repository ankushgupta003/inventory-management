import { z } from 'zod';

export const purchaseItemSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  batchNo: z.string().min(1, 'Batch No is required'),
  mfgDate: z.string().min(1, 'MFG Date is required'),
  expiryDate: z.string().min(1, 'Expiry Date is required'),
  receivedQty: z.number().positive('Must be > 0'),
  acceptedQty: z.number().min(0, 'Cannot be negative'),
  rejectedQty: z.number().min(0, 'Cannot be negative'),
  rate: z.number().positive('Rate must be > 0'),
}).refine(
  (data) => data.acceptedQty + data.rejectedQty <= data.receivedQty,
  { message: 'Accepted + Rejected cannot exceed Received Qty', path: ['acceptedQty'] }
);

export const purchaseSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  challanNo: z.string().min(1, 'Challan / Bill No is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
