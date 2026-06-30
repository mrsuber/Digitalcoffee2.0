import React, { useState, useEffect } from 'react';
import { Book, Search, Filter, Trash2, Eye, User, Calendar, Heart, Tag, TrendingUp, RefreshCw } from 'lucide-react';
import { journalAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ExportButton from '../components/ExportButton';

export default function JournalManagement() {
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  const fetchJournals = async () => {
    try {
      const filterParams = { ...filters };
      if (searchTerm) filterParams.search = searchTerm;

      const data = await journalAPI.getJournals(page, 50, filterParams);
      setJournals(data.data.journals);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching journals:', error);
      toast.error('Failed to fetch journals');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await journalAPI.getAnalytics(period);
      setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchJournals(), fetchAnalytics()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [page, period]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchJournals();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      await journalAPI.deleteJournal(id);
      toast.success('Journal entry deleted successfully');
      fetchJournals();
    } catch (error) {
      console.error('Error deleting journal:', error);
      toast.error('Failed to delete journal entry');
    }
  };

  const handleViewDetails = async (journal) => {
    try {
      const data = await journalAPI.getJournalById(journal.id);
      setSelectedJournal(data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching journal details:', error);
      toast.error('Failed to load journal details');
    }
  };

  const getMoodColor = (mood) => {
    const colors = {
      'Clear': '#10b981',
      'Tired': '#6b7280',
      'Anxious': '#ef4444',
      'Foggy': '#9ca3af',
      'Inspired': '#8b5cf6'
    };
    return colors[mood] || '#6b7280';
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      'Clear': '😊',
      'Tired': '😴',
      'Anxious': '😰',
      'Foggy': '🌫️',
      'Inspired': '✨'
    };
    return emojis[mood] || '📝';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading journals...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Journal Management</h1>
          <p style={{ color: '#6b7280' }}>View and moderate user journal entries</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              background: 'white'
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <ExportButton
            endpoint="/admin/export/journals"
            params={{ mood: filters.mood }}
            label="Export"
          />
          <button
            onClick={loadAllData}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics KPIs */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ opacity: 0.9, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Entries</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {analytics.totalEntries}
                </h2>
                <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Last {period} days</p>
              </div>
              <Book size={40} style={{ opacity: 0.8 }} />
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Journalers</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#10b981' }}>
                  {analytics.activeUsers}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Users writing journals</p>
              </div>
              <User size={40} style={{ color: '#10b981', opacity: 0.6 }} />
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Avg Per User</p>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#3b82f6' }}>
                  {analytics.avgEntriesPerUser}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Entries per user</p>
              </div>
              <TrendingUp size={40} style={{ color: '#3b82f6', opacity: 0.6 }} />
            </div>
          </div>
        </div>
      )}

      {/* Top Moods & Tags */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Top Moods</h3>
            {analytics.topMoods && analytics.topMoods.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {analytics.topMoods.map((mood, index) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{getMoodEmoji(mood.mood)}</span>
                        {mood.mood || 'Unknown'}
                      </span>
                      <span style={{ fontWeight: '600' }}>{mood.count}</span>
                    </div>
                    <div style={{ background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        background: getMoodColor(mood.mood),
                        height: '100%',
                        width: `${(mood.count / analytics.topMoods[0].count) * 100}%`,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No mood data available</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Popular Tags</h3>
            {analytics.topTags && analytics.topTags.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {analytics.topTags.map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Tag size={14} />
                    {tag.tag?.trim()} <span style={{ fontWeight: '600', color: '#6b7280' }}>({tag.count})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No tags available</p>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="text"
              placeholder="Search journal content or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: showFilters ? '#10b981' : 'white',
              color: showFilters ? 'white' : '#374151',
              border: '1px solid #e5e7eb'
            }}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Mood</label>
              <select
                value={filters.mood || ''}
                onChange={(e) => setFilters({ ...filters, mood: e.target.value || undefined })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  background: 'white'
                }}
              >
                <option value="">All Moods</option>
                <option value="Clear">Clear</option>
                <option value="Tired">Tired</option>
                <option value="Anxious">Anxious</option>
                <option value="Foggy">Foggy</option>
                <option value="Inspired">Inspired</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="btn"
                style={{ width: '100%', border: '1px solid #e5e7eb' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Journals List */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Journal Entries ({pagination?.total || 0})
        </h3>

        {journals.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {journals.map((journal) => (
              <div
                key={journal.id}
                style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} style={{ color: '#6b7280' }} />
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{journal.user_name || 'No Name'}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{journal.user_email}</p>
                      </div>
                    </div>

                    {journal.mood && (
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: 'white',
                        background: getMoodColor(journal.mood),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span>{getMoodEmoji(journal.mood)}</span>
                        {journal.mood}
                      </div>
                    )}

                    {journal.is_favorite && (
                      <Heart size={16} style={{ color: '#ef4444', fill: '#ef4444' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(journal);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(journal.id);
                      }}
                      style={{
                        padding: '0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p style={{ color: '#374151', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  {truncateText(journal.content, 200)}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} />
                    {formatDate(journal.created_at)}
                  </div>

                  {journal.tags && typeof journal.tags === 'string' && journal.tags.trim() && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {journal.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.125rem 0.5rem',
                            background: '#e5e7eb',
                            borderRadius: '9999px',
                            fontSize: '0.7rem'
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <Book size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No journal entries found</p>
            <p>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn"
              style={{ opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem' }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="btn"
              style={{ opacity: page === pagination.totalPages ? 0.5 : 1, cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Journal Detail Modal */}
      {showModal && selectedJournal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Journal Entry</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: '600' }}>{selectedJournal.user_name || 'No Name'}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{selectedJournal.user_email}</p>
                </div>
                {selectedJournal.mood && (
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    background: getMoodColor(selectedJournal.mood),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{getMoodEmoji(selectedJournal.mood)}</span>
                    {selectedJournal.mood}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                {formatDate(selectedJournal.created_at)}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>Content</h3>
              <p style={{ lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {selectedJournal.content}
              </p>
            </div>

            {selectedJournal.tags && typeof selectedJournal.tags === 'string' && selectedJournal.tags.trim() && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>Tags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedJournal.tags.split(',').map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#e5e7eb',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Tag size={12} />
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowModal(false)} className="btn">
                Close
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedJournal.id);
                  setShowModal(false);
                }}
                className="btn btn-danger"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
