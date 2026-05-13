import React, { useState, useEffect } from 'react';
import { adminMoodAPI } from '../services/api';
import { Heart, TrendingUp, Users, Target } from 'lucide-react';

export default function MoodAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminMoodAPI.getMoodAnalytics(period);
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading mood analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>Loading analytics...</div>;
  }

  const moodEmojis = {
    clear: '😌',
    calm: '🧘',
    tired: '😤',
    anxious: '😨',
    foggy: '😴',
    inspired: '✨'
  };

  const moodColors = {
    clear: '#0d9488',
    calm: '#3b82f6',
    tired: '#f59e0b',
    anxious: '#ef4444',
    foggy: '#8b5cf6',
    inspired: '#ec4899'
  };

  const focusColors = {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#10b981'
  };

  const totalCheckins = analytics?.moodDistribution?.reduce((sum, mood) => sum + parseInt(mood.count), 0) || 0;
  const totalUsers = analytics?.dailyCheckins?.reduce((sum, day) => {
    const users = parseInt(day.unique_users);
    return users > sum ? users : sum;
  }, 0) || 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Mood Analytics</h1>
          <p style={{ color: '#6b7280' }}>Track user moods and mental states</p>
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
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#ec489920' }}>
              <Heart size={28} color="#ec4899" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Check-ins</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalCheckins}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#3b82f620' }}>
              <Users size={28} color="#3b82f6" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Unique Users</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#10b98120' }}>
              <TrendingUp size={28} color="#10b981" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Avg per User</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUsers > 0 ? Math.round(totalCheckins / totalUsers) : 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#f59e0b20' }}>
              <Target size={28} color="#f59e0b" />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Daily Goals Set</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{analytics?.topGoals?.reduce((sum, goal) => sum + parseInt(goal.count), 0) || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Mood Distribution</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {analytics?.moodDistribution?.map((mood) => {
            const percentage = totalCheckins > 0 ? Math.round((parseInt(mood.count) / totalCheckins) * 100) : 0;
            return (
              <div key={mood.mood} style={{ textAlign: 'center', padding: '1.5rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{moodEmojis[mood.mood] || '😌'}</div>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{mood.mood}</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: moodColors[mood.mood] || '#6b7280', marginBottom: '0.25rem' }}>{mood.count}</p>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: moodColors[mood.mood] || '#6b7280', transition: 'width 0.3s' }}></div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus Level Distribution */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Focus Level Distribution</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {analytics?.focusDistribution?.map((focus) => {
            const percentage = totalCheckins > 0 ? Math.round((parseInt(focus.count) / totalCheckins) * 100) : 0;
            return (
              <div key={focus.focus_level} style={{ textAlign: 'center', padding: '1.5rem', borderRadius: '0.75rem', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem', borderRadius: '50%', background: focusColors[focus.focus_level] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: focusColors[focus.focus_level] }}></div>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{focus.focus_level}</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: focusColors[focus.focus_level], marginBottom: '0.25rem' }}>{focus.count}</p>
                <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: focusColors[focus.focus_level], transition: 'width 0.3s' }}></div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Daily Goals */}
      {analytics?.topGoals?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Top Daily Goals</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Goal</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topGoals.map((goal, index) => (
                  <tr key={index}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: index < 3 ? '#f59e0b20' : '#f9fafb', fontWeight: 'bold', color: index < 3 ? '#f59e0b' : '#6b7280' }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{goal.daily_goal}</td>
                    <td><strong>{goal.count}</strong> check-ins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Most Active Users */}
      {analytics?.topUsers?.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Most Active Users</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Check-ins</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topUsers.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: index < 3 ? '#10b98120' : '#f9fafb', fontWeight: 'bold', color: index < 3 ? '#10b981' : '#6b7280' }}>
                        {index + 1}
                      </div>
                    </td>
                    <td style={{ fontWeight: '500' }}>{user.name || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td><strong>{user.checkin_count}</strong> check-ins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
