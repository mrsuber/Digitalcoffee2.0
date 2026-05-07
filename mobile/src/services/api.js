import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your VPS IP or domain when deploying
const API_URL = __DEV__
  ? 'http://localhost:5000/api'  // Development
  : 'https://digitalcoffee.cafe/api';  // Production - HTTPS domain with SSL

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('🚀 Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    console.log('✅ API response received:', {
      status: response.status,
      url: response.config?.url
    });
    return response.data;
  },
  async (error) => {
    console.error('❌ API error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    const originalRequest = error.config;

    // Skip token refresh for auth endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/register') ||
                          originalRequest?.url?.includes('/auth/login');

    // If access token expired, try to refresh it (but not for auth endpoints)
    if (error.response?.status === 403 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.log('⚠️ No refresh token available, clearing storage');
          // No refresh token, logout user
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('user');
          return Promise.reject(error);
        }

        console.log('🔄 Attempting to refresh access token');
        // Try to refresh the access token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        if (response.data.success) {
          const { accessToken } = response.data.data;
          console.log('✅ Token refreshed successfully');

          // Save new access token
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Refresh failed, clear auth and logout
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    // For other 401/403 errors or if refresh failed (but not for auth endpoints)
    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthEndpoint) {
      console.log('⚠️ Clearing auth due to 401/403 error');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }),

  verifyResetToken: (token) =>
    api.get(`/auth/verify-reset-token/${token}`),
};

// Mood endpoints
export const moodAPI = {
  createCheckin: (mood, focus_level, daily_goal, emoji_rating) =>
    api.post('/mood/checkin', { mood, focus_level, daily_goal, emoji_rating }),

  getCheckins: (limit = 30) =>
    api.get(`/mood/checkins?limit=${limit}`),

  getTodayMood: () =>
    api.get('/mood/today'),
};

// Course endpoints
export const courseAPI = {
  getAllCourses: () =>
    api.get('/courses'),

  getCourse: (id) =>
    api.get(`/courses/${id}`),

  enroll: (courseId) =>
    api.post(`/courses/${courseId}/enroll`),

  getEnrolled: () =>
    api.get('/courses/user/enrolled'),

  updateProgress: (enrollmentId, current_day) =>
    api.put(`/courses/enrollment/${enrollmentId}/progress`, { current_day }),

  completeCourse: (enrollmentId) =>
    api.post(`/courses/enrollment/${enrollmentId}/complete`),
};

// Audio endpoints
export const audioAPI = {
  getAudioContent: (type, brainwave_type) => {
    let url = '/audio';
    const params = [];
    if (type) params.push(`type=${type}`);
    if (brainwave_type) params.push(`brainwave_type=${brainwave_type}`);
    if (params.length) url += `?${params.join('&')}`;
    return api.get(url);
  },

  getAudio: (id) =>
    api.get(`/audio/${id}`),

  startSession: (audioId, course_session_id) =>
    api.post(`/audio/${audioId}/start`, { course_session_id }),

  updateProgress: (sessionId, duration_listened_seconds) =>
    api.put(`/audio/session/${sessionId}/progress`, { duration_listened_seconds }),

  completeSession: (sessionId, duration_listened_seconds) =>
    api.post(`/audio/session/${sessionId}/complete`, { duration_listened_seconds }),

  getHistory: (limit = 50) =>
    api.get(`/audio/user/history?limit=${limit}`),
};

// Progress endpoints
export const progressAPI = {
  getOverview: (days = 30) =>
    api.get(`/progress/overview?days=${days}`),

  getToday: () =>
    api.get('/progress/today'),

  updateProgress: (data) =>
    api.post('/progress/update', data),

  getInsights: () =>
    api.get('/progress/insights'),
};

// Journal endpoints
export const journalAPI = {
  createEntry: (content, mood, tags) =>
    api.post('/journal', { content, mood, tags }),

  getEntries: (limit = 50, mood, favorites_only) => {
    let url = `/journal?limit=${limit}`;
    if (mood) url += `&mood=${mood}`;
    if (favorites_only) url += `&favorites_only=true`;
    return api.get(url);
  },

  getEntry: (id) =>
    api.get(`/journal/${id}`),

  updateEntry: (id, data) =>
    api.put(`/journal/${id}`, data),

  deleteEntry: (id) =>
    api.delete(`/journal/${id}`),
};

export default api;
