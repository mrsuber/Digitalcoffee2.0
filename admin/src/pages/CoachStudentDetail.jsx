import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachAPI } from '../services/api';
import {
  ArrowLeft,
  Calendar,
  Star,
  TrendingUp,
  Activity,
  Heart,
  Moon,
  Brain,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Video
} from 'lucide-react';

export default function CoachStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getStudent(studentId);
      setStudent(response.student);
      setSessions(response.sessions);
      setProgress(response.progress);
    } catch (error) {
      console.error('Error loading student:', error);
      alert('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading student details...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '1rem' }}>
          Student not found
        </p>
        <button
          onClick={() => navigate('/coach/students')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/coach/students')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={20} />
          Back to Students
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: student.avatar_url ? `url(${student.avatar_url})` : '#3b82f6',
            backgroundSize: 'cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            {!student.avatar_url && student.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {student.name}
            </h1>
            <p style={{ color: '#666' }}>{student.email}</p>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Member since {new Date(student.joined_date).toLocaleDateString()}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={() => navigate(`/coach/messaging?studentId=${studentId}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <MessageSquare size={18} />
                Message Student
              </button>

              <button
                onClick={() => {
                  // Open video call in new window/tab
                  const callUrl = `/coach/video-call/student/${studentId}`;
                  window.open(callUrl, '_blank', 'width=1200,height=800');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Video size={18} />
                Start Video Call
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {progress && (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            30-Day Progress Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            <ProgressMetric
              icon={<Activity size={20} />}
              label="Check-ins"
              value={progress.total_check_ins || 0}
              color="#3b82f6"
            />
            <ProgressMetric
              icon={<Heart size={20} />}
              label="Avg Mood"
              value={progress.avg_mood ? parseFloat(progress.avg_mood).toFixed(1) : 'N/A'}
              color="#ec4899"
            />
            <ProgressMetric
              icon={<Brain size={20} />}
              label="Avg Stress"
              value={progress.avg_stress ? parseFloat(progress.avg_stress).toFixed(1) : 'N/A'}
              color="#f59e0b"
            />
            <ProgressMetric
              icon={<Moon size={20} />}
              label="Avg Sleep"
              value={progress.avg_sleep ? parseFloat(progress.avg_sleep).toFixed(1) : 'N/A'}
              color="#8b5cf6"
            />
          </div>
        </div>
      )}

      {/* Session History */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Session History ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
            No sessions yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressMetric({ icon, label, value, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '0.5rem'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '0.75rem',
        background: `${color}20`,
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SessionCard({ session }) {
  const date = new Date(session.scheduled_time);

  const statusConfig = {
    scheduled: { icon: <Clock size={20} />, color: '#f59e0b', bg: '#fef3c7', label: 'Scheduled' },
    completed: { icon: <CheckCircle size={20} />, color: '#10b981', bg: '#d1fae5', label: 'Completed' },
    cancelled: { icon: <XCircle size={20} />, color: '#ef4444', bg: '#fee2e2', label: 'Cancelled' },
  };

  const status = statusConfig[session.status] || statusConfig.scheduled;

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1.25rem',
      transition: 'all 0.2s'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Calendar size={18} style={{ color: '#666' }} />
            <p style={{ fontWeight: '600', fontSize: '1.125rem' }}>
              {date.toLocaleDateString()}
            </p>
          </div>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: session.notes ? '1rem' : '0'
      }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
            Session Type
          </p>
          <p style={{ fontWeight: '500' }}>
            {session.session_type || 'N/A'}
          </p>
        </div>
        {session.user_rating && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
              Rating
            </p>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < session.user_rating ? '#f59e0b' : 'none'}
                  color={i < session.user_rating ? '#f59e0b' : '#d1d5db'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {session.notes && (
        <div style={{
          padding: '1rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          borderLeft: '3px solid #3b82f6'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
            Session Notes
          </p>
          <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>
            {session.notes}
          </p>
        </div>
      )}
    </div>
  );
}
