export interface ItemRecord {
  id: string;
  storeName: string;
  tallyName: string;
  sku: string;
  baseUnit: string;
  tallyUnit: string;
  conversionFactor?: number;
  hsnCode: string;
  gstRate: number;
  gstEffectiveFrom: string;
  isActive: boolean;
  createdAt: string;
}

export type ItemFilters = {
  search: string;
  status: 'all' | 'active' | 'inactive';
};
