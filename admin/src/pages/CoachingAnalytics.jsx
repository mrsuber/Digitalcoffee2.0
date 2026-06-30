import React, { useState, useEffect } from 'react';
import { Users, Star, CheckCircle, MessageSquare, TrendingUp, Award, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CoachingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/coaching/admin/analytics');

      if (response.success) {
        setAnalytics(response.data);
      } else {
        setError('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading coaching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading coaching analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <AlertCircle size={20} color="#dc2626" />
        <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const topCoaches = analytics?.topCoaches || [];
  const recentActivity = analytics?.recentActivity || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Coaching Analytics
        </h1>
        <p style={{ color: '#6b7280' }}>
          Monitor coaching relationships, performance metrics, and platform activity
        </p>
      </div>

      {/* Overview Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Active Relationships */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Users size={28} />
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Active</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {overview.total_active_relationships || 0}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Active Coaching Relationships
          </div>
        </div>

        {/* Pending Requests */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Clock size={28} />
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pending</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {overview.pending_requests || 0}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Pending Coach Requests
          </div>
        </div>

        {/* Active Coaches */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Award size={28} />
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Coaches</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {overview.active_coaches || 0}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            of {overview.total_available_coaches || 0} Total Available
          </div>
        </div>

        {/* Platform Rating */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '1rem',
          padding: '1.5rem',
          color: 'white',
          boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <Star size={28} fill="white" />
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Rating</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {overview.platform_average_rating ? parseFloat(overview.platform_average_rating).toFixed(1) : 'N/A'}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Average Platform Rating
          </div>
        </div>
      </div>

      {/* Weekly Activity Stats */}
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} />
          Weekly Activity
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={18} color="#3b82f6" />
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Check-Ins</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {overview.checkins_last_week || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Last 7 days</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MessageSquare size={18} color="#8b5cf6" />
              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>Messages</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937' }}>
              {overview.messages_last_week || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Last 7 days</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Top Coaches */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} />
            Top Performing Coaches
          </h2>

          {topCoaches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Award size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>No coaches yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topCoaches.map((coach, index) => (
                <div
                  key={coach.coach_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: index < 3 ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' : '#f9fafb',
                    borderRadius: '0.75rem',
                    border: index === 0 ? '2px solid #fbbf24' : '1px solid #e5e7eb'
                  }}
                >
                  {/* Rank Badge */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#fb923c' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: index < 3 ? 'white' : '#6b7280',
                    marginRight: '1rem',
                    flexShrink: 0
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Coach Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {coach.coach_name || 'Anonymous Coach'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>👥 {coach.active_students || 0} students</span>
                      <span>⭐ {coach.average_rating ? parseFloat(coach.average_rating).toFixed(1) : 'N/A'}</span>
                      <span>✓ {coach.total_checkins || 0} check-ins</span>
                    </div>
                  </div>

                  {/* Response Rate */}
                  {coach.response_rate && (
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      background: parseFloat(coach.response_rate) > 80 ? '#d1fae5' : '#fef3c7',
                      color: parseFloat(coach.response_rate) > 80 ? '#065f46' : '#92400e',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginLeft: '0.5rem',
                      flexShrink: 0
                    }}>
                      {parseFloat(coach.response_rate).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} />
            Recent Activity
          </h2>

          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <Clock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p>No recent activity</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    borderLeft: '3px solid #3b82f6'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '0.75rem',
                    flexShrink: 0
                  }}>
                    <CheckCircle size={16} color="#3b82f6" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '600' }}>{activity.coach_name}</span>
                      <span style={{ color: '#6b7280' }}> checked in with </span>
                      <span style={{ fontWeight: '600' }}>{activity.student_name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
