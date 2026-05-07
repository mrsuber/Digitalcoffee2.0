import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, BookOpen, Music, LogOut } from 'lucide-react';

export default function Layout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/audio', icon: Music, label: 'Audio Content' },
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
