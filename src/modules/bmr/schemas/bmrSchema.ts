import { z } from 'zod';

const rawMaterialSchema = z
  .object({
    id: z.string().min(1),
    materialName: z.string().min(1, 'Material name is required'),
    requiredQty: z.coerce.number().min(0, 'Required qty is required'),
    issuedQty: z.coerce.number().min(0, 'Issued qty is required'),
    usedQty: z.coerce.number().min(0, 'Used qty is required'),
    returnedQty: z.coerce.number().min(0, 'Returned qty is required'),
  })
  .refine((row) => row.usedQty + row.returnedQty === row.issuedQty, {
    message: 'Used + Returned must equal Issued qty',
    path: ['usedQty'],
  });

const processStepSchema = z.object({
  id: z.string().min(1),
  stepName: z.string().min(1, 'Process step is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  operatorName: z.string().min(1, 'Operator name is required'),
  checkedBy: z.string().min(1, 'Checked by is required'),
  remarks: z.string().min(1, 'Remarks are required'),
});

export const bmrSchema = z.object({
  batchInfo: z.object({
    productName: z.string().min(1, 'Product name is required'),
    batchNo: z.string().min(1, 'Batch no is required'),
    batchSize: z.string().min(1, 'Batch size is required'),
    mfgDate: z.string().min(1, 'MFG date is required'),
    expDate: z.string().min(1, 'EXP date is required'),
  }),
  rawMaterials: z.array(rawMaterialSchema).min(1, 'At least one raw material row is required'),
  processSteps: z.array(processStepSchema).min(1, 'At least one process step is required'),
  sterilization: z.object({
    date: z.string().min(1, 'Sterilization date is required'),
    quantity: z.coerce.number().min(0, 'Sterilization quantity is required'),
    reference: z.string().min(1, 'Reference is required'),
  }),
  packing: z.object({
    packingType: z.string().min(1, 'Packing type is required'),
    quantity: z.coerce.number().min(0, 'Packing quantity is required'),
    doneBy: z.string().min(1, 'Done by is required'),
  }),
  labelling: z.object({
    labelDetails: z.string().min(1, 'Label details are required'),
    checkedBy: z.string().min(1, 'Checked by is required'),
  }),
  finalOutput: z.object({
    expectedQty: z.coerce.number().min(1, 'Expected qty is required'),
    actualQty: z.coerce.number().min(0, 'Actual qty is required'),
    rejectedQty: z.coerce.number().min(0, 'Rejected qty is required'),
  }).refine((row) => row.actualQty + row.rejectedQty === row.expectedQty, {
    message: 'Actual + Rejected must equal Expected qty',
    path: ['actualQty'],
  }),
  qa: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
      required_error: 'QA status is required',
    }),
    remarks: z.string().min(1, 'QA remarks are required'),
    approvedBy: z.string().min(1, 'Approved by is required'),
  }),
});

export type BmrSchemaValues = z.infer<typeof bmrSchema>;

export const productionBatchSchema = z.object({
  batchNo: z.string().min(1, 'Batch no is required'),
  productName: z.string().min(1, 'Product name is required'),
  batchSize: z.string().min(1, 'Batch size is required'),
  mfgDate: z.string().min(1, 'MFG date is required'),
  expDate: z.string().min(1, 'EXP date is required'),
});

export type ProductionBatchSchemaValues = z.infer<typeof productionBatchSchema>;
