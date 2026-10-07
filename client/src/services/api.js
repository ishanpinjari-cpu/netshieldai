import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor – attach JWT
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  getMe: () => api.get('/auth/me'),
};

// Packets
export const packetAPI = {
  getAll: (params) => api.get('/packets', { params }),
  getStats: () => api.get('/packets/stats'),
};

// Alerts
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getStats: () => api.get('/alerts/stats'),
  update: (id, data) => api.put(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// Devices
export const deviceAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getStats: () => api.get('/devices/stats'),
  update: (id, data) => api.put(`/devices/${id}`, data),
};

// Threats
export const threatAPI = {
  getAll: (params) => api.get('/threats', { params }),
  getById: (id) => api.get(`/threats/${id}`),
  search: (query) => api.get('/threats/search', { params: { q: query } }),
};

// Analytics
export const analyticsAPI = {
  getTraffic: (params) => api.get('/analytics/traffic', { params }),
  getProtocolDist: () => api.get('/analytics/protocol-distribution'),
  getTrends: (period) => api.get(`/analytics/trends/${period}`),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getAttackFrequency: () => api.get('/analytics/attack-frequency'),
};

// Logs
export const logAPI = {
  getAll: (params) => api.get('/logs', { params }),
  export: (format, params) => api.get(`/logs/export/${format}`, {
    params,
    responseType: 'blob',
  }),
};

// ML
export const mlAPI = {
  predict: (data) => api.post('/ml/predict', data),
  train: (data) => api.post('/ml/train', data),
  getModels: () => api.get('/ml/models'),
  getMetrics: (model) => api.get(`/ml/metrics/${model}`),
  simulate: (action) => api.post('/ml/simulate', { action }),
  getInsights: () => api.get('/ml/insights'),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
