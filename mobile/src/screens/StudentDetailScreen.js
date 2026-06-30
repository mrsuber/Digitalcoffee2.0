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
import { coachingAPI } from '../services/api';
import CheckInModal from '../components/CheckInModal';
import RateCoachModal from '../components/RateCoachModal';

const StudentDetailScreen = ({ navigation, route }) => {
  const { studentId, studentName, relationshipId, isViewingAsStudent, coach, openCheckIn } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [checkins, setCheckins] = useState([]);

  useEffect(() => {
    if (!isViewingAsStudent) {
      loadStudentProgress();
      loadCheckins();
    } else {
      // Student viewing their own progress
      setLoading(false);
    }

    // Auto-open check-in modal if requested
    if (openCheckIn && !isViewingAsStudent) {
      setTimeout(() => setShowCheckInModal(true), 500);
    }
  }, []);

  const loadStudentProgress = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await coachingAPI.getStudentProgress(studentId);
      if (response.success) {
        setProgressData(response.data);
      }
    } catch (error) {
      console.error('Error loading student progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCheckins = async () => {
    try {
      const response = await coachingAPI.getCheckins(relationshipId);
      if (response.success) {
        setCheckins(response.data || []);
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStudentProgress(true);
  };

  const handleEndRelationship = () => {
    Alert.alert(
      'End Coaching Relationship',
      `Are you sure you want to end your coaching relationship with ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Relationship',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await coachingAPI.endRelationship(relationshipId);
              if (response.success) {
                Alert.alert('Success', 'Coaching relationship ended', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              }
            } catch (error) {
              console.error('Error ending relationship:', error);
              Alert.alert('Error', 'Failed to end relationship');
            }
          },
        },
      ]
    );
  };

  const getLastWeekProgress = () => {
    if (!progressData?.progress) return [];
    return progressData.progress.slice(0, 7);
  };

  const getTotalSessionsThisWeek = () => {
    const lastWeek = getLastWeekProgress();
    return lastWeek.reduce((sum, day) => sum + (day.sessions_completed || 0), 0);
  };

  const getTotalMinutesThisWeek = () => {
    const lastWeek = getLastWeekProgress();
    return lastWeek.reduce((sum, day) => sum + (day.total_minutes || 0), 0);
  };

  const getCurrentStreak = () => {
    if (!progressData?.progress || progressData.progress.length === 0) return 0;
    return progressData.progress[0]?.streak_days || 0;
  };

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
        <Text style={styles.headerTitle}>
          {isViewingAsStudent ? 'My Progress' : studentName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.alpha}
            colors={[theme.colors.alpha]}
          />
        }
      >
        {/* Coach Info (if viewing as student) */}
        {isViewingAsStudent && coach && (
          <View style={styles.coachCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.cardInner}
            >
              <Text style={styles.cardTitle}>YOUR COACH</Text>
              <View style={styles.coachInfo}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
                  style={styles.coachAvatar}
                >
                  <Text style={styles.coachAvatarText}>
                    {coach.coach_name ? coach.coach_name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </LinearGradient>
                <View>
                  <Text style={styles.coachName}>{coach.coach_name}</Text>
                  <Text style={styles.coachStats}>
                    🎓 {coach.students_coached || 0} students • ✅ {coach.courses_helped_complete || 0} courses
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Weekly Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.statCardInner}
              >
                <Text style={styles.statIcon}>🧘</Text>
                <Text style={styles.statValue}>{getTotalSessionsThisWeek()}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                style={styles.statCardInner}
              >
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statValue}>{getTotalMinutesThisWeek()}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                style={styles.statCardInner}
              >
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{getCurrentStreak()}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Courses */}
        {progressData?.courses && progressData.courses.length > 0 && (
          <View style={styles.coursesSection}>
            <Text style={styles.sectionTitle}>COURSES</Text>
            {progressData.courses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                <LinearGradient
                  colors={['rgba(26, 20, 72, 0.6)', 'rgba(15, 10, 50, 0.6)']}
                  style={styles.courseCardInner}
                >
                  <View style={styles.courseHeader}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    {course.completed_at && (
                      <Text style={styles.completedBadge}>✅ Completed</Text>
                    )}
                  </View>
                  {!course.completed_at && (
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${((course.current_day || 0) / (course.duration_days || 1)) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                  <Text style={styles.courseDetail}>
                    Day {course.current_day || 0} of {course.duration_days || 0}
                  </Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {/* Milestones */}
        {progressData?.milestones && progressData.milestones.length > 0 && (
          <View style={styles.milestonesSection}>
            <Text style={styles.sectionTitle}>MILESTONES ACHIEVED</Text>
            {progressData.milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <Text style={styles.milestoneIcon}>🏆</Text>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>
                    {getMilestoneTitle(milestone)}
                  </Text>
                  <Text style={styles.milestoneDate}>
                    {new Date(milestone.achieved_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Coach Actions */}
        {!isViewingAsStudent && relationshipId && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>COACHING ACTIONS</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messaging', {
                relationshipId: relationshipId,
                partnerName: studentName,
                isProfessionalCoach: false,
                coachId: null
              })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionText}>Message Student</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowCheckInModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.3)', 'rgba(147, 51, 234, 0.1)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>✓</Text>
                <Text style={styles.actionText}>Record Check-In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {checkins.length > 0 && (
              <View style={styles.checkinsHistory}>
                <Text style={styles.checkinsTitle}>Recent Check-Ins ({checkins.length})</Text>
                {checkins.slice(0, 3).map((checkin) => (
                  <View key={checkin.id} style={styles.checkinItem}>
                    <Text style={styles.checkinDate}>
                      {new Date(checkin.checked_at).toLocaleDateString()}
                    </Text>
                    {checkin.notes && (
                      <Text style={styles.checkinNotes}>{checkin.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Student Actions */}
        {isViewingAsStudent && coach && (
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>COACH ACTIONS</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Messaging', {
                relationshipId: coach.relationship_id,
                partnerName: coach.coach_name,
                isProfessionalCoach: false,
                coachId: null
              })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionText}>Message Coach</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowRateModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.1)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>⭐</Text>
                <Text style={styles.actionText}>Rate Your Coach</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* End Relationship Button (for coaches) */}
        {!isViewingAsStudent && relationshipId && (
          <TouchableOpacity
            style={styles.endButton}
            onPress={handleEndRelationship}
            activeOpacity={0.7}
          >
            <Text style={styles.endButtonText}>End Coaching Relationship</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modals */}
      <CheckInModal
        visible={showCheckInModal}
        relationshipId={relationshipId}
        studentName={studentName}
        onClose={() => setShowCheckInModal(false)}
        onSuccess={() => {
          loadCheckins();
          loadStudentProgress(true);
        }}
      />

      <RateCoachModal
        visible={showRateModal}
        relationshipId={coach?.relationship_id}
        coachName={coach?.coach_name}
        onClose={() => setShowRateModal(false)}
        onSuccess={() => {
          // Reload coach data if needed
        }}
      />
    </LinearGradient>
  );
};

const getMilestoneTitle = (milestone) => {
  switch (milestone.milestone_type) {
    case 'course_completed':
      return `Completed: ${milestone.milestone_data?.course_name || 'Course'}`;
    case 'streak_milestone':
      return `${milestone.milestone_data?.days || 0} Day Streak Achievement!`;
    default:
      return 'Achievement Unlocked';
  }
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  coachCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  cardInner: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.xl,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  coachAvatarText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  coachName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  coachStats: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  statCardInner: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
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
    textAlign: 'center',
  },
  coursesSection: {
    marginBottom: theme.spacing.lg,
  },
  courseCard: {
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  courseCardInner: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  courseTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  completedBadge: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 3,
  },
  courseDetail: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  milestonesSection: {
    marginBottom: theme.spacing.xl,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  milestoneIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  milestoneDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: theme.borderRadius.xl,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  actionText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  checkinsHistory: {
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(26, 20, 72, 0.4)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  checkinsTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  checkinItem: {
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.1)',
  },
  checkinDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    marginBottom: 4,
  },
  checkinNotes: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  endButton: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    marginBottom: theme.spacing.xl,
  },
  endButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: '#ec4899',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default StudentDetailScreen;
