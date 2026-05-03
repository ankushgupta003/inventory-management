import type { PermissionAction, PermissionKey, PermissionModule } from '@/constants/permissions';

export type { PermissionAction, PermissionKey, PermissionModule } from '@/constants/permissions';

export type AuthPortal = 'company' | 'super-admin';
export type AccountType = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_USER';
export type CompanyStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  name: string;
  accountType: AccountType;
  companyId: string | null;
  companyName: string | null;
  companyStatus: CompanyStatus | null;
  mustResetPassword: boolean;
  isActive: boolean;
  permissions: PermissionKey[];
  departmentId: string | null;
  departmentName: string | null;
  designationId: string | null;
  designationName: string | null;
  roleId: string | null;
  roleName: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PermissionCatalog {
  modules: PermissionModule[];
  actions: PermissionAction[];
  keys: PermissionKey[];
}

export interface CompanyCounts {
  users: number;
  departments: number;
  designations: number;
  roles: number;
}

export interface CompanyAdminSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  mustResetPassword: boolean;
  updatedAt?: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  code: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  status: CompanyStatus;
  adminUserId?: string | null;
  adminUser: CompanyAdminSummary | null;
  _count: CompanyCounts;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminDashboardData {
  summary: {
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
  };
  recentCompanies: CompanySummary[];
}

export interface CompanyCreatePayload {
  name: string;
  code: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  admin: {
    fullName: string;
    email: string;
    phone?: string | null;
    temporaryPassword?: string;
  };
}

export interface CompanyUpdatePayload {
  name?: string;
  code?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}

export interface DepartmentRecord {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentUpsertPayload {
  name: string;
  code?: string | null;
  isActive?: boolean;
}

export interface DesignationRecord {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationUpsertPayload {
  name: string;
  isActive?: boolean;
}

export type ItemCategoryItemType = 'raw' | 'finished';

export interface ItemCategoryRecord {
  id: string;
  companyId: string;
  name: string;
  itemType: ItemCategoryItemType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemCategoryUpsertPayload {
  name: string;
  itemType: ItemCategoryItemType;
  isActive?: boolean;
}

export interface RoleRecord {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: PermissionKey[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleUpsertPayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
  permissions: PermissionKey[];
}

export interface CompanyUserRecord {
  id: string;
  email: string;
  accountType: Exclude<AccountType, 'SUPER_ADMIN'>;
  companyId: string | null;
  fullName: string;
  employeeCode: string | null;
  phone: string | null;
  departmentId: string | null;
  designationId: string | null;
  roleId: string | null;
  isActive: boolean;
  mustResetPassword: boolean;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string } | null;
  designation: { id: string; name: string } | null;
  role: { id: string; name: string } | null;
}

export interface CompanyUserCreatePayload {
  fullName: string;
  email: string;
  employeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  roleId?: string | null;
  isActive?: boolean;
  temporaryPassword?: string;
}

export interface CompanyUserUpdatePayload {
  fullName?: string;
  email?: string;
  employeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  roleId?: string | null;
  isActive?: boolean;
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
