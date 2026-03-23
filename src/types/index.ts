export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Item {
  id: string;
  storeName: string;
  tallyName: string;
  hsnCode: string;
  taxPercent: number;
  unit: string;
  type: 'raw_material' | 'finished_good';
  currentStock: number;
  createdAt: string;
}

export interface Party {
  id: string;
  name: string;
  type: 'supplier' | 'customer' | 'both';
  gstNumber: string;
  contact: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface PurchaseItem {
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  total: number;
  defectiveQty: number;
  returnQty: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface MaterialIssue {
  id: string;
  issueType: 'testing' | 'production';
  items: { itemId: string; itemName: string; quantity: number }[];
  date: string;
  issuedBy: string;
  createdAt: string;
}

export interface ProductionEntry {
  id: string;
  date: string;
  inputMaterials: { itemId: string; itemName: string; quantity: number }[];
  outputProducts: { itemId: string; itemName: string; quantity: number }[];
  wastage: number;
  returnedMaterials: { itemId: string; itemName: string; quantity: number }[];
  createdAt: string;
}

export interface PIItem {
  itemId: string;
  itemName: string;
  orderedQty: number;
  fulfilledQty: number;
  pendingQty: number;
  rate: number;
}

export type PIStatus = 'pending' | 'partial' | 'completed' | 'closed';

export interface ProformaInvoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: PIItem[];
  status: PIStatus;
  totalAmount: number;
  createdAt: string;
}

export interface FinalInvoice {
  id: string;
  piId: string;
  customerId: string;
  customerName: string;
  date: string;
  items: PIItem[];
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
}

export interface DashboardKPI {
  totalStock: number;
  rawMaterialStock: number;
  finishedGoodsStock: number;
  pendingPI: number;
  todayProduction: number;
  todaySales: number;
}
