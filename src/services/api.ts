import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { ALL_PERMISSION_KEYS } from '@/constants/permissions';
import { getLoginRouteForPortal, inferPortalFromUser } from '@/lib/auth';
import type {
  AuthPortal,
  AuthSession,
  CompanyCreatePayload,
  CompanySummary,
  CompanyUpdatePayload,
  CompanyUserCreatePayload,
  CompanyUserRecord,
  CompanyUserUpdatePayload,
  DepartmentRecord,
  DepartmentUpsertPayload,
  DesignationRecord,
  DesignationUpsertPayload,
  PermissionCatalog,
  RoleRecord,
  RoleUpsertPayload,
  SuperAdminDashboardData,
  User,
} from '@/types';

const isTestMode = import.meta.env.MODE === 'test';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || isTestMode;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';
const AUTH_USER_KEY = 'auth_user';
const AUTH_PORTAL_KEY = 'auth_portal';

interface ApiEnvelope<T> {
  data: T;
}

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

function hasWindow() {
  return typeof window !== 'undefined';
}

function safeStorageGet(key: string) {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(key);
}

function safeStorageSet(key: string, value: string) {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, value);
}

function safeStorageRemove(key: string) {
  if (!hasWindow()) return;
  window.localStorage.removeItem(key);
}

function redirectToLogin() {
  if (!hasWindow()) return;

  const portal =
    getStoredPortal() ??
    (window.location.pathname.startsWith('/super-admin') ? 'super-admin' : 'company');
  const target = getLoginRouteForPortal(portal);

  if (window.location.pathname !== target) {
    window.location.href = target;
  }
}

function normalizeLegacyStoredUser(value: unknown): User | null {
  if (!value || typeof value !== 'object') return null;

  const legacyUser = value as { id?: unknown; name?: unknown; email?: unknown; role?: unknown };

  if (
    typeof legacyUser.id !== 'string' ||
    typeof legacyUser.name !== 'string' ||
    typeof legacyUser.email !== 'string' ||
    typeof legacyUser.role !== 'string'
  ) {
    return null;
  }

  const isLegacyAdmin = legacyUser.role === 'admin';

  return {
    id: legacyUser.id,
    email: legacyUser.email,
    fullName: legacyUser.name,
    name: legacyUser.name,
    accountType: isLegacyAdmin ? 'COMPANY_ADMIN' : 'COMPANY_USER',
    companyId: null,
    companyName: null,
    companyStatus: 'ACTIVE',
    mustResetPassword: false,
    isActive: true,
    permissions: [...ALL_PERMISSION_KEYS],
    departmentId: null,
    departmentName: null,
    designationId: null,
    designationName: null,
    roleId: null,
    roleName: legacyUser.role,
  };
}

async function unwrapData<T>(promise: Promise<AxiosResponse<ApiEnvelope<T>>>) {
  const response = await promise;
  return response.data.data;
}

export function getStoredAccessToken() {
  return safeStorageGet(AUTH_TOKEN_KEY);
}

export function getStoredRefreshToken() {
  return safeStorageGet(AUTH_REFRESH_TOKEN_KEY);
}

export function getStoredPortal(): AuthPortal | null {
  const value = safeStorageGet(AUTH_PORTAL_KEY);
  return value === 'company' || value === 'super-admin' ? value : null;
}

export function getStoredUser(): User | null {
  const raw = safeStorageGet(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as User;
    return parsed?.accountType ? parsed : normalizeLegacyStoredUser(parsed);
  } catch {
    return null;
  }
}

export function persistAuthSession(session: AuthSession, portal: AuthPortal) {
  safeStorageSet(AUTH_TOKEN_KEY, session.accessToken);
  safeStorageSet(AUTH_REFRESH_TOKEN_KEY, session.refreshToken);
  safeStorageSet(AUTH_USER_KEY, JSON.stringify(session.user));
  safeStorageSet(AUTH_PORTAL_KEY, portal);
}

export function persistStoredUser(user: User, portal?: AuthPortal) {
  safeStorageSet(AUTH_USER_KEY, JSON.stringify(user));
  safeStorageSet(AUTH_PORTAL_KEY, portal ?? inferPortalFromUser(user));
}

export function clearAuthSession() {
  safeStorageRemove(AUTH_TOKEN_KEY);
  safeStorageRemove(AUTH_REFRESH_TOKEN_KEY);
  safeStorageRemove(AUTH_USER_KEY);
  safeStorageRemove(AUTH_PORTAL_KEY);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiEnvelope<AuthSession>>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .then((response) => {
        const session = response.data.data;
        persistAuthSession(session, getStoredPortal() ?? inferPortalFromUser(session.user));
        return session.accessToken;
      })
      .catch((error) => {
        clearAuthSession();
        redirectToLogin();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as RetryableRequestConfig | undefined;
    const requestUrl = original?.url ?? '';
    const isAuthMutation =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/super-admin/login') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthMutation && getStoredRefreshToken()) {
      original._retry = true;

      try {
        const nextAccessToken = await refreshAccessToken();
        if (nextAccessToken) {
          original.headers = {
            ...original.headers,
            Authorization: `Bearer ${nextAccessToken}`,
          };
          return api(original);
        }
      } catch {
        return Promise.reject(error);
      }
    }

    if (status === 401 && !isAuthMutation) {
      clearAuthSession();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default api;

export const authAPI = {
  loginCompany: (email: string, password: string) =>
    unwrapData(api.post<ApiEnvelope<AuthSession>>('/auth/login', { email, password })),
  loginSuperAdmin: (email: string, password: string) =>
    unwrapData(api.post<ApiEnvelope<AuthSession>>('/auth/super-admin/login', { email, password })),
  me: () => unwrapData(api.get<ApiEnvelope<User>>('/auth/me')),
  refresh: (refreshToken: string) =>
    unwrapData(api.post<ApiEnvelope<AuthSession>>('/auth/refresh', { refreshToken })),
  logout: (refreshToken?: string | null) =>
    unwrapData(api.post<ApiEnvelope<{ success: boolean }>>('/auth/logout', refreshToken ? { refreshToken } : {})),
  changePassword: (currentPassword: string, newPassword: string) =>
    unwrapData(api.post<ApiEnvelope<AuthSession>>('/auth/change-password', { currentPassword, newPassword })),
};

export const superAdminAPI = {
  getDashboard: () => unwrapData(api.get<ApiEnvelope<SuperAdminDashboardData>>('/super-admin/dashboard')),
  getCompanies: () => unwrapData(api.get<ApiEnvelope<CompanySummary[]>>('/super-admin/companies')),
  getCompany: (id: string) => unwrapData(api.get<ApiEnvelope<CompanySummary>>(`/super-admin/companies/${id}`)),
  createCompany: (payload: CompanyCreatePayload) =>
    unwrapData(
      api.post<ApiEnvelope<{ company: CompanySummary; adminTemporaryPassword: string }>>('/super-admin/companies', payload),
    ),
  updateCompany: (id: string, payload: CompanyUpdatePayload) =>
    unwrapData(api.patch<ApiEnvelope<CompanySummary>>(`/super-admin/companies/${id}`, payload)),
  resetAdminPassword: (id: string, temporaryPassword?: string) =>
    unwrapData(
      api.post<ApiEnvelope<{ success: boolean; temporaryPassword: string }>>(
        `/super-admin/companies/${id}/reset-admin-password`,
        temporaryPassword ? { temporaryPassword } : {},
      ),
    ),
  suspendCompany: (id: string) =>
    unwrapData(api.post<ApiEnvelope<CompanySummary>>(`/super-admin/companies/${id}/suspend`)),
  activateCompany: (id: string) =>
    unwrapData(api.post<ApiEnvelope<CompanySummary>>(`/super-admin/companies/${id}/activate`)),
};

export const companyAdminAPI = {
  getPermissionCatalog: () => unwrapData(api.get<ApiEnvelope<PermissionCatalog>>('/admin/permissions/catalog')),
  getDepartments: () => unwrapData(api.get<ApiEnvelope<DepartmentRecord[]>>('/admin/departments')),
  createDepartment: (payload: DepartmentUpsertPayload) =>
    unwrapData(api.post<ApiEnvelope<DepartmentRecord>>('/admin/departments', payload)),
  updateDepartment: (id: string, payload: Partial<DepartmentUpsertPayload>) =>
    unwrapData(api.patch<ApiEnvelope<DepartmentRecord>>(`/admin/departments/${id}`, payload)),
  getDesignations: () => unwrapData(api.get<ApiEnvelope<DesignationRecord[]>>('/admin/designations')),
  createDesignation: (payload: DesignationUpsertPayload) =>
    unwrapData(api.post<ApiEnvelope<DesignationRecord>>('/admin/designations', payload)),
  updateDesignation: (id: string, payload: Partial<DesignationUpsertPayload>) =>
    unwrapData(api.patch<ApiEnvelope<DesignationRecord>>(`/admin/designations/${id}`, payload)),
  getRoles: () => unwrapData(api.get<ApiEnvelope<RoleRecord[]>>('/admin/roles')),
  createRole: (payload: RoleUpsertPayload) =>
    unwrapData(api.post<ApiEnvelope<RoleRecord>>('/admin/roles', payload)),
  updateRole: (id: string, payload: Partial<RoleUpsertPayload>) =>
    unwrapData(api.patch<ApiEnvelope<RoleRecord>>(`/admin/roles/${id}`, payload)),
  getUsers: () => unwrapData(api.get<ApiEnvelope<CompanyUserRecord[]>>('/admin/users')),
  createUser: (payload: CompanyUserCreatePayload) =>
    unwrapData(
      api.post<ApiEnvelope<{ user: CompanyUserRecord; temporaryPassword: string }>>('/admin/users', payload),
    ),
  updateUser: (id: string, payload: CompanyUserUpdatePayload) =>
    unwrapData(api.patch<ApiEnvelope<CompanyUserRecord>>(`/admin/users/${id}`, payload)),
  resetUserPassword: (id: string, temporaryPassword?: string) =>
    unwrapData(
      api.post<ApiEnvelope<{ success: boolean; temporaryPassword: string }>>(
        `/admin/users/${id}/reset-password`,
        temporaryPassword ? { temporaryPassword } : {},
      ),
    ),
};

export const itemsAPI = {
  getAll: (params?: Record<string, string>) => api.get('/items', { params }),
  getById: (id: string) => api.get(`/items/${id}`),
  create: (data: Record<string, unknown>) => api.post('/items', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};

export const partiesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/parties', { params }),
  getById: (id: string) => api.get(`/parties/${id}`),
  create: (data: Record<string, unknown>) => api.post('/parties', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/parties/${id}`, data),
  delete: (id: string) => api.delete(`/parties/${id}`),
};

export const purchasesAPI = {
  getAll: (params?: Record<string, string>) => api.get('/purchases', { params }),
  create: (data: Record<string, unknown>) => api.post('/purchases', data),
};

export const materialIssueAPI = {
  getAll: (params?: Record<string, string>) => api.get('/material-issues', { params }),
  create: (data: Record<string, unknown>) => api.post('/material-issues', data),
};

export const productionAPI = {
  getAll: (params?: Record<string, string>) => api.get('/production', { params }),
  create: (data: Record<string, unknown>) => api.post('/production', data),
};

export const dashboardAPI = {
  getKPIs: () => api.get('/dashboard/kpis'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getLowStockAlerts: () => api.get('/dashboard/low-stock'),
};

export const reportsAPI = {
  stock: (params?: Record<string, string>) => api.get('/reports/stock', { params }),
  sales: (params?: Record<string, string>) => api.get('/reports/sales', { params }),
  production: (params?: Record<string, string>) => api.get('/reports/production', { params }),
};
