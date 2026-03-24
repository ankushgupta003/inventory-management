export interface ItemRecord {
  id: string;
  storeName: string;
  tallyName: string;
  type: 'raw_material' | 'finished_good';
  baseUnit: string;
  conversionEnabled: boolean;
  alternateUnit?: string;
  conversionFactor?: number;
  purchaseRate: number;
  sellingRate: number;
  hsnCode: string;
  taxPercent: number;
  isActive: boolean;
  currentStock: number;
  createdAt: string;
}

export type ItemFilters = {
  search: string;
  type: 'all' | 'raw_material' | 'finished_good';
  status: 'all' | 'active' | 'inactive';
};
