import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachAPI } from '../services/api';
import {
  Users,
  Calendar,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Video,
  PhoneCall
} from 'lucide-react';

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [videoBookings, setVideoBookings] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all dashboard data in parallel
      const [profileRes, analyticsRes, studentsRes, sessionsRes, applicationsRes, bookingsRes] = await Promise.all([
        coachAPI.getProfile(),
        coachAPI.getAnalytics(30),
        coachAPI.getStudents(),
        coachAPI.getSessions('scheduled', 10),
        coachAPI.getPendingApplications(),
        coachAPI.getVideoBookings().catch(() => ({ success: true, bookings: [] })) // Gracefully handle if not available
      ]);

      setProfile(profileRes.coach);
      setAnalytics(analyticsRes);
      setStudents(studentsRes.students);
      setUpcomingSessions(sessionsRes.sessions);
      setPendingApplications(applicationsRes.applications);

      // Filter for upcoming video bookings only
      const upcoming = bookingsRes.bookings?.filter(b =>
        b.status === 'scheduled' && new Date(b.scheduled_at) > new Date()
      ) || [];
      setVideoBookings(upcoming);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (relationshipId) => {
    if (!confirm('Accept this student application?')) return;

    try {
      setProcessingApplication(relationshipId);
      await coachAPI.acceptApplication(relationshipId);
      alert('Application accepted successfully!');
      // Reload dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application');
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRejectApplication = async (relationshipId) => {
    const reason = prompt('Optional: Enter a reason for rejecting this application:');
    if (reason === null) return; // User cancelled

    try {
      setProcessingApplication(relationshipId);
      await coachAPI.rejectApplication(relationshipId, reason);
      alert('Application rejected');
      // Reload dashboard data
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    } finally {
      setProcessingApplication(null);
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
        <div>Loading dashboard...</div>
      </div>
    );
  }

  const stats = analytics?.stats || {};

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Coach Dashboard
        </h1>
        <p style={{ color: '#666' }}>Welcome back, {profile?.full_name}</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          icon={<Users size={24} />}
          label="Total Students"
          value={stats.total_students || 0}
          color="#3b82f6"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Completed Sessions"
          value={stats.completed_sessions || 0}
          color="#10b981"
        />
        <StatCard
          icon={<Calendar size={24} />}
          label="Upcoming Sessions"
          value={stats.upcoming_sessions || 0}
          color="#f59e0b"
        />
        <StatCard
          icon={<Star size={24} />}
          label="Average Rating"
          value={stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 'N/A'}
          color="#8b5cf6"
        />
      </div>

      {/* Upcoming Video Calls Alert */}
      {videoBookings.length > 0 && (
        <div style={{
          background: '#dbeafe',
          border: '1px solid #3b82f6',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Video size={24} style={{ color: '#3b82f6' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e3a8a' }}>
                {videoBookings.length} Upcoming Video Call{videoBookings.length !== 1 ? 's' : ''}
              </h2>
            </div>
            <button
              onClick={() => navigate('/coach/video-sessions')}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Manage Availability
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {videoBookings.slice(0, 3).map((booking) => (
              <VideoBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Applications Alert */}
      {pendingApplications.length > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <Clock size={24} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#78350f' }}>
              {pendingApplications.length} Pending Application{pendingApplications.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingApplications.map((application) => (
              <ApplicationCard
                key={application.relationship_id}
                application={application}
                onAccept={handleAcceptApplication}
                onReject={handleRejectApplication}
                processing={processingApplication === application.relationship_id}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Upcoming Sessions */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              Upcoming Sessions
            </h2>
            <button
              onClick={() => navigate('/coach/sessions')}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
              No upcoming sessions scheduled
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {upcomingSessions.slice(0, 5).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              My Students
            </h2>
            <button
              onClick={() => navigate('/coach/students')}
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All
            </button>
          </div>

          {students.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem 0' }}>
              No students assigned yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {students.slice(0, 5).map((student) => (
                <StudentCard
                  key={student.user_id}
                  student={student}
                  onClick={() => navigate(`/coach/students/${student.user_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      {analytics?.recentReviews?.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Recent Reviews
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {analytics.recentReviews.slice(0, 3).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {label}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {value}
          </p>
        </div>
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
      </div>
    </div>
  );
}

function SessionCard({ session }) {
  const date = new Date(session.scheduled_time);

  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      cursor: 'pointer'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start'
      }}>
        <div>
          <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {session.student_name}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {session.session_type}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {date.toLocaleDateString()}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
}

function StudentCard({ student, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f9fafb';
        e.currentTarget.style.borderColor = '#3b82f6';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: student.avatar_url ? `url(${student.avatar_url})` : '#3b82f6',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600'
        }}>
          {!student.avatar_url && student.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {student.name}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {student.total_sessions} sessions • {student.completed_sessions} completed
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={{
      padding: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <p style={{ fontWeight: '600' }}>{review.user_name}</p>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              fill={i < review.rating ? '#f59e0b' : 'none'}
              color={i < review.rating ? '#f59e0b' : '#d1d5db'}
            />
          ))}
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        {review.review_text}
      </p>
      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

function VideoBookingCard({ booking }) {
  const scheduledDate = new Date(booking.scheduled_at);
  const now = new Date();
  const minutesUntil = Math.floor((scheduledDate - now) / (1000 * 60));
  const canJoin = minutesUntil <= 5 && minutesUntil >= -10; // Can join 5 mins before to 10 mins after

  return (
    <div style={{
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      {/* Video Icon */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        flexShrink: 0
      }}>
        <PhoneCall size={32} />
      </div>

      {/* Booking Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '0.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              Video Call with {booking.student_name || booking.coach_name || 'Student'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              {scheduledDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          <div style={{
            background: canJoin ? '#dcfce7' : '#dbeafe',
            color: canJoin ? '#166534' : '#1e40af',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Time Until */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <Clock size={16} style={{ color: '#666' }} />
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {minutesUntil > 60
              ? `In ${Math.floor(minutesUntil / 60)} hour${Math.floor(minutesUntil / 60) !== 1 ? 's' : ''}`
              : minutesUntil > 0
              ? `In ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`
              : minutesUntil >= -10
              ? 'Happening now!'
              : 'Missed'}
          </p>
        </div>

        {/* Notes */}
        {booking.booking_notes && (
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', fontStyle: 'italic' }}>
            "{booking.booking_notes}"
          </p>
        )}

        {/* Join Button */}
        {canJoin && (
          <button
            onClick={() => window.open(`/coach/video-call/${booking.id}`, '_blank')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Video size={18} />
            Join Video Call
          </button>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ application, onAccept, onReject, processing }) {
  const appliedDate = new Date(application.applied_at);
  const daysSinceApplied = Math.floor((new Date() - appliedDate) / (1000 * 60 * 60 * 24));

  return (
    <div style={{
      background: 'white',
      border: '2px solid #fbbf24',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      display: 'flex',
      gap: '1.5rem',
      alignItems: 'start'
    }}>
      {/* Avatar */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: application.avatar_url ? `url(${application.avatar_url})` : '#3b82f6',
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: '600',
        flexShrink: 0
      }}>
        {!application.avatar_url && application.name.charAt(0).toUpperCase()}
      </div>

      {/* Application Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '0.75rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
              {application.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>
              {application.email}
            </p>
          </div>
          <div style={{
            background: '#fef3c7',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#78350f'
          }}>
            Applied {daysSinceApplied === 0 ? 'today' : `${daysSinceApplied} day${daysSinceApplied !== 1 ? 's' : ''} ago`}
          </div>
        </div>

        {/* Goals */}
        {application.goals && application.goals.length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
              Goals:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {application.goals.map((goal, index) => (
                <span
                  key={index}
                  style={{
                    background: '#ede9fe',
                    color: '#5b21b6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* User Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
              Member Since
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              {new Date(application.user_joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
              Check-ins
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              {application.total_check_ins || 0}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
              Avg Mood
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              {application.avg_mood ? parseFloat(application.avg_mood).toFixed(1) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onAccept(application.relationship_id)}
            disabled={processing}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: processing ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle size={16} />
            {processing ? 'Processing...' : 'Accept Student'}
          </button>
          <button
            onClick={() => onReject(application.relationship_id)}
            disabled={processing}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: processing ? '#9ca3af' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: processing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <XCircle size={16} />
            {processing ? 'Processing...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}
