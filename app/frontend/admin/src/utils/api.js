import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token and CSRF token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const csrfToken = localStorage.getItem('csrfToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for non-GET requests
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
};

// Testimonials API
export const testimonialsAPI = {
  getPending: () => api.get('/admin/testimonials/pending'),
  getAll: (params) => api.get('/admin/testimonials', { params }),
  approve: (id) => api.post(`/admin/testimonials/${id}/approve`),
  reject: (id) => api.post(`/admin/testimonials/${id}/reject`),
  updateFeatured: (id, featured) => api.patch(`/admin/testimonials/${id}/featured`, { featured }),
  updateVisibility: (id, visible) => api.patch(`/admin/testimonials/${id}/visibility`, { visible }),
  delete: (id) => api.delete(`/admin/testimonials/${id}`),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/admin/users'),
  create: (userData) => api.post('/admin/users', userData),
  update: (id, userData) => api.put(`/admin/users/${id}`, userData),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

export default api;