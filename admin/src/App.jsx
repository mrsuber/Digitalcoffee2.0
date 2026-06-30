import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Courses from './pages/Courses';
import AudioContent from './pages/AudioContent';
import MoodAnalytics from './pages/MoodAnalytics';
import FocusSessions from './pages/FocusSessions';
import FeatureStatus from './pages/FeatureStatus';
import ProgressAnalytics from './pages/ProgressAnalytics';
import CoachingAnalytics from './pages/CoachingAnalytics';
import CommunityManagement from './pages/CommunityManagement';
import NotificationsManagement from './pages/NotificationsManagement';
import ProfessionalCoaches from './pages/ProfessionalCoaches';
import DeletionAnalytics from './pages/DeletionAnalytics';
import Layout from './components/Layout';
import CoachLayout from './components/CoachLayout';
import CoachDashboard from './pages/CoachDashboard';
import CoachStudents from './pages/CoachStudents';
import CoachStudentDetail from './pages/CoachStudentDetail';
import CoachSessions from './pages/CoachSessions';
import CoachReviews from './pages/CoachReviews';
import CoachMessaging from './pages/CoachMessaging';
import CoachVideoSessions from './pages/CoachVideoSessions';
import CoachVideoCall from './pages/CoachVideoCall';
import SubscriptionManagement from './pages/SubscriptionManagement';
import FeedbackManagement from './pages/FeedbackManagement';
import UserActivity from './pages/UserActivity';
import JournalManagement from './pages/JournalManagement';
import VideoCallManagement from './pages/VideoCallManagement';
import CallRecordings from './pages/CallRecordings';
import CallAnalytics from './pages/CallAnalytics';

function PrivateRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, admin } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  console.log('PrivateRoute - Admin role:', admin?.role, 'Allowed roles:', allowedRoles);

  // Always check role for coaches and redirect them
  if (admin?.role === 'professional_coach' && allowedRoles.includes('admin')) {
    console.log('Redirecting coach to coach');
    return <Navigate to="/coach" replace />;
  }

  // If allowedRoles is specified, check if user has the required role
  if (allowedRoles.length > 0 && admin?.role && !allowedRoles.includes(admin.role)) {
    // Redirect non-coaches back to login (shouldn't happen, but safety check)
    console.log('User role not allowed, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
}

function CoachRoute({ children }) {
  const { isAuthenticated, loading, admin } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Only allow professional coaches
  if (admin?.role !== 'professional_coach') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RootRedirect() {
  const { admin } = useAuth();

  // Redirect coaches to coach portal, admins to admin dashboard
  if (admin?.role === 'professional_coach') {
    return <Navigate to="/coach" replace />;
  }

  return <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<Login />} />

          {/* Admin Routes - Only for admins */}
          <Route
            path="/"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} replace />
            <Route path="users" element={<Users />} />
            <Route path="courses" element={<Courses />} />
            <Route path="audio" element={<AudioContent />} />
            <Route path="mood-analytics" element={<MoodAnalytics />} />
            <Route path="focus-sessions" element={<FocusSessions />} />
            <Route path="progress-analytics" element={<ProgressAnalytics />} />
            <Route path="coaching-analytics" element={<CoachingAnalytics />} />
            <Route path="professional-coaches" element={<ProfessionalCoaches />} />
            <Route path="community" element={<CommunityManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="subscriptions" element={<SubscriptionManagement />} />
            <Route path="deletion-analytics" element={<DeletionAnalytics />} />
            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="feature-status" element={<FeatureStatus />} />
            <Route path="user-activity" element={<UserActivity />} />
            <Route path="journals" element={<JournalManagement />} />
            <Route path="video-calls" element={<VideoCallManagement />} />
            <Route path="call-recordings" element={<CallRecordings />} />
            <Route path="call-analytics" element={<CallAnalytics />} />
          </Route>

          {/* Coach Routes - Only for professional coaches */}
          <Route
            path="coach"
            element={
              <CoachRoute>
                <CoachLayout />
              </CoachRoute>
            }
          >
            <Route index element={<CoachDashboard />} />
            <Route path="students" element={<CoachStudents />} />
            <Route path="students/:studentId" element={<CoachStudentDetail />} />
            <Route path="sessions" element={<CoachSessions />} />
            <Route path="messages" element={<CoachMessaging />} />
            <Route path="reviews" element={<CoachReviews />} />
            <Route path="video-sessions" element={<CoachVideoSessions />} />
          </Route>

          {/* Video Call Route - Full screen, outside CoachLayout */}
          <Route
            path="coach/video-call/student/:studentId"
            element={
              <CoachRoute>
                <CoachVideoCall />
              </CoachRoute>
            }
          />
        </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
