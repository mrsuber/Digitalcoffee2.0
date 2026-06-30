import React, { useState, useEffect } from 'react';
import { coachAPI } from '../services/api';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Edit3,
  Save,
  X
} from 'lucide-react';

export default function CoachSessions() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [statusFilter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getSessions(statusFilter || undefined);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      alert('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotes = (session) => {
    setEditingSession(session.id);
    setNotes(session.notes || '');
  };

  const handleSaveNotes = async (sessionId) => {
    try {
      setSaving(true);
      await coachAPI.updateSessionNotes(sessionId, notes);

      // Update local state
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, notes } : s
      ));

      setEditingSession(null);
      alert('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    if (!confirm('Mark this session as completed?')) return;

    try {
      await coachAPI.completeSession(sessionId);

      // Update local state
      setSessions(sessions.map(s =>
        s.id === sessionId ? { ...s, status: 'completed' } : s
      ));

      alert('Session marked as completed');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setNotes('');
  };

  const filteredSessions = sessions;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading sessions...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          My Sessions
        </h1>
        <p style={{ color: '#666' }}>
          {sessions.length} total session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#666'
          }}>
            <Filter size={20} />
            <span style={{ fontWeight: '500' }}>Filter by Status:</span>
          </div>

          <button
            onClick={() => setStatusFilter('')}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === '' ? '#3b82f6' : 'white',
              color: statusFilter === '' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            All
          </button>

          <button
            onClick={() => setStatusFilter('scheduled')}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === 'scheduled' ? '#f59e0b' : 'white',
              color: statusFilter === 'scheduled' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Scheduled
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === 'completed' ? '#10b981' : 'white',
              color: statusFilter === 'completed' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Completed
          </button>

          <button
            onClick={() => setStatusFilter('cancelled')}
            style={{
              padding: '0.5rem 1rem',
              background: statusFilter === 'cancelled' ? '#ef4444' : 'white',
              color: statusFilter === 'cancelled' ? 'white' : '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Calendar size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <p style={{ color: '#666', fontSize: '1.125rem' }}>
            No sessions found
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isEditing={editingSession === session.id}
              notes={notes}
              setNotes={setNotes}
              onEditNotes={handleEditNotes}
              onSaveNotes={handleSaveNotes}
              onCancelEdit={handleCancelEdit}
              onCompleteSession={handleCompleteSession}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  isEditing,
  notes,
  setNotes,
  onEditNotes,
  onSaveNotes,
  onCancelEdit,
  onCompleteSession,
  saving
}) {
  const date = new Date(session.scheduled_time);

  const statusConfig = {
    scheduled: { icon: <Clock size={20} />, color: '#f59e0b', bg: '#fef3c7', label: 'Scheduled' },
    completed: { icon: <CheckCircle size={20} />, color: '#10b981', bg: '#d1fae5', label: 'Completed' },
    cancelled: { icon: <XCircle size={20} />, color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
  };

  const status = statusConfig[session.status] || statusConfig.scheduled;

  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '1.5rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '0.75rem'
          }}>
            {/* Student Avatar */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: session.student_avatar ? `url(${session.student_avatar})` : '#3b82f6',
              backgroundSize: 'cover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.125rem'
            }}>
              {!session.student_avatar && session.student_name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                {session.student_name}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                {session.student_email}
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                Date & Time
              </p>
              <p style={{ fontWeight: '500' }}>
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                Session Type
              </p>
              <p style={{ fontWeight: '500' }}>
                {session.session_type || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          background: status.bg,
          color: status.color
        }}>
          {status.icon}
          <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Notes Section */}
      <div style={{
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <p style={{ fontWeight: '600', color: '#374151' }}>Session Notes</p>
          {!isEditing && (
            <button
              onClick={() => onEditNotes(session)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <Edit3 size={16} />
              Edit Notes
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add session notes..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onSaveNotes(session.id)}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
              <button
                onClick={onCancelEdit}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: '0.5rem',
            minHeight: '80px'
          }}>
            {session.notes ? (
              <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>
                {session.notes}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
                No notes added yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {session.status === 'scheduled' && !isEditing && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => onCompleteSession(session.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <CheckCircle size={16} />
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
}
