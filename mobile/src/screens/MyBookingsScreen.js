import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { videoCallsAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export const MyBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'

  useFocusEffect(
    React.useCallback(() => {
      loadBookings();
    }, [activeTab])
  );

  const loadBookings = async () => {
    try {
      setLoading(true);
      const isUpcoming = activeTab === 'upcoming';
      const response = await videoCallsAPI.getMyBookings(null, isUpcoming);

      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load bookings',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this video session?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => confirmCancelBooking(bookingId),
        },
      ]
    );
  };

  const confirmCancelBooking = async (bookingId) => {
    try {
      const response = await videoCallsAPI.cancelBooking(bookingId);

      if (response.success) {
        showAlert({
          type: 'success',
          title: 'Booking Cancelled',
          message: 'Your video session has been cancelled',
        });
        loadBookings();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to cancel booking',
      });
    }
  };

  const handleJoinSession = async (booking) => {
    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const minutesUntilSession = (scheduledTime - now) / (1000 * 60);

    // Allow joining 5 minutes before scheduled time
    if (minutesUntilSession > 5) {
      showAlert({
        type: 'info',
        title: 'Too Early',
        message: `You can join this session ${Math.ceil(minutesUntilSession - 5)} minutes before the scheduled time`,
      });
      return;
    }

    // Don't allow joining if more than 10 minutes late
    if (minutesUntilSession < -10) {
      showAlert({
        type: 'warning',
        title: 'Session Expired',
        message: 'This session has expired. Please book a new session.',
      });
      return;
    }

    navigation.navigate('WaitingRoom', { bookingId: booking.id });
  };

  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  };

  const getTimeUntilSession = (scheduledAt) => {
    const scheduled = new Date(scheduledAt);
    const now = new Date();
    const diff = scheduled - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) {
      return 'Session time passed';
    } else if (hours < 1) {
      return `Starts in ${minutes} minutes`;
    } else if (hours < 24) {
      return `Starts in ${hours}h ${minutes}m`;
    } else {
      const days = Math.floor(hours / 24);
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return theme.colors.primary;
      case 'in_progress':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canJoinSession = (booking) => {
    if (booking.status !== 'scheduled') return false;

    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const minutesUntilSession = (scheduledTime - now) / (1000 * 60);

    // Can join 5 minutes before up to 10 minutes after
    return minutesUntilSession <= 5 && minutesUntilSession >= -10;
  };

  const canCancelSession = (booking) => {
    if (booking.status !== 'scheduled') return false;

    const scheduledTime = new Date(booking.scheduled_at);
    const now = new Date();
    const hoursUntilSession = (scheduledTime - now) / (1000 * 60 * 60);

    // Can cancel if more than 2 hours away
    return hoursUntilSession > 2;
  };

  const renderBookingCard = (booking) => {
    const { date, time } = formatDateTime(booking.scheduled_at);
    const isUpcoming = activeTab === 'upcoming';
    const isCoach = user?.id === booking.coach_id;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <LinearGradient
          colors={['rgba(76, 29, 149, 0.1)', 'rgba(124, 58, 237, 0.05)']}
          style={styles.bookingCardGradient}
        >
          <View style={styles.bookingHeader}>
            <View style={styles.bookingTitleContainer}>
              <Text style={styles.bookingTitle}>
                {isCoach ? booking.student_name : booking.coach_name}
              </Text>
              <Text style={styles.bookingRole}>
                {isCoach ? '(Student)' : '(Coach)'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(booking.status)}</Text>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={styles.detailText}>{time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⏱️</Text>
              <Text style={styles.detailText}>30 minutes</Text>
            </View>
          </View>

          {isUpcoming && booking.status === 'scheduled' && (
            <View style={styles.timeUntilContainer}>
              <Text style={styles.timeUntilText}>
                {getTimeUntilSession(booking.scheduled_at)}
              </Text>
            </View>
          )}

          {booking.booking_notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Session Notes:</Text>
              <Text style={styles.notesText}>{booking.booking_notes}</Text>
            </View>
          )}

          <View style={styles.bookingActions}>
            {canJoinSession(booking) && (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => handleJoinSession(booking)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>Join Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {canCancelSession(booking) && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelBooking(booking.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            {!isUpcoming && booking.status === 'completed' && (
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('SessionHistory', { sessionId: booking.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>
        {activeTab === 'upcoming' ? '📅' : '📋'}
      </Text>
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'upcoming' ? 'No Upcoming Sessions' : 'No Past Sessions'}
      </Text>
      <Text style={styles.emptyStateText}>
        {activeTab === 'upcoming'
          ? 'Book a video session with a professional coach to get started'
          : 'Your completed sessions will appear here'}
      </Text>
      {activeTab === 'upcoming' && (
        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={() => navigation.navigate('BookCall')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.accent]}
            style={styles.bookNowGradient}
          >
            <Text style={styles.bookNowText}>Book a Session</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Sessions</Text>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'upcoming' && styles.tabActive
              ]}
              onPress={() => setActiveTab('upcoming')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive
              ]}>
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'past' && styles.tabActive
              ]}
              onPress={() => setActiveTab('past')}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'past' && styles.tabTextActive
              ]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {bookings.length > 0 ? (
            bookings.map(renderBookingCard)
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        <AlertComponent />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingCardGradient: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bookingTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bookingRole: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bookingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  timeUntilContainer: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  timeUntilText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  notesContainer: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  joinButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bookNowButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bookNowGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  bookNowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
