import React, { useState, useEffect } from 'react';
import { UserX, TrendingDown, RotateCcw, Calendar, RefreshCw } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function DeletionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [deletedAccounts, setDeletedAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const toast = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadDeletedAccounts(currentPage);
  }, [currentPage]);

  const loadAnalytics = async () => {
    try {
      const response = await adminAPI.get('/deletion-analytics');
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedAccounts = async (page) => {
    try {
      const response = await adminAPI.get(`/deleted-accounts?page=${page}&limit=20`);
      if (response.success) {
        setDeletedAccounts(response.data.accounts);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Load deleted accounts error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#3b82f6' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading deletion analytics...</p>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const deletionReasons = analytics?.deletionReasons || [];
  const returningUsers = analytics?.returningUsers || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Account Deletion Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Deleted</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#374151' }}>{stats.total_deleted || 0}</h2>
            </div>
            <UserX size={40} style={{ color: '#6b7280', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last 7 Days</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.deleted_last_7_days || 0}</h2>
            </div>
            <TrendingDown size={40} style={{ color: '#ef4444', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last 30 Days</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#f97316' }}>{stats.deleted_last_30_days || 0}</h2>
            </div>
            <Calendar size={40} style={{ color: '#f97316', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Returned</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#10b981' }}>{stats.total_returning_users || 0}</h2>
            </div>
            <RotateCcw size={40} style={{ color: '#10b981', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Returned (30d)</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#22c55e' }}>{stats.returning_last_30_days || 0}</h2>
            </div>
            <RotateCcw size={40} style={{ color: '#22c55e', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Deletion Reasons */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Top Deletion Reasons</h2>
          {deletionReasons.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No deletion reasons recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {deletionReasons.map((reason, index) => (
                <div key={index} style={{ paddingBottom: '1rem', borderBottom: index < deletionReasons.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem', flex: 1 }}>{reason.deletion_reason}</p>
                    <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: '600' }}>{reason.count}x</span>
                  </div>
                  {parseInt(reason.came_back_count) > 0 && (
                    <p style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      🔄 {reason.came_back_count} came back
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Returning Users */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Returning Users 🎉</h2>
          {returningUsers.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No returning users yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {returningUsers.map((user) => (
                <div key={user.new_account_id} style={{ paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: '600' }}>{user.email}</p>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{user.name || 'No name'}</p>
                    </div>
                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>
                      {Math.round(user.days_away)} days away
                    </span>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Rejoined: {formatDate(user.rejoined_at)}
                  </p>
                  {user.deletion_reason && (
                    <p style={{ color: '#f97316', fontSize: '0.75rem', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Left because: {user.deletion_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deleted Accounts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Deleted Accounts</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Deleted At</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Days Active</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Subscription</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {deletedAccounts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    No deleted accounts found
                  </td>
                </tr>
              ) : (
                deletedAccounts.map((account, index) => (
                  <tr key={account.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{account.original_email || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{account.name || 'No name'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(account.deleted_at)}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280' }}>{Math.round(account.days_active)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '9999px',
                        background: account.subscription_status === 'premium' ? '#fef3c7' : '#f3f4f6',
                        color: account.subscription_status === 'premium' ? '#92400e' : '#6b7280'
                      }}>
                        {account.subscription_status || 'free'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {account.has_returned ? (
                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>🔄 Returned</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#6b7280', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={account.deletion_reason}>
                      {account.deletion_reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn"
              style={{
                background: currentPage === 1 ? '#e5e7eb' : '#3b82f6',
                color: currentPage === 1 ? '#9ca3af' : 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ color: '#374151', fontWeight: '600' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn"
              style={{
                background: currentPage === totalPages ? '#e5e7eb' : '#3b82f6',
                color: currentPage === totalPages ? '#9ca3af' : 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
