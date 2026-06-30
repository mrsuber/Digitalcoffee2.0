import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { coachingAPI } from '../services/api';

const CoachRequestsScreen = ({ navigation, route }) => {
  const initialTab = route.params?.tab || 'incoming';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [incomingRes, outgoingRes] = await Promise.all([
        coachingAPI.getIncomingRequests(),
        coachingAPI.getOutgoingRequests(),
      ]);

      if (incomingRes.success) setIncomingRequests(incomingRes.data || []);
      if (outgoingRes.success) setOutgoingRequests(outgoingRes.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRequests(true);
  };

  const handleAccept = async (requestId, studentName) => {
    Alert.alert(
      'Accept Request',
      `Accept ${studentName} as your student?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setProcessing(requestId);
              const response = await coachingAPI.acceptRequest(requestId);
              if (response.success) {
                Alert.alert('Success!', `${studentName} is now your student! 🎓`);
                loadRequests();
              }
            } catch (error) {
              console.error('Error accepting request:', error);
              Alert.alert('Error', 'Failed to accept request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId, studentName) => {
    Alert.alert(
      'Reject Request',
      `Reject coaching request from ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(requestId);
              const response = await coachingAPI.rejectRequest(requestId);
              if (response.success) {
                Alert.alert('Request Rejected');
                loadRequests();
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            } finally {
              setProcessing(null);
            }
          },
        },
      ]
    );
  };

  const renderIncomingRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['rgba(26, 20, 72, 0.6)', 'rgba(15, 10, 50, 0.6)']}
        style={styles.cardInner}
      >
        <View style={styles.requestHeader}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {item.student_name ? item.student_name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </LinearGradient>
          <View style={styles.requestInfo}>
            <Text style={styles.userName}>{item.student_name || 'Anonymous'}</Text>
            <Text style={styles.requestDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id, item.student_name)}
              disabled={processing === item.id}
              activeOpacity={0.7}
            >
              {processing === item.id ? (
                <ActivityIndicator size="small" color="#ec4899" />
              ) : (
                <Text style={styles.rejectButtonText}>Reject</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(item.id, item.student_name)}
              disabled={processing === item.id}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                style={styles.acceptButtonGradient}
              >
                {processing === item.id ? (
                  <ActivityIndicator size="small" color={theme.colors.text} />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {item.status !== 'pending' && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderOutgoingRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <LinearGradient
        colors={['rgba(26, 20, 72, 0.6)', 'rgba(15, 10, 50, 0.6)']}
        style={styles.cardInner}
      >
        <View style={styles.requestHeader}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {item.coach_name ? item.coach_name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </LinearGradient>
          <View style={styles.requestInfo}>
            <Text style={styles.userName}>{item.coach_name || 'Anonymous'}</Text>
            <Text style={styles.coachStats}>
              🎓 {item.students_coached || 0} students
            </Text>
          </View>
        </View>

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Your message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            item.status === 'pending' && styles.pendingStatus,
            item.status === 'accepted' && styles.acceptedStatus,
            item.status === 'rejected' && styles.rejectedStatus,
          ]}>
            {item.status === 'pending' && '⏳ Pending'}
            {item.status === 'accepted' && '✅ Accepted'}
            {item.status === 'rejected' && '❌ Rejected'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'incoming' ? '📥' : '📤'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'incoming' ? 'No Incoming Requests' : 'No Outgoing Requests'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'incoming'
          ? 'When people request you as their coach, they\'ll appear here'
          : 'Coaching requests you send will appear here'}
      </Text>
    </View>
  );

  const currentData = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  if (loading) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coaching Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.activeTab]}
          onPress={() => setActiveTab('incoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' && styles.activeTabText]}>
            Incoming
          </Text>
          {incomingRequests.filter(r => r.status === 'pending').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {incomingRequests.filter(r => r.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && styles.activeTab]}
          onPress={() => setActiveTab('outgoing')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' && styles.activeTabText]}>
            Outgoing
          </Text>
          {outgoingRequests.filter(r => r.status === 'pending').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {outgoingRequests.filter(r => r.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        renderItem={activeTab === 'incoming' ? renderIncomingRequest : renderOutgoingRequest}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.alpha}
            colors={[theme.colors.alpha]}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: theme.colors.alpha,
  },
  tabText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.text,
  },
  tabBadge: {
    marginLeft: theme.spacing.xs,
    backgroundColor: theme.colors.alpha,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  requestCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  cardInner: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: theme.borderRadius.xl,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  avatarText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  requestDate: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  coachStats: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  messageContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  messageLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  rejectButton: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#ec4899',
    fontWeight: '600',
  },
  acceptButton: {
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  statusBadge: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  pendingStatus: {
    color: '#f59e0b',
  },
  acceptedStatus: {
    color: '#10b981',
  },
  rejectedStatus: {
    color: '#ec4899',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CoachRequestsScreen;
