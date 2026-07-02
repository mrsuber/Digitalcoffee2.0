import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Star,
  MessageSquare,
  Video,
  Clock,
  LogOut
} from 'lucide-react';

export default function CoachLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/coach', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/coach/students', icon: Users, label: 'My Students' },
    { path: '/coach/availability', icon: Clock, label: 'Availability' },
    { path: '/coach/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/coach/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/coach/video-sessions', icon: Video, label: 'Video Sessions' },
    { path: '/coach/reviews', icon: Star, label: 'Reviews' },
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Digital Coffee
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Coach Portal
        </p>

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
            <p style={{
              fontSize: '0.75rem',
              color: '#10b981',
              marginTop: '0.5rem',
              fontWeight: '500'
            }}>
              Professional Coach
            </p>
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
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: '#f9fafb' }}>
        <Outlet />
      </div>
    </div>
  );
}
