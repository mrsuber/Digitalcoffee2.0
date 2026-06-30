import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachAPI } from '../services/api';
import { Search, Users, Calendar, Star, TrendingUp, Activity, CheckCircle, XCircle, Clock, MessageSquare, Video } from 'lucide-react';

export default function CoachStudents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, applicationsResponse] = await Promise.all([
        coachAPI.getStudents(),
        coachAPI.getPendingApplications()
      ]);
      setStudents(studentsResponse.students);
      setPendingApplications(applicationsResponse.applications);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (relationshipId) => {
    if (!confirm('Accept this student application?')) return;

    try {
      setProcessingId(relationshipId);
      await coachAPI.acceptApplication(relationshipId);
      alert('Student application accepted successfully!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = async (relationshipId) => {
    const reason = prompt('Optional: Provide a reason for rejection');
    if (reason === null) return; // User cancelled

    try {
      setProcessingId(relationshipId);
      await coachAPI.rejectApplication(relationshipId, reason);
      alert('Student application rejected');
      loadData(); // Reload data
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApplications = pendingApplications.filter(app =>
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div>Loading students...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            My Students
          </h1>
          <p style={{ color: '#666' }}>
            {students.length} active student{students.length !== 1 ? 's' : ''} • {pendingApplications.length} pending application{pendingApplications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'active' ? '#3b82f6' : '#666',
            fontWeight: activeTab === 'active' ? '600' : '400',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Active Students ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'pending' ? '#3b82f6' : '#666',
            fontWeight: activeTab === 'pending' ? '600' : '400',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Clock size={16} />
          Pending Applications ({pendingApplications.length})
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }}
          />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'active' ? (
        // Active Students Grid
        filteredStudents.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Users size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
            <p style={{ color: '#666', fontSize: '1.125rem' }}>
              {search ? 'No students found matching your search' : 'No active students yet'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.user_id}
                student={student}
                onClick={() => navigate(`/coach/students/${student.user_id}`)}
              />
            ))}
          </div>
        )
      ) : (
        // Pending Applications Grid
        filteredApplications.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <Clock size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
            <p style={{ color: '#666', fontSize: '1.125rem' }}>
              {search ? 'No applications found matching your search' : 'No pending applications'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.relationship_id}
                application={application}
                onAccept={() => handleAcceptApplication(application.relationship_id)}
                onReject={() => handleRejectApplication(application.relationship_id)}
                processing={processingId === application.relationship_id}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function StudentCard({ student, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      {/* Student Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: student.avatar_url ? `url(${student.avatar_url})` : '#3b82f6',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem',
          fontWeight: '600'
        }}>
          {!student.avatar_url && student.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            {student.name}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {student.email}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <StatItem
          icon={<Calendar size={16} />}
          label="Total Sessions"
          value={student.total_sessions || 0}
        />
        <StatItem
          icon={<TrendingUp size={16} />}
          label="Completed"
          value={student.completed_sessions || 0}
        />
        <StatItem
          icon={<Activity size={16} />}
          label="Upcoming"
          value={student.upcoming_sessions || 0}
        />
        <StatItem
          icon={<Star size={16} />}
          label="Avg Rating"
          value={student.avg_session_rating ? parseFloat(student.avg_session_rating).toFixed(1) : 'N/A'}
        />
      </div>

      {/* Last Session */}
      {student.last_session_date && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f9fafb',
          borderRadius: '0.5rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
            Last Session
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            {new Date(student.last_session_date).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const callUrl = `/admin/coach/video-call/student/${student.user_id}`;
            window.open(callUrl, '_blank', 'width=1200,height=800');
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.625rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <Video size={16} />
          Video Call
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/admin/coach/messaging?studentId=${student.user_id}`;
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.625rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <MessageSquare size={16} />
          Message
        </button>
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.25rem',
        color: '#666'
      }}>
        {icon}
        <span style={{ fontSize: '0.75rem' }}>{label}</span>
      </div>
      <p style={{ fontSize: '1.25rem', fontWeight: '600' }}>
        {value}
      </p>
    </div>
  );
}

function ApplicationCard({ application, onAccept, onReject, processing }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '2px solid #fbbf24',
        position: 'relative'
      }}
    >
      {/* New Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: '#fbbf24',
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        NEW
      </div>

      {/* Applicant Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.75rem',
          fontWeight: '600'
        }}>
          {application.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            {application.name}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            {application.email}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#999' }}>
            Applied {new Date(application.applied_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Goals Section */}
      {application.goals && application.goals.length > 0 && (
        <div style={{
          background: '#f9fafb',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            color: '#666'
          }}>
            <MessageSquare size={16} />
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Student's Message</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>
            {application.goals.join(', ')}
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        padding: '1rem 0',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '1rem'
      }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
            Member Since
          </p>
          <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>
            {new Date(application.user_joined_at).toLocaleDateString()}
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
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem'
      }}>
        <button
          onClick={onReject}
          disabled={processing}
          style={{
            padding: '0.75rem',
            background: 'white',
            border: '2px solid #ef4444',
            borderRadius: '0.5rem',
            color: '#ef4444',
            fontWeight: '600',
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => !processing && (e.currentTarget.style.background = '#fef2f2')}
          onMouseLeave={(e) => !processing && (e.currentTarget.style.background = 'white')}
        >
          <XCircle size={18} />
          Reject
        </button>
        <button
          onClick={onAccept}
          disabled={processing}
          style={{
            padding: '0.75rem',
            background: '#10b981',
            border: '2px solid #10b981',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: '600',
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => !processing && (e.currentTarget.style.background = '#059669')}
          onMouseLeave={(e) => !processing && (e.currentTarget.style.background = '#10b981')}
        >
          <CheckCircle size={18} />
          {processing ? 'Processing...' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
