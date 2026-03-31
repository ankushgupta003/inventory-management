export type ItemType = 'raw' | 'finished';

export interface ItemRecord {
  id: string;
  storeName: string;
  tallyName: string;
  sku: string;
  itemType: ItemType;
  category: string;
  baseUnit: string;
  hsnCode: string;
  gstRate: number;
  isActive: boolean;
  createdAt: string;
}

export type ItemFilters = {
  search: string;
  status: 'all' | 'active' | 'inactive';
  itemType: 'all' | ItemType;
};
