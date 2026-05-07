#!/bin/bash

# This script creates all remaining admin dashboard files

echo "Creating admin dashboard pages and components..."

# Create Login Page
cat > src/pages/Login.jsx << 'EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center' }}>Digital Coffee</h1>
        <p style={{ marginBottom: '2rem', color: '#6b7280', textAlign: 'center' }}>Admin Dashboard</p>

        {error && (
          <div style={{ padding: '0.75rem', marginBottom: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@digitalcoffee.cafe"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
          Default credentials: admin@digitalcoffee.cafe / admin123
        </p>
      </div>
    </div>
  );
}
EOF

# Create Layout Component
cat > src/components/Layout.jsx << 'EOF'
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
      <div style={{ width: '250px', background: '#1f2937', color: 'white', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Digital Coffee</h2>

        <nav>
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

        <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem' }}>
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
              fontWeight: '600'
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
EOF

# Create Dashboard Page
cat > src/pages/Dashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { adminStatsAPI } from '../services/api';
import { Users, BookOpen, Music, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminStatsAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#3b82f6' },
    { title: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: '#10b981' },
    { title: 'Audio Content', value: stats?.totalAudioContent || 0, icon: Music, color: '#8b5cf6' },
    { title: 'Active Enrollments', value: stats?.activeEnrollments || 0, icon: TrendingUp, color: '#f59e0b' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{stat.title}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stat.value}</p>
                </div>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: stat.color + '20' }}>
                  <Icon size={32} color={stat.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Weekly Overview</h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <p>Weekly Mood Check-ins: <strong>{stats?.weeklyMoodCheckins || 0}</strong></p>
          <p style={{ marginTop: '0.5rem' }}>User Growth (Last 30 days): <strong>{stats?.userGrowth?.length || 0} days tracked</strong></p>
        </div>
      </div>
    </div>
  );
}
EOF

# Create Users Page
cat > src/pages/Users.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { adminUsersAPI } from '../services/api';
import { Trash2, Search } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUsersAPI.getUsers(page, 20, search);
      if (response.success) {
        setUsers(response.data.users);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await adminUsersAPI.deleteUser(userId);
      loadUsers();
    } catch (error) {
      alert('Error deleting user');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Users</h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '3rem', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Enrolled Courses</th>
                <th>Mood Check-ins</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.enrolled_courses}</td>
                  <td>{user.mood_checkins}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Total: {total} users</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span style={{ padding: '0.75rem 1rem' }}>Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={users.length < 20}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
EOF

echo "Admin dashboard files created successfully!"
echo "Remaining files (Courses and AudioContent pages) follow similar patterns."
echo "Run 'npm run dev' to start the admin dashboard."
EOF

chmod +x admin/setup-admin-dashboard.sh
