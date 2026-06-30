import React, { useState, useEffect } from 'react';
import { Users, Activity, Smartphone, Monitor, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { userActivityAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ExportButton from '../components/ExportButton';

export default function UserActivity() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [period, setPeriod] = useState(7);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const toast = useToast();

  const fetchOverview = async () => {
    try {
      const data = await userActivityAPI.getOverview(period);
      setOverview(data.data);
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error('Failed to fetch activity overview');
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const data = await userActivityAPI.getActiveNow();
      setActiveUsers(data.data.users);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await userActivityAPI.getLogs(page, 50, filters);
      setLogs(data.data.logs);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch activity logs');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchOverview(), fetchActiveUsers(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [period, page, filters]);

  // Auto-refresh active users every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActiveUsers();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getActivityBadgeColor = (type) => {
    switch (type) {
      case 'login': return '#10b981';
      case 'logout': return '#6b7280';
      case 'session_start': return '#3b82f6';
      case 'session_end': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={16} />;
      case 'tablet':
        return <Smartphone size={16} />;
      case 'web':
        return <Monitor size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading user activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>User Activity Monitor</h1>
          <p style={{ color: '#6b7280' }}>Track user logins, sessions, and real-time activity</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <ExportButton
            endpoint="/admin/export/user-activity"
            params={{ period }}
            label="Export"
          />
          <button
            onClick={loadAllData}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Now</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {overview?.activeUsersNow || 0}
              </h2>
              <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Users online right now</p>
            </div>
            <Users size={40} style={{ opacity: 0.8 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Today's Logins</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#10b981' }}>
                {overview?.todayLogins || 0}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {overview?.totalUsers > 0 ? Math.round((overview?.todayLogins / overview?.totalUsers) * 100) : 0}% of total users
              </p>
            </div>
            <TrendingUp size={40} style={{ color: '#10b981', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg Session</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#3b82f6' }}>
                {formatDuration(overview?.avgSessionDuration?.avg)}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Min: {formatDuration(overview?.avgSessionDuration?.min)} | Max: {formatDuration(overview?.avgSessionDuration?.max)}
              </p>
            </div>
            <Clock size={40} style={{ color: '#3b82f6', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Users</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {overview?.totalUsers || 0}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Registered accounts</p>
            </div>
            <Users size={40} style={{ color: '#6b7280', opacity: 0.4 }} />
          </div>
        </div>
      </div>

      {/* Active Users Now */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
            Active Users Now ({activeUsers.length})
          </h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
        </div>
        {activeUsers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {activeUsers.map((user) => (
              <div key={user.id} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user.name || 'No Name'}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</p>
                  </div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                  }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Active {formatTimeAgo(user.last_activity_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No users currently active</p>
        )}
      </div>

      {/* Device & Platform Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Device Breakdown</h3>
          {overview?.deviceBreakdown && overview.deviceBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {overview.deviceBreakdown.map((device, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'capitalize' }}>
                      {getDeviceIcon(device.device_type)}
                      {device.device_type || 'Unknown'}
                    </span>
                    <span style={{ fontWeight: '600' }}>{device.count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      background: '#10b981',
                      height: '100%',
                      width: `${(device.count / overview.deviceBreakdown.reduce((sum, d) => sum + parseInt(d.count), 0)) * 100}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No device data available</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Platform Breakdown</h3>
          {overview?.platformBreakdown && overview.platformBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {overview.platformBreakdown.map((platform, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ textTransform: 'capitalize' }}>{platform.platform || 'Unknown'}</span>
                    <span style={{ fontWeight: '600' }}>{platform.count}</span>
                  </div>
                  <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      background: '#6366f1',
                      height: '100%',
                      width: `${(platform.count / overview.platformBreakdown.reduce((sum, p) => sum + parseInt(p.count), 0)) * 100}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No platform data available</p>
          )}
        </div>
      </div>

      {/* Activity Logs */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Activity Logs</h3>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <select
            value={filters.activityType || ''}
            onChange={(e) => setFilters({ ...filters, activityType: e.target.value || undefined })}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          >
            <option value="">All Activities</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="session_start">Session Start</option>
            <option value="session_end">Session End</option>
          </select>

          <select
            value={filters.deviceType || ''}
            onChange={(e) => setFilters({ ...filters, deviceType: e.target.value || undefined })}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          >
            <option value="">All Devices</option>
            <option value="mobile">Mobile</option>
            <option value="web">Web</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Activity</th>
                <th>Device</th>
                <th>Platform</th>
                <th>IP Address</th>
                <th>Duration</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{log.user_name || 'No Name'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{log.user_email}</div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'white',
                      background: getActivityBadgeColor(log.activity_type)
                    }}>
                      {log.activity_type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getDeviceIcon(log.device_type)}
                      <span style={{ textTransform: 'capitalize' }}>{log.device_type || 'Unknown'}</span>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{log.platform || 'Unknown'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip_address || 'N/A'}</td>
                  <td>{formatDuration(log.session_duration_seconds)}</td>
                  <td style={{ fontSize: '0.875rem', color: '#6b7280' }}>{formatTimeAgo(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn"
              style={{ opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="btn"
              style={{ opacity: page === pagination.totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
