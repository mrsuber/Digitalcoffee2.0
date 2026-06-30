import React, { useState, useEffect } from 'react';
import { Users, DollarSign, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { adminUsersAPI, adminAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function SubscriptionManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalPremiumUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
  });
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get users with subscription info
      const usersResponse = await adminUsersAPI.getUsers(1, 1000);

      if (usersResponse.success) {
        const allUsers = usersResponse.data.users || [];
        setUsers(allUsers);

        // Calculate stats
        const premiumUsers = allUsers.filter(u => u.subscription_status === 'premium');
        const totalPremiumUsers = premiumUsers.length;

        setStats(prev => ({
          ...prev,
          totalPremiumUsers,
        }));
      }

      // Get payment logs
      try {
        const paymentsResponse = await adminAPI.get('/payment-logs');
        if (paymentsResponse.success) {
          const paymentData = paymentsResponse.data || [];
          setPayments(paymentData);

          // Calculate revenue
          const completedPayments = paymentData.filter(p => p.status === 'completed');
          const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
          const monthlyRevenue = completedPayments.filter(p => p.plan_type === 'monthly').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
          const yearlyRevenue = completedPayments.filter(p => p.plan_type === 'yearly').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

          setStats(prev => ({
            ...prev,
            totalRevenue,
            monthlyRevenue,
            yearlyRevenue,
          }));
        }
      } catch (error) {
        console.error('Error loading payments:', error);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'free') return !user.subscription_status || user.subscription_status === 'free';
    return user.subscription_status === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'premium': return { bg: '#dcfce7', color: '#166534' };
      case 'expired': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', color: '#166534' };
      case 'pending': return { bg: '#fef3c7', color: '#92400e' };
      case 'failed': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#3b82f6' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Subscription Management</h1>
        <p style={{ color: '#6b7280' }}>Monitor and manage user subscriptions and payments</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Premium Users</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#10b981' }}>{stats.totalPremiumUsers}</h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Active subscriptions</p>
            </div>
            <Users size={40} style={{ color: '#10b981', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Revenue</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#3b82f6' }}>${stats.totalRevenue.toFixed(2)}</h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>All time</p>
            </div>
            <DollarSign size={40} style={{ color: '#3b82f6', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Monthly Plans</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>${stats.monthlyRevenue.toFixed(2)}</h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Revenue from monthly</p>
            </div>
            <CreditCard size={40} style={{ color: '#8b5cf6', opacity: 0.6 }} />
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Yearly Plans</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#f59e0b' }}>${stats.yearlyRevenue.toFixed(2)}</h2>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>Revenue from yearly</p>
            </div>
            <Calendar size={40} style={{ color: '#f59e0b', opacity: 0.6 }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: '600', color: '#374151' }}>Filter by Status:</label>
          <button
            onClick={() => setFilter('all')}
            className="btn"
            style={{
              background: filter === 'all' ? '#3b82f6' : 'white',
              color: filter === 'all' ? 'white' : '#374151',
              border: `1px solid ${filter === 'all' ? '#3b82f6' : '#d1d5db'}`
            }}
          >
            All Users ({users.length})
          </button>
          <button
            onClick={() => setFilter('premium')}
            className="btn"
            style={{
              background: filter === 'premium' ? '#10b981' : 'white',
              color: filter === 'premium' ? 'white' : '#374151',
              border: `1px solid ${filter === 'premium' ? '#10b981' : '#d1d5db'}`
            }}
          >
            Premium ({users.filter(u => u.subscription_status === 'premium').length})
          </button>
          <button
            onClick={() => setFilter('free')}
            className="btn"
            style={{
              background: filter === 'free' ? '#6b7280' : 'white',
              color: filter === 'free' ? 'white' : '#374151',
              border: `1px solid ${filter === 'free' ? '#6b7280' : '#d1d5db'}`
            }}
          >
            Free ({users.filter(u => !u.subscription_status || u.subscription_status === 'free').length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Users ({filteredUsers.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>User</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Started</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Expires</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Stripe Customer</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => {
                const statusColors = getStatusColor(user.subscription_status);
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '9999px',
                        background: statusColors.bg,
                        color: statusColors.color
                      }}>
                        {(user.subscription_status || 'FREE').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(user.subscription_started_at)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {formatDate(user.subscription_expires_at)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                      {user.stripe_customer_id ? user.stripe_customer_id.substring(0, 20) + '...' : 'N/A'}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    No users found with the selected filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Payments</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>User ID</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Plan</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Payment Intent</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 20).map((payment, index) => {
                  const statusColors = getPaymentStatusColor(payment.status);
                  return (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        {formatDate(payment.created_at)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        #{payment.user_id}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          background: '#dbeafe',
                          color: '#1e40af'
                        }}>
                          {(payment.plan_type || 'N/A').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                        ${parseFloat(payment.amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          background: statusColors.bg,
                          color: statusColors.color
                        }}>
                          {(payment.status || 'PENDING').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                        {payment.stripe_payment_intent_id ? payment.stripe_payment_intent_id.substring(0, 20) + '...' : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
