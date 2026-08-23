import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api/v1'
    : 'https://backend-cyan-seven-55.vercel.app/api/v1'
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  registerInitial: (data) => api.post('/auth/register-initial', data),
  getMe: () => api.get('/auth/me'),
};

// Product Services
export const productService = {
  list: (params) => api.get('/products', { params }),
  lookup: (code) => api.get(`/products/lookup/${code}`),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  adjustStock: (data) => api.post('/products/adjust-stock', data),
  bulkConvert: (data) => api.post('/products/bulk-convert', data),
  getAdjustmentLogs: () => api.get('/products/adjustments/log'),
};

// Customer Services
export const customerService = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getLedger: (id) => api.get(`/customers/${id}/ledger`),
};

// Supplier Services
export const supplierService = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Purchase Services
export const purchaseService = {
  list: (params) => api.get('/purchases', { params }),
  create: (data) => api.post('/purchases', data),
};

// Sale Services
export const saleService = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  createInvoice: (data) => api.post('/sales', data),
  getPdfUrl: (id) => `${API_BASE_URL}/sales/${id}/pdf`,
};

// Payment Services
export const paymentService = {
  list: (params) => api.get('/payments', { params }),
  recordPayment: (data) => api.post('/payments', data),
};

// Report Services
export const reportService = {
  getDashboard: () => api.get('/reports/dashboard'),
  getTopSelling: (limit = 10) => api.get(`/reports/top-selling?limit=${limit}`),
  getDeadStock: (days = 30) => api.get(`/reports/dead-stock?days=${days}`),
  getOutstandingCredit: () => api.get('/reports/outstanding-credit'),
  getLowStock: () => api.get('/reports/low-stock'),
  getProfitMargin: () => api.get('/reports/profit-margin'),
};

// System Seed Service
export const seedService = {
  seed: () => api.post('/seed'),
};

export default api;
