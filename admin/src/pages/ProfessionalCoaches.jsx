import React, { useState, useEffect } from 'react';
import { adminCoachesAPI } from '../services/api';
import { Search, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Users, TrendingUp } from 'lucide-react';

export default function ProfessionalCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);

  const specialties = [
    'anxiety', 'stress', 'focus', 'sleep', 'meditation',
    'productivity', 'performance', 'executive_coaching'
  ];

  useEffect(() => {
    loadCoaches();
  }, [search, statusFilter, specialtyFilter]);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const response = await adminCoachesAPI.getCoaches(search, statusFilter, specialtyFilter);
      if (response.success) {
        setCoaches(response.data);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
      alert('Error loading coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoach = () => {
    setSelectedCoach(null);
    setShowCreateModal(true);
  };

  const handleEditCoach = (coach) => {
    setSelectedCoach(coach);
    setShowEditModal(true);
  };

  const handleViewDetails = async (coach) => {
    try {
      const response = await adminCoachesAPI.getCoach(coach.id);
      if (response.success) {
        setSelectedCoach(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      alert('Error loading coach details');
    }
  };

  const handleToggleActive = async (coach) => {
    try {
      if (coach.is_active) {
        if (!confirm(`Deactivate ${coach.full_name}? They won't be able to accept new students.`)) return;
        await adminCoachesAPI.deactivateCoach(coach.id);
      } else {
        await adminCoachesAPI.activateCoach(coach.id);
      }
      loadCoaches();
    } catch (error) {
      alert('Error updating coach status');
    }
  };

  const handleDeleteCoach = async (coach) => {
    if (!confirm(`Are you sure you want to deactivate ${coach.full_name}?`)) return;

    try {
      await adminCoachesAPI.deleteCoach(coach.id);
      loadCoaches();
    } catch (error) {
      alert('Error deleting coach');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Professional Coaches</h1>
          <p style={{ color: '#9ca3af' }}>Manage professional coaching staff</p>
        </div>
        <button
          onClick={handleCreateCoach}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} />
          Add New Coach
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '1rem' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search coaches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                borderRadius: '0.5rem',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#fff'
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #374151',
              backgroundColor: '#1f2937',
              color: '#fff'
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Specialty Filter */}
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #374151',
              backgroundColor: '#1f2937',
              color: '#fff'
            }}
          >
            <option value="">All Specialties</option>
            {specialties.map(spec => (
              <option key={spec} value={spec}>{spec.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Coaches Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Loading coaches...</p>
          </div>
        ) : coaches.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Users size={48} style={{ color: '#4b5563', margin: '0 auto 1rem' }} />
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>No coaches found</p>
            <button onClick={handleCreateCoach} className="btn btn-primary">
              Add Your First Coach
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Coach</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Specialties</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Experience</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Students</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Rating</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#9ca3af', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => (
                  <tr key={coach.id} style={{ borderBottom: '1px solid #374151' }}>
                    {/* Coach Info */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#4f46e5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.25rem'
                          }}
                        >
                          {coach.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{coach.full_name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{coach.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Specialties */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {coach.specialties?.slice(0, 2).map((spec, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: '#4f46e5',
                              color: '#fff',
                              fontSize: '0.75rem'
                            }}
                          >
                            {spec}
                          </span>
                        ))}
                        {coach.specialties?.length > 2 && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            +{coach.specialties.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td style={{ padding: '1rem', color: '#d1d5db' }}>
                      {coach.years_experience || 0} years
                    </td>

                    {/* Students */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={16} style={{ color: '#9ca3af' }} />
                        <span style={{ color: '#d1d5db' }}>{coach.active_students || 0}</span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ color: '#fbbf24' }}>★</span>
                        <span style={{ color: '#d1d5db', fontWeight: '600' }}>
                          {parseFloat(coach.rating || 5.0).toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: coach.is_active ? '#065f46' : '#7f1d1d',
                          color: coach.is_active ? '#d1fae5' : '#fecaca'
                        }}
                      >
                        {coach.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewDetails(coach)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#374151',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af'
                          }}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditCoach(coach)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#374151',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af'
                          }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(coach)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#374151',
                            border: 'none',
                            cursor: 'pointer',
                            color: coach.is_active ? '#fbbf24' : '#10b981'
                          }}
                          title={coach.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {coach.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteCoach(coach)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            backgroundColor: '#7f1d1d',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#fecaca'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals will be added here */}
      {showCreateModal && (
        <CreateCoachModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCoaches();
          }}
          specialties={specialties}
        />
      )}

      {showEditModal && selectedCoach && (
        <EditCoachModal
          coach={selectedCoach}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            loadCoaches();
          }}
          specialties={specialties}
        />
      )}

      {showDetailsModal && selectedCoach && (
        <CoachDetailsModal
          coach={selectedCoach}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}

// Create Coach Modal Component
function CreateCoachModal({ onClose, onSuccess, specialties }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    avatar_url: '',
    specialties: [],
    certifications: '',
    years_experience: '',
    hourly_rate: '',
    languages: 'English',
    timezone: 'America/New_York',
    credentials: '',
    is_accepting_students: true,
    max_students: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        specialties: formData.specialties,
        languages: formData.languages.split(',').map(l => l.trim()),
        years_experience: parseInt(formData.years_experience) || 0,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        max_students: formData.max_students ? parseInt(formData.max_students) : null
      };

      const response = await adminCoachesAPI.createCoach(data);
      if (response.success) {
        alert(`Coach created successfully! ${response.data.default_password ? `Default password: ${response.data.default_password}` : ''}`);
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating coach:', error);
      alert('Error creating coach: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Add New Professional Coach</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Password (optional) */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Password (leave empty for default: Coach2024!)
              </label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Bio *
              </label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Specialties */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Specialties * (select at least one)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {specialties.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #374151',
                      backgroundColor: formData.specialties.includes(spec) ? '#4f46e5' : '#111827',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {spec.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Years Experience */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                  Years Experience *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #374151',
                    backgroundColor: '#111827',
                    color: '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                  Max Students
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_students}
                  onChange={(e) => setFormData({...formData, max_students: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #374151',
                    backgroundColor: '#111827',
                    color: '#fff'
                  }}
                />
              </div>
            </div>

            {/* Credentials */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Credentials (e.g., "Ph.D., Licensed Therapist")
              </label>
              <input
                type="text"
                value={formData.credentials}
                onChange={(e) => setFormData({...formData, credentials: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #374151',
                backgroundColor: 'transparent',
                color: '#d1d5db',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.specialties.length === 0}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? 'Creating...' : 'Create Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Coach Modal (simplified - reuses Create modal logic)
function EditCoachModal({ coach, onClose, onSuccess, specialties }) {
  const [formData, setFormData] = useState({
    full_name: coach.full_name || '',
    bio: coach.bio || '',
    avatar_url: coach.avatar_url || '',
    specialties: coach.specialties || [],
    years_experience: coach.years_experience || '',
    credentials: coach.credentials || '',
    is_accepting_students: coach.is_accepting_students !== false,
    max_students: coach.max_students || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        years_experience: parseInt(formData.years_experience) || 0,
        max_students: formData.max_students ? parseInt(formData.max_students) : null
      };

      const response = await adminCoachesAPI.updateCoach(coach.id, data);
      if (response.success) {
        alert('Coach updated successfully!');
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating coach:', error);
      alert('Error updating coach');
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (spec) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter(s => s !== spec)
        : [...prev.specialties, spec]
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Edit Coach: {coach.full_name}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Specialties */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Specialties
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {specialties.map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => toggleSpecialty(spec)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #374151',
                      backgroundColor: formData.specialties.includes(spec) ? '#4f46e5' : '#111827',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {spec.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Years Experience & Max Students */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                  Years Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #374151',
                    backgroundColor: '#111827',
                    color: '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                  Max Students
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_students}
                  onChange={(e) => setFormData({...formData, max_students: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #374151',
                    backgroundColor: '#111827',
                    color: '#fff'
                  }}
                />
              </div>
            </div>

            {/* Credentials */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d1d5db' }}>
                Credentials
              </label>
              <input
                type="text"
                value={formData.credentials}
                onChange={(e) => setFormData({...formData, credentials: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #374151',
                  backgroundColor: '#111827',
                  color: '#fff'
                }}
              />
            </div>

            {/* Accepting Students */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.is_accepting_students}
                onChange={(e) => setFormData({...formData, is_accepting_students: e.target.checked})}
                style={{ width: '1rem', height: '1rem' }}
              />
              <label style={{ color: '#d1d5db' }}>
                Accepting new students
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #374151',
                backgroundColor: 'transparent',
                color: '#d1d5db',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? 'Updating...' : 'Update Coach'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Coach Details Modal
function CoachDetailsModal({ coach, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{coach.full_name}</h2>
          <p style={{ color: '#9ca3af', marginTop: '0.25rem' }}>{coach.email}</p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {coach.active_students || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Active Students</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                {coach.total_sessions || 0}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Total Sessions</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                ★ {parseFloat(coach.avg_rating || coach.rating || 5.0).toFixed(1)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Avg Rating</div>
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>Bio</h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>{coach.bio}</p>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <span style={{ color: '#9ca3af' }}>Specialties: </span>
              <span style={{ color: '#fff' }}>{coach.specialties?.join(', ')}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Experience: </span>
              <span style={{ color: '#fff' }}>{coach.years_experience} years</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Credentials: </span>
              <span style={{ color: '#fff' }}>{coach.credentials || 'N/A'}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Languages: </span>
              <span style={{ color: '#fff' }}>{coach.languages?.join(', ')}</span>
            </div>
            <div>
              <span style={{ color: '#9ca3af' }}>Timezone: </span>
              <span style={{ color: '#fff' }}>{coach.timezone}</span>
            </div>
            {coach.max_students && (
              <div>
                <span style={{ color: '#9ca3af' }}>Max Students: </span>
                <span style={{ color: '#fff' }}>{coach.max_students}</span>
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {coach.recent_reviews && coach.recent_reviews.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>Recent Reviews</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {coach.recent_reviews.map(review => (
                  <div key={review.id} style={{ padding: '1rem', backgroundColor: '#111827', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#d1d5db', fontWeight: '600' }}>{review.user_name}</span>
                      <span style={{ color: '#fbbf24' }}>{'★'.repeat(review.rating)}</span>
                    </div>
                    {review.review && (
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{review.review}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #374151' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
