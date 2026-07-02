import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, X, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://digitalcoffee.cafe/api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export default function CoachAvailability() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'blocked'
  const [loading, setLoading] = useState(true);
  const [weeklyAvailability, setWeeklyAvailability] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  // Weekly availability form
  const [showWeeklyForm, setShowWeeklyForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  // Blocked slots form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockedDate, setBlockedDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.get(`${API_URL}/video-calls/coach/availability`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response:', response.data);

      // Backend returns { success: true, data: { weeklyAvailability, blockedSlots } }
      const { data } = response.data;
      setWeeklyAvailability(data.weeklyAvailability || []);
      setBlockedSlots(data.blockedSlots || []);
    } catch (error) {
      console.error('Error loading availability:', error);
      alert('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeeklySlot = async (e) => {
    e.preventDefault();

    // Validate times
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');

      await axios.post(
        `${API_URL}/video-calls/coach/availability`,
        {
          dayOfWeek: selectedDay,
          startTime,
          endTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Availability added successfully');
      setShowWeeklyForm(false);
      setStartTime('09:00');
      setEndTime('17:00');
      loadAvailability();
    } catch (error) {
      console.error('Error adding availability:', error);
      alert(error.response?.data?.message || 'Failed to add availability');
    }
  };

  const handleDeleteWeeklySlot = async (id) => {
    if (!window.confirm('Are you sure you want to remove this time slot?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');

      await axios.delete(`${API_URL}/video-calls/coach/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Time slot removed');
      loadAvailability();
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Failed to delete availability');
    }
  };

  const handleBlockSlot = async (e) => {
    e.preventDefault();

    if (!blockedDate || !blockStartTime || !blockEndTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (blockStartTime >= blockEndTime) {
      alert('End time must be after start time');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');

      await axios.post(
        `${API_URL}/video-calls/coach/block-slot`,
        {
          date: blockedDate,
          startTime: blockStartTime,
          endTime: blockEndTime,
          reason: blockReason,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Date/time blocked successfully');
      setShowBlockForm(false);
      setBlockedDate('');
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
      loadAvailability();
    } catch (error) {
      console.error('Error blocking slot:', error);
      alert(error.response?.data?.message || 'Failed to block slot');
    }
  };

  const handleUnblockSlot = async (id) => {
    if (!window.confirm('Are you sure you want to unblock this date/time?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');

      await axios.delete(`${API_URL}/video-calls/coach/block-slot/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Date/time unblocked');
      loadAvailability();
    } catch (error) {
      console.error('Error unblocking slot:', error);
      alert('Failed to unblock slot');
    }
  };

  const getDayLabel = (dayOfWeek) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group weekly availability by day
  const groupedAvailability = weeklyAvailability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading availability...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Manage Availability
        </h1>
        <p style={{ color: '#6b7280' }}>
          Set your weekly schedule and block specific dates when you're unavailable
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('weekly')}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'weekly' ? '3px solid #7c3aed' : '3px solid transparent',
            color: activeTab === 'weekly' ? '#7c3aed' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Clock size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Weekly Hours
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'blocked' ? '3px solid #7c3aed' : '3px solid transparent',
            color: activeTab === 'blocked' ? '#7c3aed' : '#6b7280',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Calendar size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Blocked Dates
        </button>
      </div>

      {/* Weekly Availability Tab */}
      {activeTab === 'weekly' && (
        <div>
          {/* Add Button */}
          <button
            onClick={() => setShowWeeklyForm(!showWeeklyForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}
          >
            {showWeeklyForm ? <X size={18} /> : <Plus size={18} />}
            {showWeeklyForm ? 'Cancel' : 'Add Time Slot'}
          </button>

          {/* Add Weekly Slot Form */}
          {showWeeklyForm && (
            <form onSubmit={handleAddWeeklySlot} style={{
              background: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Add Weekly Availability
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Day of Week
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Save size={18} />
                Add Availability
              </button>
            </form>
          )}

          {/* Weekly Availability List */}
          <div>
            {DAYS_OF_WEEK.map((day) => {
              const slots = groupedAvailability[day.value] || [];
              if (slots.length === 0) return null;

              return (
                <div key={day.value} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
                    {day.label}
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div>
                          <Clock size={16} style={{ display: 'inline', marginRight: '0.5rem', color: '#7c3aed' }} />
                          <span style={{ fontWeight: '500' }}>
                            {slot.start_time} - {slot.end_time}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteWeeklySlot(slot.id)}
                          style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '0.375rem',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.target.style.background = 'none'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {weeklyAvailability.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No availability set yet
                </p>
                <p>Add your weekly available hours to start accepting bookings</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === 'blocked' && (
        <div>
          {/* Add Button */}
          <button
            onClick={() => setShowBlockForm(!showBlockForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}
          >
            {showBlockForm ? <X size={18} /> : <Plus size={18} />}
            {showBlockForm ? 'Cancel' : 'Block Date/Time'}
          </button>

          {/* Block Slot Form */}
          {showBlockForm && (
            <form onSubmit={handleBlockSlot} style={{
              background: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '0.75rem',
              marginBottom: '2rem',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                Block Date/Time
              </h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={blockedDate}
                  onChange={(e) => setBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Reason (Optional)
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g., Vacation, Personal appointment"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Save size={18} />
                Block Date/Time
              </button>
            </form>
          )}

          {/* Blocked Slots List */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            {blockedSlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderLeft: '4px solid #ef4444',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {formatDate(slot.blocked_date)}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                    {slot.start_time} - {slot.end_time}
                  </div>
                  {slot.reason && (
                    <div style={{ color: '#6b7280', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      {slot.reason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUnblockSlot(slot.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'none',
                    border: '1px solid #7c3aed',
                    color: '#7c3aed',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#7c3aed';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#7c3aed';
                  }}
                >
                  Unblock
                </button>
              </div>
            ))}

            {blockedSlots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  No blocked dates/times
                </p>
                <p>Block specific dates when you're unavailable</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
