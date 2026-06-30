import React, { useState } from 'react';
import { Bell, Send, Users, Calendar, CheckCircle } from 'lucide-react';

export default function NotificationsManagement() {
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduleType: 'immediate',
    scheduleDate: '',
    scheduleTime: ''
  });

  const [sending, setSending] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([
    {
      id: 1,
      title: 'New Course Available',
      message: 'Check out our new mindfulness course!',
      target_audience: 'all',
      sent_at: new Date(Date.now() - 3600000).toISOString(),
      delivered_count: 245
    },
    {
      id: 2,
      title: 'Weekly Challenge',
      message: 'Complete 5 meditation sessions this week!',
      target_audience: 'active',
      sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      delivered_count: 189
    }
  ]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();

    if (!notificationData.title || !notificationData.message) {
      alert('Please fill in title and message');
      return;
    }

    if (!confirm(`Send notification to ${notificationData.targetAudience} users?`)) {
      return;
    }

    try {
      setSending(true);

      // TODO: Implement API call
      // await adminNotificationsAPI.send(notificationData);

      // Mock success
      const newNotification = {
        id: Date.now(),
        title: notificationData.title,
        message: notificationData.message,
        target_audience: notificationData.targetAudience,
        sent_at: new Date().toISOString(),
        delivered_count: notificationData.targetAudience === 'all' ? 250 : 125
      };

      setRecentNotifications([newNotification, ...recentNotifications]);

      // Reset form
      setNotificationData({
        title: '',
        message: '',
        targetAudience: 'all',
        scheduleType: 'immediate',
        scheduleDate: '',
        scheduleTime: ''
      });

      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const audienceOptions = [
    { value: 'all', label: 'All Users', description: 'Send to all registered users' },
    { value: 'active', label: 'Active Users', description: 'Users active in last 7 days' },
    { value: 'inactive', label: 'Inactive Users', description: 'Users inactive for 30+ days' },
    { value: 'premium', label: 'Premium Users', description: 'Users with active subscriptions' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Notifications Management</h1>
        <p style={{ color: '#6b7280' }}>Send push notifications and announcements to users</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Send Notification Form */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={24} style={{ color: '#3b82f6' }} />
              Send Notification
            </h2>

            <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={notificationData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., New Feature Available"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Message */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Message *
                </label>
                <textarea
                  name="message"
                  value={notificationData.message}
                  onChange={handleInputChange}
                  placeholder="Enter notification message..."
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {notificationData.message.length}/500 characters
                </p>
              </div>

              {/* Target Audience */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Target Audience
                </label>
                {audienceOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setNotificationData({ ...notificationData, targetAudience: option.value })}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      borderRadius: '0.5rem',
                      border: notificationData.targetAudience === option.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      background: notificationData.targetAudience === option.value ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <input
                        type="radio"
                        name="targetAudience"
                        value={option.value}
                        checked={notificationData.targetAudience === option.value}
                        onChange={() => {}}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontWeight: '500' }}>{option.label}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '1.5rem' }}>
                      {option.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Schedule Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Schedule
                </label>
                <select
                  name="scheduleType"
                  value={notificationData.scheduleType}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="immediate">Send Immediately</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>

              {notificationData.scheduleType === 'scheduled' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      name="scheduleDate"
                      value={notificationData.scheduleDate}
                      onChange={handleInputChange}
                      required={notificationData.scheduleType === 'scheduled'}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                      Time
                    </label>
                    <input
                      type="time"
                      name="scheduleTime"
                      value={notificationData.scheduleTime}
                      onChange={handleInputChange}
                      required={notificationData.scheduleType === 'scheduled'}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: sending ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <Send size={20} />
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={24} style={{ color: '#10b981' }} />
              Recent Notifications
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentNotifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                  No notifications sent yet
                </p>
              ) : (
                recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{notif.title}</h3>
                      <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                      {notif.message}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={14} />
                        {notif.delivered_count} delivered
                      </span>
                      <span>•</span>
                      <span>{formatDate(notif.sent_at)}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'capitalize' }}>{notif.target_audience}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
