import type { AuthPortal, CompanyStatus, PermissionKey, User } from '@/types';

export const ACCOUNT_TYPE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  COMPANY_USER: 'Company User',
} as const;

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
};

const COMPANY_HOME_PRIORITY: Array<{ path: string; permission: PermissionKey }> = [
  { path: '/dashboard', permission: 'dashboard.view' },
  { path: '/items', permission: 'items.view' },
  { path: '/parties', permission: 'parties.view' },
  { path: '/purchases', permission: 'purchases.view' },
  { path: '/production', permission: 'production.view' },
  { path: '/mrs', permission: 'mrs.view' },
  { path: '/stock-movement', permission: 'stock_movement.view' },
  { path: '/quality-requests', permission: 'quality_requests.view' },
  { path: '/proforma-invoices', permission: 'proforma_invoices.view' },
  { path: '/invoices', permission: 'invoices.view' },
  { path: '/stock-ledger', permission: 'stock_ledger.view' },
  { path: '/reports', permission: 'reports.view' },
];

export function inferPortalFromUser(user: Pick<User, 'accountType'>): AuthPortal {
  return user.accountType === 'SUPER_ADMIN' ? 'super-admin' : 'company';
}

export function getLoginRouteForPortal(portal: AuthPortal = 'company') {
  return portal === 'super-admin' ? '/super-admin/login' : '/login';
}

export function formatAccountType(accountType: User['accountType']) {
  return ACCOUNT_TYPE_LABELS[accountType];
}

export function hasPermissionForUser(user: User | null, permission: PermissionKey) {
  if (!user) return false;
  if (user.accountType === 'COMPANY_ADMIN') return true;
  if (user.accountType !== 'COMPANY_USER') return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermissionForUser(user: User | null, permissions: PermissionKey[]) {
  if (!user) return false;
  if (user.accountType === 'COMPANY_ADMIN') return true;
  return permissions.some((permission) => hasPermissionForUser(user, permission));
}

export function hasAllPermissionsForUser(user: User | null, permissions: PermissionKey[]) {
  if (!user) return false;
  if (user.accountType === 'COMPANY_ADMIN') return true;
  return permissions.every((permission) => hasPermissionForUser(user, permission));
}

export function getDefaultRouteForUser(user: Pick<User, 'accountType' | 'permissions'> | null) {
  if (!user) return '/login';
  if (user.accountType === 'SUPER_ADMIN') {
    return '/super-admin/dashboard';
  }
  if (user.accountType === 'COMPANY_ADMIN') {
    return '/dashboard';
  }

  const firstAllowedRoute = COMPANY_HOME_PRIORITY.find((route) => user.permissions.includes(route.permission));
  return firstAllowedRoute?.path ?? '/login';
}
