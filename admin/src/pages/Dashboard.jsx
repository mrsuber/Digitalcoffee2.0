import React, { useState, useEffect } from 'react';
import { adminStatsAPI, adminFocusSessionsAPI, adminMoodAPI, adminEngagementAPI } from '../services/api';
import { Users, BookOpen, Music, TrendingUp, Brain, Heart, Activity, Target } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [focusStats, setFocusStats] = useState(null);
  const [moodStats, setMoodStats] = useState(null);
  const [engagementStats, setEngagementStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      const [statsRes, focusRes, moodRes, engagementRes] = await Promise.all([
        adminStatsAPI.getStats(),
        adminFocusSessionsAPI.getFocusSessions('7'),
        adminMoodAPI.getMoodAnalytics('7'),
        adminEngagementAPI.getEngagementMetrics('7')
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (focusRes.success) setFocusStats(focusRes.data);
      if (moodRes.success) setMoodStats(moodRes.data);
      if (engagementRes.success) setEngagementStats(engagementRes.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '1.25rem', color: '#6b7280' }}>Loading dashboard...</div>;
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: '#3b82f6' },
    { title: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: '#10b981' },
    { title: 'Audio Content', value: stats?.totalAudioContent || 0, icon: Music, color: '#8b5cf6' },
    { title: 'Active Enrollments', value: stats?.activeEnrollments || 0, icon: TrendingUp, color: '#f59e0b' },
  ];

  const digitalCoffeeStats = [
    {
      title: 'Focus Sessions (7d)',
      value: focusStats?.totalStats?.total_sessions || 0,
      subtitle: `${formatDuration(focusStats?.totalStats?.avg_duration)} avg`,
      icon: Brain,
      color: '#0d9488'
    },
    {
      title: 'Mood Check-ins (7d)',
      value: moodStats?.dailyCheckins?.reduce((sum, day) => sum + parseInt(day.total_checkins), 0) || 0,
      subtitle: `${moodStats?.dailyCheckins?.reduce((sum, day) => sum + parseInt(day.unique_users), 0) || 0} users`,
      icon: Heart,
      color: '#ec4899'
    },
    {
      title: 'Daily Active Users',
      value: engagementStats?.dailyActiveUsers?.[engagementStats.dailyActiveUsers.length - 1]?.active_users || 0,
      subtitle: 'Last 24h',
      icon: Activity,
      color: '#f59e0b'
    },
    {
      title: 'Completion Rate',
      value: `${engagementStats?.completionRate?.completion_rate || 0}%`,
      subtitle: `${engagementStats?.completionRate?.completed_sessions || 0} completed`,
      icon: Target,
      color: '#10b981'
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: '#6b7280' }}>Digital Coffee Admin - Take Control of Your Mind</p>
      </div>

      {/* Main Stats */}
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

      {/* Digital Coffee Specific Stats */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '2rem' }}>App Engagement (Last 7 Days)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {digitalCoffeeStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: stat.color + '20' }}>
                  <Icon size={28} color={stat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{stat.title}</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{stat.value}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{stat.subtitle}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Brainwave Types */}
      {focusStats?.brainwaveStats?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Top Brainwave Types</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {focusStats.brainwaveStats.slice(0, 5).map((wave) => (
              <div key={wave.brainwave_type} style={{ padding: '1rem', borderRadius: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{wave.brainwave_type}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{wave.session_count}</p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatDuration(wave.avg_duration)} avg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Distribution */}
      {moodStats?.moodDistribution?.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Mood Distribution (Last 7 Days)</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {moodStats.moodDistribution.map((mood) => {
              const moodEmojis = { clear: '😌', tired: '😤', anxious: '😨', foggy: '😴', inspired: '✨' };
              return (
                <div key={mood.mood} style={{ flex: '1 1 150px', padding: '1rem', borderRadius: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{moodEmojis[mood.mood] || '😌'}</div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'capitalize' }}>{mood.mood}</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{mood.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
