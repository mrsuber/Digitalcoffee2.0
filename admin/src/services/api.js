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
    // Don't redirect to login if this is the login request itself
    const isLoginRequest = error.config?.url?.includes('/admin/login');

    if ((error.response?.status === 401 || error.response?.status === 403) && !isLoginRequest) {
      console.error('Authentication error, redirecting to login...');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
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

// Admin Mood Analytics API
export const adminMoodAPI = {
  getMoodAnalytics: (period = '30') =>
    api.get(`/admin/mood-analytics?period=${period}`),
};

// Admin Focus Sessions API
export const adminFocusSessionsAPI = {
  getFocusSessions: (period = '30', page = 1, limit = 50) =>
    api.get(`/admin/focus-sessions?period=${period}&page=${page}&limit=${limit}`),
};

// Admin Engagement Metrics API
export const adminEngagementAPI = {
  getEngagementMetrics: (period = '30') =>
    api.get(`/admin/engagement-metrics?period=${period}`),
};

// Admin Progress Analytics API
export const adminProgressAPI = {
  getAnalytics: (days = '7') =>
    api.get(`/admin/progress/analytics?days=${days}`),
};

// Admin Community API
export const adminCommunityAPI = {
  getPosts: (limit = 50) =>
    api.get(`/admin/community/posts?limit=${limit}`),

  getComments: (limit = 50) =>
    api.get(`/admin/community/comments?limit=${limit}`),

  getPostReports: (postId) =>
    api.get(`/admin/community/posts/${postId}/reports`),

  deletePost: (postId) =>
    api.delete(`/admin/community/posts/${postId}`),

  deleteComment: (commentId) =>
    api.delete(`/admin/community/comments/${commentId}`),
};

// Admin Professional Coaches API
export const adminCoachesAPI = {
  getCoaches: (search = '', status = '', specialty = '') =>
    api.get(`/admin/professional-coaches?search=${search}&status=${status}&specialty=${specialty}`),

  getCoach: (id) =>
    api.get(`/admin/professional-coaches/${id}`),

  createCoach: (coachData) =>
    api.post('/admin/professional-coaches', coachData),

  updateCoach: (id, coachData) =>
    api.put(`/admin/professional-coaches/${id}`, coachData),

  deleteCoach: (id) =>
    api.delete(`/admin/professional-coaches/${id}`),

  activateCoach: (id) =>
    api.put(`/admin/professional-coaches/${id}/status`, { is_active: true }),

  deactivateCoach: (id) =>
    api.put(`/admin/professional-coaches/${id}/status`, { is_active: false }),

  getCoachStudents: (id) =>
    api.get(`/admin/professional-coaches/${id}/students`),

  getCoachAnalytics: (id) =>
    api.get(`/admin/professional-coaches/${id}/analytics`),

  // Video Calling Management
  getVideoCallBookings: () =>
    api.get('/admin/video-calls/bookings'),

  getVideoCallSessions: () =>
    api.get('/admin/video-calls/sessions'),

  getVideoCallRecordings: () =>
    api.get('/admin/video-calls/recordings'),

  deleteVideoCallRecording: (id) =>
    api.delete(`/admin/video-calls/recordings/${id}`),

  getVideoCallAnalytics: (days = 30) =>
    api.get(`/admin/video-calls/analytics?days=${days}`),
};

// Coach API (for professional coaches logged in to manage their students)
export const coachAPI = {
  getProfile: () =>
    api.get('/coach/profile'),

  getStudents: () =>
    api.get('/coach/students'),

  getStudent: (studentId) =>
    api.get(`/coach/students/${studentId}`),

  getSessions: (status, limit = 50) =>
    api.get(`/coach/sessions?${status ? `status=${status}&` : ''}limit=${limit}`),

  updateSessionNotes: (sessionId, notes) =>
    api.put(`/coach/sessions/${sessionId}/notes`, { notes }),

  completeSession: (sessionId, notes) =>
    api.post(`/coach/sessions/${sessionId}/complete`, { notes }),

  getAnalytics: (days = 30) =>
    api.get(`/coach/analytics?days=${days}`),

  getReviews: (limit = 20) =>
    api.get(`/coach/reviews?limit=${limit}`),

  // Application management
  getPendingApplications: () =>
    api.get('/coach/applications/pending'),

  acceptApplication: (relationshipId) =>
    api.post(`/coach/applications/${relationshipId}/accept`),

  rejectApplication: (relationshipId, reason) =>
    api.post(`/coach/applications/${relationshipId}/reject`, { reason }),

  // Messaging
  getConversations: () =>
    api.get('/coach/conversations'),

  getMessages: (studentId, limit = 50) =>
    api.get(`/coach/messages/${studentId}?limit=${limit}`),

  sendMessage: (studentId, message) =>
    api.post(`/coach/messages/${studentId}`, { message }),

  // Video Calling
  getVideoBookings: () =>
    api.get('/video-calls/bookings'),

  getMyAvailability: () =>
    api.get('/video-calls/coach/availability'),

  setAvailability: (dayOfWeek, startTime, endTime) =>
    api.post('/video-calls/coach/availability', { dayOfWeek, startTime, endTime }),

  deleteAvailability: (id) =>
    api.delete(`/video-calls/coach/availability/${id}`),

  blockSlot: (blockedDate, startTime, endTime, reason) =>
    api.post('/video-calls/coach/block-slot', { blockedDate, startTime, endTime, reason }),

  unblockSlot: (id) =>
    api.delete(`/video-calls/coach/block-slot/${id}`),

  // Instant calling
  initiateInstantCall: (studentId) =>
    api.post('/video-calls/instant-call/initiate', { studentId }),

  cancelInstantCall: (sessionId, reason = 'coach_ended_call') =>
    api.post(`/video-calls/instant-call/${sessionId}/cancel`, { reason }),
};

// Peer Coaching API (regular users coaching each other)
export const coachingAPI = {
  getMyRatings: () =>
    api.get('/coaching/my-ratings'),

  getRatings: (coachId) =>
    api.get(`/coaching/ratings/${coachId}`),

  submitRating: (relationship_id, rating, feedback) =>
    api.post('/coaching/ratings', { relationship_id, rating, feedback }),
};

// User Activity API
export const userActivityAPI = {
  getOverview: (period = 7) =>
    api.get(`/admin/user-activity/overview?period=${period}`),

  getLogs: (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/user-activity/logs?${params}`);
  },

  getUserActivity: (userId, limit = 50) =>
    api.get(`/admin/user-activity/user/${userId}?limit=${limit}`),

  getActiveNow: () =>
    api.get('/admin/user-activity/active-now'),
};

// Journal Management API
export const journalAPI = {
  getJournals: (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/journals?${params}`);
  },

  getJournalById: (id) =>
    api.get(`/admin/journals/${id}`),

  getUserJournals: (userId, limit = 50) =>
    api.get(`/admin/journals/user/${userId}?limit=${limit}`),

  deleteJournal: (id) =>
    api.delete(`/admin/journals/${id}`),

  getAnalytics: (period = 30) =>
    api.get(`/admin/journals/analytics/overview?period=${period}`),
};

// General admin API wrapper
export const adminAPI = {
  get: (url) => api.get(`/admin${url}`),
  post: (url, data) => api.post(`/admin${url}`, data),
  put: (url, data) => api.put(`/admin${url}`, data),
  delete: (url) => api.delete(`/admin${url}`),
};

export default api;
