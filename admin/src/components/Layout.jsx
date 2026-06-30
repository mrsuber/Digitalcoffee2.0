import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, BookOpen, Music, Heart, Brain, LogOut, ListChecks, TrendingUp, UserCheck, MessageSquare, Bell, GraduationCap, CreditCard, UserX, MessageCircle, Activity, Video, VideoOff, BarChart } from 'lucide-react';

export default function Layout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect coaches to coach portal
  React.useEffect(() => {
    if (admin?.role === 'professional_coach') {
      navigate('/coach', { replace: true });
    }
  }, [admin, navigate]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/user-activity', icon: Activity, label: 'User Activity' },
    { path: '/journals', icon: BookOpen, label: 'Journals' },
    { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
    { path: '/deletion-analytics', icon: UserX, label: 'Deletion Analytics' },
    { path: '/feedback', icon: MessageCircle, label: 'Feedback' },
    { path: '/professional-coaches', icon: GraduationCap, label: 'Professional Coaches' },
    { path: '/coaching-analytics', icon: UserCheck, label: 'Coaching Analytics' },
    { path: '/video-calls', icon: Video, label: 'Video Calls' },
    { path: '/call-recordings', icon: VideoOff, label: 'Call Recordings' },
    { path: '/call-analytics', icon: BarChart, label: 'Call Analytics' },
    { path: '/progress-analytics', icon: TrendingUp, label: 'Progress Analytics' },
    { path: '/mood-analytics', icon: Heart, label: 'Mood Analytics' },
    { path: '/focus-sessions', icon: Brain, label: 'Focus Sessions' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/audio', icon: Music, label: 'Audio Content' },
    { path: '/community', icon: MessageSquare, label: 'Community' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/feature-status', icon: ListChecks, label: 'Feature Status' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: '#1f2937',
        color: 'white',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Digital Coffee</h2>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: 'white',
                  background: isActive ? '#374151' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <Icon size={20} style={{ marginRight: '0.75rem' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '1rem', background: '#374151', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{admin?.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{admin?.email}</p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} style={{ marginRight: '0.75rem' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
