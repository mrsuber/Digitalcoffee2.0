import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { coachingAPI } from '../services/api';

const MyStudentsScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await coachingAPI.getMyStudents();
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStudents(true);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const startDate = new Date(timestamp);
    const diffInDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Started today';
    if (diffInDays === 1) return 'Started yesterday';
    if (diffInDays < 7) return `Started ${diffInDays} days ago`;
    if (diffInDays < 30) return `Started ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Started ${Math.floor(diffInDays / 30)} months ago`;
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentCard}>
      <LinearGradient
        colors={['rgba(26, 20, 72, 0.6)', 'rgba(15, 10, 50, 0.6)']}
        style={styles.cardInner}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('StudentDetail', {
            studentId: item.student_id,
            studentName: item.student_name,
            relationshipId: item.relationship_id
          })}
          activeOpacity={0.8}
        >
          <View style={styles.studentHeader}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {item.student_name ? item.student_name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </LinearGradient>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.student_name || 'Anonymous'}</Text>
              <Text style={styles.startedDate}>{getTimeAgo(item.started_at)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.courses_completed || 0}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.total_milestones || 0}</Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </View>
          </View>

          {item.recent_milestones && item.recent_milestones.length > 0 && (
            <View style={styles.recentMilestone}>
              <Text style={styles.milestoneIcon}>🏆</Text>
              <Text style={styles.milestoneText} numberOfLines={1}>
                Latest: {getMilestoneText(item.recent_milestones[0])}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Messaging', {
              relationshipId: item.relationship_id,
              partnerName: item.student_name,
              isProfessionalCoach: false,
              coachId: null
            })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
              style={styles.quickActionInner}
            >
              <Text style={styles.quickActionIcon}>💬</Text>
              <Text style={styles.quickActionText}>Message</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('StudentDetail', {
              studentId: item.student_id,
              studentName: item.student_name,
              relationshipId: item.relationship_id,
              openCheckIn: true
            })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)']}
              style={styles.quickActionInner}
            >
              <Text style={styles.quickActionIcon}>✓</Text>
              <Text style={styles.quickActionText}>Check-In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('StudentDetail', {
              studentId: item.student_id,
              studentName: item.student_name,
              relationshipId: item.relationship_id
            })}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.3)', 'rgba(147, 51, 234, 0.1)']}
              style={styles.quickActionInner}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const getMilestoneText = (milestone) => {
    if (!milestone) return 'Achievement';

    switch (milestone.type) {
      case 'course_completed':
        return milestone.data?.course_name || 'Completed a course';
      case 'streak_milestone':
        return `${milestone.data?.days || 0} day streak!`;
      default:
        return 'New achievement';
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Students Yet</Text>
      <Text style={styles.emptyText}>
        When people request you as their coach and you accept, they'll appear here!
      </Text>
    </View>
  );

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Students</Text>
          <Text style={styles.headerSubtitle}>{students.length} active</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.relationship_id.toString()}
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  studentCard: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  avatarText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  startedDate: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: theme.borderRadius.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.alpha,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  recentMilestone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  milestoneIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  milestoneText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  quickActionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quickActionInner: {
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs / 2,
  },
  quickActionText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
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

export default MyStudentsScreen;
