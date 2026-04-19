import type { BmrFormValues, ProductionBatchFormValues } from './types';

export const mockProductionBatch: ProductionBatchFormValues = {
  batchNo: 'BMR-2026-041',
  productName: 'Sterile Surgical Gloves - Large',
  batchSize: '10,000 Pairs',
  mfgDate: '2026-04-05',
  expDate: '2029-04-04',
};

export const mockBmrData: BmrFormValues = {
  batchInfo: { ...mockProductionBatch },
  rawMaterials: [
    {
      id: 'rm-1',
      materialName: 'Latex Compound - Grade A',
      requiredQty: 520,
      issuedQty: 520,
      usedQty: 500,
      returnedQty: 20,
    },
    {
      id: 'rm-2',
      materialName: 'Cornstarch Powder',
      requiredQty: 75,
      issuedQty: 75,
      usedQty: 72,
      returnedQty: 3,
    },
    {
      id: 'rm-3',
      materialName: 'Packaging Film Roll',
      requiredQty: 28,
      issuedQty: 28,
      usedQty: 26,
      returnedQty: 2,
    },
  ],
  processSteps: [
    {
      id: 'ps-1',
      stepName: 'Compounding',
      startTime: '08:30',
      endTime: '09:10',
      operatorName: 'R. Sharma',
      checkedBy: 'A. Iyer',
      remarks: 'Viscosity within limit',
    },
    {
      id: 'ps-2',
      stepName: 'Dipping',
      startTime: '09:15',
      endTime: '11:05',
      operatorName: 'P. Nair',
      checkedBy: 'A. Iyer',
      remarks: 'No defects observed',
    },
    {
      id: 'ps-3',
      stepName: 'Curing',
      startTime: '11:20',
      endTime: '12:05',
      operatorName: 'S. Gupta',
      checkedBy: 'K. Rao',
      remarks: 'Temp 90°C',
    },
  ],
  sterilization: {
    date: '2026-04-06',
    quantity: 9800,
    reference: 'ST-240406-02',
  },
  packing: {
    packingType: 'Pair Pack - 10 pcs/box',
    quantity: 9800,
    doneBy: 'M. Joseph',
  },
  labelling: {
    labelDetails: 'Batch No + MFG/EXP + Sterile EO',
    checkedBy: 'N. Verma',
  },
  finalOutput: {
    expectedQty: 10000,
    actualQty: 9800,
    rejectedQty: 200,
  },
  qa: {
    status: 'PENDING',
    remarks: 'Awaiting bioburden report',
    approvedBy: '',
  },
};
