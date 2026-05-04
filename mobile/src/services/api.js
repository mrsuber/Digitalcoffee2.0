import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your VPS IP or domain when deploying
const API_URL = __DEV__
  ? 'http://localhost:5000/api'  // Development
  : 'https://digitalcoffee.cafe/api';  // Production

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
    const token = await AsyncStorage.getItem('authToken');
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
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      await AsyncStorage.removeItem('authToken');
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
