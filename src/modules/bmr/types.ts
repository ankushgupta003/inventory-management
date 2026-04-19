export type BmrRawMaterial = {
  id: string;
  materialName: string;
  requiredQty: number;
  issuedQty: number;
  usedQty: number;
  returnedQty: number;
};

export type BmrProcessStep = {
  id: string;
  stepName: string;
  startTime: string;
  endTime: string;
  operatorName: string;
  checkedBy: string;
  remarks: string;
};

export type BmrSterilization = {
  date: string;
  quantity: number;
  reference: string;
};

export type BmrPacking = {
  packingType: string;
  quantity: number;
  doneBy: string;
};

export type BmrLabelling = {
  labelDetails: string;
  checkedBy: string;
};

export type BmrFinalOutput = {
  expectedQty: number;
  actualQty: number;
  rejectedQty: number;
};

export type BmrQa = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string;
  approvedBy: string;
};

export type BmrBatchInfo = {
  productName: string;
  batchNo: string;
  batchSize: string;
  mfgDate: string;
  expDate: string;
};

export type BmrFormValues = {
  batchInfo: BmrBatchInfo;
  rawMaterials: BmrRawMaterial[];
  processSteps: BmrProcessStep[];
  sterilization: BmrSterilization;
  packing: BmrPacking;
  labelling: BmrLabelling;
  finalOutput: BmrFinalOutput;
  qa: BmrQa;
};

export type ProductionBatchFormValues = {
  batchNo: string;
  productName: string;
  batchSize: string;
  mfgDate: string;
  expDate: string;
};
