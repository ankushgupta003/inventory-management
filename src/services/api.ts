import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API service functions
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
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

export const piAPI = {
  getAll: (params?: Record<string, string>) => api.get('/proforma-invoices', { params }),
  getById: (id: string) => api.get(`/proforma-invoices/${id}`),
  create: (data: Record<string, unknown>) => api.post('/proforma-invoices', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/proforma-invoices/${id}`, data),
};

export const invoiceAPI = {
  getAll: (params?: Record<string, string>) => api.get('/invoices', { params }),
  createFromPI: (piId: string, data: Record<string, unknown>) => api.post(`/invoices/from-pi/${piId}`, data),
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
