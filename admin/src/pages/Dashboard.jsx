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
