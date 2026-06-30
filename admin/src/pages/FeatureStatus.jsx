import React from 'react';
import { CheckCircle, Circle, AlertCircle, Code, Smartphone, Server, Database } from 'lucide-react';

export default function FeatureStatus() {
  const features = [
    {
      category: 'Backend API',
      icon: <Server size={24} />,
      color: '#8b5cf6',
      items: [
        { name: 'User Authentication', status: 'complete', description: 'Login, register, password reset' },
        { name: 'Admin Authentication', status: 'complete', description: 'Admin login with JWT tokens' },
        { name: 'Mood Check-ins', status: 'complete', description: 'Daily mood tracking API' },
        { name: 'Courses Management', status: 'complete', description: 'CRUD operations for courses' },
        { name: 'Course Sessions', status: 'complete', description: 'Individual session management' },
        { name: 'Audio Content', status: 'complete', description: 'Audio files and metadata' },
        { name: 'Listening Sessions', status: 'complete', description: 'Track user listening activity' },
        { name: 'User Progress', status: 'complete', description: 'Daily progress and stats tracking' },
        { name: 'Journal Entries', status: 'complete', description: 'Mind journal API' },
        { name: 'Admin Dashboard Stats', status: 'complete', description: 'Overview statistics' },
        { name: 'Mood Analytics', status: 'complete', description: 'Mood distribution and trends' },
        { name: 'Focus Sessions Analytics', status: 'complete', description: 'Listening session analytics' },
        { name: 'Engagement Metrics', status: 'complete', description: 'User engagement tracking' }
      ]
    },
    {
      category: 'Database Schema',
      icon: <Database size={24} />,
      color: '#10b981',
      items: [
        { name: 'Users Table', status: 'complete', description: 'User accounts and profiles' },
        { name: 'Mood Check-ins Table', status: 'complete', description: 'Daily mood entries' },
        { name: 'Courses Table', status: 'complete', description: 'Mind mode courses' },
        { name: 'Course Sessions Table', status: 'complete', description: 'Session details' },
        { name: 'User Courses Table', status: 'complete', description: 'Course enrollments' },
        { name: 'Audio Content Table', status: 'complete', description: 'Audio library' },
        { name: 'Listening Sessions Table', status: 'complete', description: 'Session tracking' },
        { name: 'User Progress Table', status: 'complete', description: 'Daily stats' },
        { name: 'Journal Entries Table', status: 'complete', description: 'Journal storage' },
        { name: 'Password Reset Tokens', status: 'complete', description: 'Password recovery' },
        { name: 'Refresh Tokens', status: 'complete', description: 'JWT refresh tokens' }
      ]
    },
    {
      category: 'Admin Dashboard',
      icon: <Code size={24} />,
      color: '#f59e0b',
      items: [
        { name: 'Admin Login', status: 'complete', description: 'Authentication page' },
        { name: 'Dashboard Overview', status: 'complete', description: 'Stats and analytics' },
        { name: 'User Management', status: 'complete', description: 'View and manage users' },
        { name: 'Courses Management', status: 'complete', description: 'CRUD for courses' },
        { name: 'Audio Content Management', status: 'complete', description: 'Manage audio library' },
        { name: 'Mood Analytics', status: 'complete', description: 'Mood insights dashboard' },
        { name: 'Focus Sessions', status: 'complete', description: 'Session analytics' },
        { name: 'Responsive Design', status: 'complete', description: 'Mobile-friendly admin' }
      ]
    },
    {
      category: 'Mobile App (React Native)',
      icon: <Smartphone size={24} />,
      color: '#3b82f6',
      items: [
        { name: 'Onboarding Flow', status: 'complete', description: 'Welcome screens and intro' },
        { name: 'User Authentication', status: 'complete', description: 'Login and registration' },
        { name: 'Home Dashboard', status: 'complete', description: 'Main app screen' },
        { name: 'Mood Check-in', status: 'complete', description: 'Daily mood tracking' },
        { name: 'Mind Modes', status: 'complete', description: 'Hyper-focus, Calm, Inspiration' },
        { name: 'Course Selection', status: 'complete', description: 'Browse and select courses' },
        { name: 'Session Player', status: 'complete', description: 'Audio playback interface' },
        { name: 'Progress Tracking', status: 'complete', description: 'Stats and streaks' },
        { name: 'Mind Journal', status: 'complete', description: 'Journal entries' },
        { name: 'User Profile', status: 'complete', description: 'Profile management' },
        { name: 'Settings', status: 'complete', description: 'App preferences' },
        { name: 'Audio Player', status: 'complete', description: 'Binaural beats playback' },
        { name: 'Navigation', status: 'complete', description: 'Tab and stack navigation' },
        { name: 'State Management', status: 'complete', description: 'Redux store setup' }
      ]
    },
    {
      category: 'Features Not Yet Implemented',
      icon: <AlertCircle size={24} />,
      color: '#ef4444',
      items: [
        { name: 'Real Audio Files', status: 'pending', description: 'Need actual binaural beat audio files' },
        { name: 'File Upload', status: 'pending', description: 'Upload audio/images via admin' },
        { name: 'Push Notifications', status: 'pending', description: 'Daily reminders' },
        { name: 'Social Features', status: 'pending', description: 'Share progress, community' },
        { name: 'Subscription/Payments', status: 'pending', description: 'Premium features' },
        { name: 'Offline Mode', status: 'pending', description: 'Download content for offline use' },
        { name: 'Advanced Analytics', status: 'pending', description: 'ML-based insights' },
        { name: 'Customizable Sessions', status: 'pending', description: 'User-created playlists' },
        { name: 'Sleep Timer', status: 'pending', description: 'Auto-stop audio' },
        { name: 'Background Audio', status: 'pending', description: 'Play with screen off' },
        { name: 'Export Data', status: 'pending', description: 'Export user data (GDPR)' },
        { name: 'Multi-language', status: 'pending', description: 'i18n support' }
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle size={20} color="#10b981" />;
      case 'in-progress':
        return <Circle size={20} color="#f59e0b" />;
      case 'pending':
        return <Circle size={20} color="#6b7280" />;
      default:
        return <Circle size={20} color="#6b7280" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      complete: { background: '#d1fae5', color: '#065f46', text: 'Complete' },
      'in-progress': { background: '#fef3c7', color: '#92400e', text: 'In Progress' },
      pending: { background: '#f3f4f6', color: '#374151', text: 'Pending' }
    };

    const style = styles[status] || styles.pending;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '500',
        background: style.background,
        color: style.color
      }}>
        {style.text}
      </span>
    );
  };

  const calculateProgress = (items) => {
    const completed = items.filter(item => item.status === 'complete').length;
    return Math.round((completed / items.length) * 100);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Feature Status
        </h1>
        <p style={{ color: '#6b7280' }}>
          Track the development progress of Digital Coffee - Take Control of Your Mind
        </p>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Overall Development Progress
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {features.slice(0, 4).map((category) => {
            const progress = calculateProgress(category.items);
            return (
              <div key={category.category}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                  {category.category}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  {progress}%
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginTop: '0.5rem' }}>
                  <div style={{ height: '100%', background: 'white', borderRadius: '2px', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Categories */}
      {features.map((category) => (
        <div key={category.category} className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${category.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: category.color
            }}>
              {category.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {category.category}
              </h2>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {category.items.filter(i => i.status === 'complete').length} of {category.items.length} complete
              </div>
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: category.color
            }}>
              {calculateProgress(category.items)}%
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {category.items.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ marginTop: '0.125rem' }}>
                  {getStatusIcon(item.status)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {item.description}
                  </div>
                </div>
                <div>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Stats */}
      <div className="card" style={{ background: '#f9fafb' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Development Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {features.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'complete').length, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Features Complete
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {features.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'in-progress').length, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              In Progress
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>
              {features.reduce((acc, cat) => acc + cat.items.filter(i => i.status === 'pending').length, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Pending
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {features.reduce((acc, cat) => acc + cat.items.length, 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total Features
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
