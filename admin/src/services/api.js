import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://digitalcoffee.cafe/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin Auth API
export const adminAuthAPI = {
  login: (email, password) =>
    api.post('/admin/login', { email, password }),
};

// Admin Stats API
export const adminStatsAPI = {
  getStats: () => api.get('/admin/stats'),
};

// Admin Users API
export const adminUsersAPI = {
  getUsers: (page = 1, limit = 20, search = '') =>
    api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`),

  getUser: (id) =>
    api.get(`/admin/users/${id}`),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),
};

// Admin Courses API
export const adminCoursesAPI = {
  getCourses: () =>
    api.get('/admin/courses'),

  createCourse: (data) =>
    api.post('/admin/courses', data),

  updateCourse: (id, data) =>
    api.put(`/admin/courses/${id}`, data),

  deleteCourse: (id) =>
    api.delete(`/admin/courses/${id}`),
};

// Admin Audio API
export const adminAudioAPI = {
  getAudioContent: () =>
    api.get('/admin/audio'),

  createAudioContent: (data) =>
    api.post('/admin/audio', data),

  updateAudioContent: (id, data) =>
    api.put(`/admin/audio/${id}`, data),

  deleteAudioContent: (id) =>
    api.delete(`/admin/audio/${id}`),
};

export default api;
