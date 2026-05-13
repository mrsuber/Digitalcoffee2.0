import React, { useState, useEffect } from 'react';
import { adminFocusSessionsAPI, adminEngagementAPI } from '../services/api';
import { Brain, Clock, Users, CheckCircle, TrendingUp } from 'lucide-react';

export default function FocusSessions() {
  const [sessions, setSessions] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [period, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, engagementRes] = await Promise.all([
        adminFocusSessionsAPI.getFocusSessions(period, page, 50),
        adminEngagementAPI.getEngagementMetrics(period)
      ]);

      if (sessionsRes.success) setSessions(sessionsRes.data);
      if (engagementRes.success) setEngagement(engagementRes.data);
    } catch (error) {
      console.error('Error loading focus sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatTotalDuration = (seconds) => {
    if (!seconds) return '0h';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const brainwaveColors = {
    alpha: '#0d9488',
    beta: '#3b82f6',
    theta: '#8b5cf6',
    delta: '#6366f1',
    gamma: '#ec4899'
  };

  const brainwaveEmojis = {
    alpha: '🧘',
    beta: '🎯',
    theta: '🌙',
    delta: '😴',
    gamma: '⚡'
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>Loading sessions...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Focus Sessions</h1>
          <p style={{ color: '#6b7280' }}>Track brainwave audio sessions and user engagement</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.875rem' }}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#0d948820' }}>
              <Brain size={28} color="#0d9488" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Sessions</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{sessions?.totalStats?.total_sessions || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#3b82f620' }}>
              <Clock size={28} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Avg Duration</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatDuration(sessions?.totalStats?.avg_duration)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#10b98120' }}>
              <Users size={28} color="#10b981" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Unique Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{sessions?.totalStats?.unique_users || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#f59e0b20' }}>
              <CheckCircle size={28} color="#f59e0b" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Completion Rate</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{engagement?.completionRate?.completion_rate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#ec489920' }}>
              <TrendingUp size={28} color="#ec4899" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Returning Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{engagement?.returningUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#8b5cf620' }}>
              <Brain size={28} color="#8b5cf6" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Avg Sessions/User</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round(engagement?.avgSessionsPerUser || 0)}</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#6366f120' }}>
              <Clock size={28} color="#6366f1" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Focus Time</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatTotalDuration(sessions?.totalStats?.total_duration)}</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>Across all users and sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Brainwave Type Stats */}
      {sessions?.brainwaveStats?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Brainwave Type Performance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {sessions.brainwaveStats.map((wave) => (
              <div key={wave.brainwave_type} style={{ padding: '1.5rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{brainwaveEmojis[wave.brainwave_type] || '🧠'}</div>
                  <div>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{wave.brainwave_type}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>State</p>
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Sessions</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: brainwaveColors[wave.brainwave_type] || '#6b7280' }}>{wave.session_count}</p>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Avg Duration</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatDuration(wave.avg_duration)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Time</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600' }}>{formatTotalDuration(wave.total_duration)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Audio Content */}
      {sessions?.popularAudio?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Most Popular Audio Content</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Brainwave</th>
                  <th>Play Count</th>
                  <th>Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.popularAudio.map((audio, index) => (
                  <tr key={audio.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: index < 3 ? '#f59e0b20' : '#f9fafb', fontWeight: 'bold', color: index < 3 ? '#f59e0b' : '#6b7280' }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{audio.title}</td>
                    <td>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', background: '#f3f4f6', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                        {audio.type}
                      </span>
                    </td>
                    <td>
                      {audio.brainwave_type ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{brainwaveEmojis[audio.brainwave_type]}</span>
                          <span style={{ textTransform: 'capitalize' }}>{audio.brainwave_type}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td><strong>{audio.play_count || 0}</strong></td>
                    <td>{formatDuration(audio.avg_listen_duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      {sessions?.recentSessions?.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Sessions</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Audio</th>
                  <th>Type</th>
                  <th>Brainwave</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Started At</th>
                </tr>
              </thead>
              <tbody>
                {sessions.recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: '500' }}>{session.user_name || 'N/A'}</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{session.email}</p>
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{session.audio_title}</td>
                    <td>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', background: '#f3f4f6', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                        {session.type}
                      </span>
                    </td>
                    <td>
                      {session.brainwave_type ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{brainwaveEmojis[session.brainwave_type]}</span>
                          <span style={{ textTransform: 'capitalize' }}>{session.brainwave_type}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>N/A</span>
                      )}
                    </td>
                    <td>{formatDuration(session.duration_seconds)}</td>
                    <td>
                      {session.completed_at ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                          <CheckCircle size={16} />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Incomplete</span>
                      )}
                    </td>
                    <td>{new Date(session.started_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {sessions?.pagination && (
              <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280' }}>
                  Showing {((sessions.pagination.page - 1) * sessions.pagination.limit) + 1} to {Math.min(sessions.pagination.page * sessions.pagination.limit, sessions.pagination.total)} of {sessions.pagination.total} sessions
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span style={{ padding: '0.75rem 1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>Page {page}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={sessions.recentSessions.length < sessions.pagination.limit}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
