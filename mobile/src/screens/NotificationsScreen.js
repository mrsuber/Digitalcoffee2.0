import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { notificationAPI } from '../services/api';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await notificationAPI.getNotifications();

      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(true);
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationAPI.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      }

      // Navigate based on notification type
      // Need to navigate to the Library tab first, then to the specific screen
      switch (notification.type) {
        case 'coaching_request':
          navigation.navigate('Library', {
            screen: 'CoachRequests',
            params: { tab: 'incoming' }
          });
          break;
        case 'coaching_accepted':
        case 'coaching_rejected':
          navigation.navigate('Library', {
            screen: 'CoachingHub'
          });
          break;
        case 'message':
        case 'new_message':
          // Navigate to messaging screen with relationship ID
          if (notification.data?.relationship_id) {
            console.log('📬 Navigating to messaging:', {
              relationshipId: notification.data.relationship_id,
              partnerName: notification.data.sender_name,
              isProfessionalCoach: notification.data.is_professional_coach,
              fullData: notification.data
            });
            navigation.navigate('Library', {
              screen: 'Messaging',
              params: {
                relationshipId: notification.data.relationship_id,
                partnerName: notification.data.sender_name || 'User',
                isProfessionalCoach: notification.data.is_professional_coach || false
              }
            });
          } else {
            console.warn('⚠️ No relationship_id in notification data:', notification.data);
          }
          break;
        case 'community_comment':
        case 'community_like':
          if (notification.data?.post_id) {
            navigation.navigate('Library', {
              screen: 'PostDetail',
              params: { postId: notification.data.post_id }
            });
          }
          break;
        case 'checkin':
        case 'student_checkin':
          // Navigate to student detail if there's a student ID
          if (notification.data?.student_id) {
            navigation.navigate('Library', {
              screen: 'StudentDetail',
              params: {
                studentId: notification.data.student_id,
                studentName: notification.data.student_name,
                relationshipId: notification.data.relationship_id
              }
            });
          } else {
            navigation.navigate('Library', {
              screen: 'MyStudents'
            });
          }
          break;
        case 'course_milestone':
          // Navigate to Progress screen
          navigation.navigate('Progress');
          break;
        case 'incoming_call':
          // Navigate to incoming call screen
          if (notification.data?.sessionId && notification.data?.coachName && notification.data?.roomId) {
            navigation.navigate('IncomingCall', {
              sessionId: notification.data.sessionId,
              coachName: notification.data.coachName,
              roomId: notification.data.roomId
            });
          }
          break;
        case 'system_message':
          // Stay on notifications screen or navigate to home
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleClearRead = async () => {
    Alert.alert(
      'Clear Read Notifications',
      'Are you sure you want to clear all read notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationAPI.clearRead();
              setNotifications(prev => prev.filter(n => !n.is_read));
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      coaching_request: '🎓',
      coaching_accepted: '✅',
      coaching_rejected: '❌',
      community_comment: '💬',
      community_like: '❤️',
      course_milestone: '🎯',
      system_message: '📢',
      message: '💌',
      incoming_call: '📞',
      new_message: '💌',
      checkin: '✓',
      student_checkin: '✓',
    };
    return iconMap[type] || '🔔';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
        {!item.is_read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{getTimeAgo(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! We'll notify you of important updates.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#000614', '#000614', '#000614']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </LinearGradient>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <LinearGradient colors={['#000614', '#000614', '#000614']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllRead} activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          {notifications.filter(n => n.is_read).length > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={handleClearRead} activeOpacity={0.7}>
              <Text style={styles.actionButtonText}>Clear Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
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
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'column',
    gap: theme.spacing.xs,
  },
  actionButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.md,
  },
  actionButtonText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  notificationCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.4)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  unreadCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.8)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  iconContainer: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 32,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.alpha,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  notificationMessage: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  notificationTime: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.xl,
  },
});

export default NotificationsScreen;
