import React, { useState, useEffect } from 'react';
import { adminProgressAPI } from '../services/api';
import { TrendingUp, Users, Clock, Target, Award } from 'lucide-react';

export default function ProgressAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [userProgress, setUserProgress] = useState([]);
  const [timeRange, setTimeRange] = useState('7');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminProgressAPI.getAnalytics(timeRange);
      if (response.success) {
        setAnalytics(response.data.analytics);
        setUserProgress(response.data.userProgress || []);
      }
    } catch (error) {
      console.error('Error loading progress analytics:', error);
      alert('Error loading progress analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>{title}</p>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: '0' }}>{value}</h3>
          {subtitle && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          padding: '0.75rem',
          backgroundColor: `${color}15`,
          borderRadius: '0.5rem'
        }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading analytics...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Progress Analytics</h1>
          <p style={{ color: '#6b7280' }}>Monitor user progress and engagement across the platform</p>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={timeRange === days ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '0.5rem 1rem' }}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Sessions"
          value={analytics?.totalSessions?.toLocaleString() || '0'}
          icon={Target}
          color="#3b82f6"
          subtitle={`${analytics?.avgSessionsPerUser?.toFixed(1) || '0'} per user`}
        />
        <StatCard
          title="Total Minutes"
          value={Math.round(analytics?.totalMinutes / 60 || 0).toLocaleString() + 'h'}
          icon={Clock}
          color="#8b5cf6"
          subtitle={`${Math.round(analytics?.avgMinutesPerUser || 0)} min per user`}
        />
        <StatCard
          title="Active Users"
          value={analytics?.activeUsers || '0'}
          icon={Users}
          color="#14b8a6"
          subtitle={`${analytics?.engagementRate || '0'}% engagement`}
        />
        <StatCard
          title="Course Completions"
          value={analytics?.courseCompletions || '0'}
          icon={Award}
          color="#f59e0b"
          subtitle={`${analytics?.completionRate || '0'}% completion rate`}
        />
        <StatCard
          title="Avg Streak"
          value={analytics?.avgStreak?.toFixed(1) || '0'}
          icon={TrendingUp}
          color="#ef4444"
          subtitle="days"
        />
      </div>

      {/* User Progress Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          User Progress Details
        </h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Total Sessions</th>
                <th>Total Time</th>
                <th>Current Streak</th>
                <th>Courses Enrolled</th>
                <th>Courses Completed</th>
                <th>Last Active</th>
                <th>Avg Mood</th>
                <th>Focus Score</th>
              </tr>
            </thead>
            <tbody>
              {userProgress.map((user) => (
                <tr key={user.user_id}>
                  <td style={{ fontWeight: '500' }}>{user.user_name || 'Unknown'}</td>
                  <td>{user.user_email}</td>
                  <td>{user.total_sessions || 0}</td>
                  <td>
                    {Math.floor((user.total_minutes || 0) / 60)}h{' '}
                    {(user.total_minutes || 0) % 60}m
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      background: user.current_streak > 7 ? '#dcfce7' : user.current_streak > 3 ? '#fef3c7' : '#f3f4f6',
                      color: user.current_streak > 7 ? '#166534' : user.current_streak > 3 ? '#92400e' : '#374151'
                    }}>
                      {user.current_streak || 0} days
                    </span>
                  </td>
                  <td>{user.courses_enrolled || 0}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      background: '#dcfce7',
                      color: '#166534'
                    }}>
                      {user.courses_completed || 0}
                    </span>
                  </td>
                  <td>
                    {user.last_active
                      ? new Date(user.last_active).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    {user.avg_mood ? (
                      <span>{user.avg_mood.toFixed(1)}/5.0</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {user.avg_focus ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '60px',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${user.avg_focus}%`,
                            height: '100%',
                            backgroundColor: user.avg_focus > 70 ? '#14b8a6' : user.avg_focus > 40 ? '#f59e0b' : '#ef4444',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span>{user.avg_focus}%</span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {userProgress.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No user progress data available for the selected time range.
            </div>
          )}
        </div>
      </div>

      {/* Insights Section */}
      {analytics?.topPerformers && analytics.topPerformers.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Top Performers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {analytics.topPerformers.slice(0, 3).map((user, index) => (
              <div
                key={user.user_id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.5rem',
                  borderLeft: `4px solid ${index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : '#cd7f32'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                      #{index + 1} {user.user_name || user.user_email}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      {user.total_sessions} sessions • {Math.floor(user.total_minutes / 60)}h {user.total_minutes % 60}m
                    </p>
                  </div>
                  <div style={{ fontSize: '2rem' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
