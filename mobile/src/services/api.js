import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL with HTTPS
export const API_URL = 'https://digitalcoffee.cafe/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for video calling endpoints
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
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
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;

    // Skip token refresh for auth endpoints
    const isAuthEndpoint = url?.includes('/auth/register') || url?.includes('/auth/login');

    // Differentiate between expected authentication errors and actual errors
    if (isAuthEndpoint && (status === 401 || status === 400)) {
      // Expected validation error (wrong credentials, validation failures, etc.)
      console.log('⚠️ Authentication validation error:', {
        status,
        url,
        message: error.response?.data?.message || 'Validation failed'
      });
    } else if (status === 403) {
      // Token expired - this is expected, will try to refresh
      console.log('🔄 Access token expired, will attempt refresh');
    } else if (status >= 500) {
      // Server error - this is a real problem
      console.error('❌ Server error:', {
        status,
        statusText: error.response?.statusText,
        url,
        message: error.response?.data?.message || error.message
      });
    } else if (!error.response) {
      // Network error - no response from server
      console.error('❌ Network error:', {
        message: error.message,
        url
      });
    } else {
      // Other client errors (404, 409, etc.)
      console.log('⚠️ API client error:', {
        status,
        url,
        message: error.response?.data?.message || error.message
      });
    }

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
  register: (email, password, name, subscriptionType = 'free') =>
    api.post('/auth/register', { email, password, name, subscriptionType }),

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

  switchSubscription: (subscriptionType) =>
    api.post('/auth/switch-subscription', { subscriptionType }),

  deleteAccount: (password, reason) =>
    api.post('/auth/delete-account', { password, reason }),
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

  getRecentSessions: () =>
    api.get('/audio/user/recent-sessions'),
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

  getStats: (days = 7) =>
    api.get(`/progress/stats?days=${days}`),
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

// Community endpoints
export const communityAPI = {
  getPosts: (limit = 20, offset = 0) =>
    api.get(`/community/posts?limit=${limit}&offset=${offset}`),

  createPost: (content, mood, session_minutes) =>
    api.post('/community/posts', { content, mood, session_minutes }),

  likePost: (postId) =>
    api.post(`/community/posts/${postId}/like`),

  deletePost: (postId) =>
    api.delete(`/community/posts/${postId}`),

  getMyPosts: (limit = 20, offset = 0) =>
    api.get(`/community/posts/me?limit=${limit}&offset=${offset}`),

  reportPost: (postId) =>
    api.post(`/community/posts/${postId}/report`),

  // Comment endpoints
  getComments: (postId) =>
    api.get(`/community/posts/${postId}/comments`),

  createComment: (postId, content, parent_comment_id = null) =>
    api.post(`/community/posts/${postId}/comments`, { content, parent_comment_id }),

  deleteComment: (commentId) =>
    api.delete(`/community/comments/${commentId}`),
};

// Coaching endpoints
export const coachingAPI = {
  sendRequest: (coach_id, message) =>
    api.post('/coaching/request', { coach_id, message }),

  getIncomingRequests: () =>
    api.get('/coaching/requests/incoming'),

  getOutgoingRequests: () =>
    api.get('/coaching/requests/outgoing'),

  acceptRequest: (requestId) =>
    api.post(`/coaching/requests/${requestId}/accept`),

  rejectRequest: (requestId) =>
    api.post(`/coaching/requests/${requestId}/reject`),

  getMyStudents: () =>
    api.get('/coaching/students'),

  getMyCoach: () =>
    api.get('/coaching/my-coach'),

  getStudentProgress: (studentId) =>
    api.get(`/coaching/students/${studentId}/progress`),

  endRelationship: (relationshipId) =>
    api.post(`/coaching/relationships/${relationshipId}/end`),

  getCoachingProfile: (userId) =>
    api.get(`/coaching/profile/${userId}`),

  // Messaging
  sendMessage: (relationship_id, message) =>
    api.post('/coaching/messages', { relationship_id, message }),

  getMessages: (relationshipId) =>
    api.get(`/coaching/messages/${relationshipId}`),

  getUnreadMessageCount: () =>
    api.get('/coaching/messages/unread/count'),

  // Check-ins
  createCheckin: (relationship_id, notes) =>
    api.post('/coaching/checkins', { relationship_id, notes }),

  getCheckins: (relationshipId) =>
    api.get(`/coaching/checkins/${relationshipId}`),

  // Ratings
  submitRating: (relationship_id, rating, feedback) =>
    api.post('/coaching/ratings', { relationship_id, rating, feedback }),

  getCoachRatings: (coachId) =>
    api.get(`/coaching/ratings/${coachId}`),

  // Dashboard
  getCoachDashboard: () =>
    api.get('/coaching/dashboard/coach'),

  getAdminAnalytics: () =>
    api.get('/coaching/admin/analytics'),
};

// Notification endpoints
export const notificationAPI = {
  getNotifications: (limit = 50, offset = 0, unread_only = false) =>
    api.get(`/notifications?limit=${limit}&offset=${offset}&unread_only=${unread_only}`),

  getUnreadCount: () =>
    api.get('/notifications/count'),

  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.put('/notifications/read-all'),

  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`),

  clearRead: () =>
    api.delete('/notifications/clear-read'),
};

// Professional Coaches endpoints (Premium feature)
export const professionalCoachesAPI = {
  // Browse coaches (uses /professional-coaches route)
  getAll: (specialty = null, rating = null, limit = 20) => {
    let url = `/professional-coaches?limit=${limit}`;
    if (specialty) url += `&specialty=${specialty}`;
    if (rating) url += `&rating=${rating}`;
    return api.get(url);
  },

  getById: (id) =>
    api.get(`/professional-coaches/${id}`),

  // Premium actions (uses /professional-coaching route)
  requestCoaching: (coach_id, goals = []) =>
    api.post(`/professional-coaching/request-coach`, { coach_id, goals }),

  getMyCoaches: () =>
    api.get('/professional-coaching/my-coaches'),

  getMyPrograms: () =>
    api.get('/professional-coaching/my-programs'),

  enrollInProgram: (programId) =>
    api.post(`/professional-coaching/programs/${programId}/enroll`),

  reviewCoach: (coachId, rating, review) =>
    api.post(`/professional-coaching/coaches/${coachId}/review`, { rating, review }),

  // Subscription endpoints
  getSubscriptionPlans: () =>
    api.get('/professional-coaching/subscription/plans'),

  getSubscriptionStatus: () =>
    api.get('/professional-coaching/subscription/status'),

  // Messaging endpoints
  getMessages: (relationshipId) =>
    api.get(`/professional-coaching/messages/${relationshipId}`),

  sendMessage: (relationshipId, message) =>
    api.post(`/professional-coaching/messages/${relationshipId}`, { message }),
};

// Subscription/Payment endpoints
export const subscriptionAPI = {
  getStatus: () =>
    api.get('/subscription/status'),

  createPaymentIntent: (plan) =>
    api.post('/subscription/create-payment-intent', { plan }),

  confirmPayment: (payment_intent_id, plan) =>
    api.post('/subscription/confirm-payment', { payment_intent_id, plan }),

  getHistory: () =>
    api.get('/subscription/history'),

  cancel: () =>
    api.post('/subscription/cancel'),
};

// Feedback endpoints
export const feedbackAPI = {
  submit: (type, subject, description) =>
    api.post('/feedback/submit', { type, subject, description }),

  getMyFeedback: () =>
    api.get('/feedback/my-feedback'),
};

// Video Calling endpoints (Premium feature)
export const videoCallsAPI = {
  // Coach availability
  getCoachWeeklySchedule: (coachId) =>
    api.get(`/video-calls/coaches/${coachId}/weekly-schedule`),

  getCoachAvailability: (coachId, date) =>
    api.get(`/video-calls/coaches/${coachId}/availability${date ? `?date=${date}` : ''}`),

  setAvailability: (dayOfWeek, startTime, endTime) =>
    api.post('/video-calls/coach/availability', { dayOfWeek, startTime, endTime }),

  getMyAvailability: () =>
    api.get('/video-calls/coach/availability'),

  deleteAvailability: (id) =>
    api.delete(`/video-calls/coach/availability/${id}`),

  blockSlot: (blockedDate, startTime, endTime, reason) =>
    api.post('/video-calls/coach/block-slot', { blockedDate, startTime, endTime, reason }),

  unblockSlot: (id) =>
    api.delete(`/video-calls/coach/block-slot/${id}`),

  // Bookings
  createBooking: (coachId, scheduledAt, bookingNotes) =>
    api.post('/video-calls/bookings', { coachId, scheduledAt, bookingNotes }),

  getMyBookings: (status, upcoming) =>
    api.get(`/video-calls/bookings?${status ? `status=${status}&` : ''}${upcoming ? 'upcoming=true' : ''}`),

  cancelBooking: (id) =>
    api.delete(`/video-calls/bookings/${id}`),

  // Sessions
  joinSession: (bookingId) =>
    api.post('/video-calls/sessions/join', { bookingId }),

  getSessionHistory: (limit = 20) =>
    api.get(`/video-calls/sessions/history?limit=${limit}`),

  // Instant Calls
  initiateInstantCall: (studentId) =>
    api.post('/video-calls/instant-call/initiate', { studentId }),

  getPendingCalls: () =>
    api.get('/video-calls/instant-call/pending'),

  answerCall: (sessionId) =>
    api.post(`/video-calls/instant-call/${sessionId}/answer`),

  rejectCall: (sessionId) =>
    api.post(`/video-calls/instant-call/${sessionId}/reject`),

  cancelCall: (sessionId, reason) =>
    api.post(`/video-calls/instant-call/${sessionId}/cancel`, { reason }),
};

// FCM Token Management
api.saveFCMToken = async (fcmToken) => {
  try {
    await api.post('/auth/fcm-token', { fcmToken });
    console.log('✅ FCM token saved to backend');
    return true;
  } catch (error) {
    console.error('❌ Failed to save FCM token:', error);
    return false;
  }
};

// Legal Documents endpoints
export const legalAPI = {
  getTermsOfService: () =>
    api.get('/legal/documents/terms_of_service'),

  getPrivacyPolicy: () =>
    api.get('/legal/documents/privacy_policy'),

  getAllDocuments: () =>
    api.get('/legal/documents'),
};

export default api;
