import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { coachingAPI, professionalCoachesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RateCoachModal from '../components/RateCoachModal';

const CoachingHubScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myCoach, setMyCoach] = useState(null);
  const [professionalCoaches, setProfessionalCoaches] = useState([]);
  const [students, setStudents] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [showRateModal, setShowRateModal] = useState(false);
  const [coachDashboard, setCoachDashboard] = useState(null);

  useEffect(() => {
    loadCoachingData();
  }, []);

  const loadCoachingData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [coachRes, professionalCoachesRes, studentsRes, incomingRes, outgoingRes, dashboardRes] = await Promise.all([
        coachingAPI.getMyCoach().catch(() => ({ success: true, data: null })),
        professionalCoachesAPI.getMyCoaches().catch(() => ({ success: true, data: [] })),
        coachingAPI.getMyStudents().catch(() => ({ success: true, data: [] })),
        coachingAPI.getIncomingRequests().catch(() => ({ success: true, data: [] })),
        coachingAPI.getOutgoingRequests().catch(() => ({ success: true, data: [] })),
        coachingAPI.getCoachDashboard().catch(() => ({ success: true, data: null })),
      ]);

      if (coachRes.success) setMyCoach(coachRes.data);
      if (professionalCoachesRes.success) setProfessionalCoaches(professionalCoachesRes.data || []);
      if (studentsRes.success) setStudents(studentsRes.data || []);
      if (incomingRes.success) setIncomingRequests(incomingRes.data || []);
      if (outgoingRes.success) setOutgoingRequests(outgoingRes.data || []);
      if (dashboardRes.success) setCoachDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Error loading coaching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCoachingData(true);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading coaching hub...</Text>
        </View>
      </LinearGradient>
    );
  }

  const pendingIncoming = incomingRequests.filter(r => r.status === 'pending').length;
  const pendingOutgoing = outgoingRequests.filter(r => r.status === 'pending').length;

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      style={styles.container}
    >
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // Always navigate to Courses screen (Library default)
              navigation.navigate('Courses');
            }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>COACHING HUB</Text>
            <Text style={styles.headerSubtitle}>Your meditation mentorship center</Text>
          </View>
        </View>

        {/* My Coach Card */}
        {myCoach && (
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>🎓</Text>
                <Text style={styles.cardTitle}>MY COACH</Text>
              </View>
              <View style={styles.coachInfo}>
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
                  style={styles.coachAvatar}
                >
                  <Text style={styles.coachAvatarText}>
                    {myCoach.coach_name ? myCoach.coach_name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </LinearGradient>
                <View style={styles.coachDetails}>
                  <Text style={styles.coachName}>{myCoach.coach_name}</Text>
                  <Text style={styles.coachStats}>
                    🎓 {myCoach.students_coached || 0} students coached
                  </Text>
                  {myCoach.average_rating != null && myCoach.average_rating > 0 && (
                    <Text style={styles.coachRating}>
                      ⭐ {Number(myCoach.average_rating).toFixed(1)} rating
                    </Text>
                  )}
                </View>
              </View>

              {/* Coach Actions for Students */}
              <View style={styles.coachActionsSection}>
                <Text style={styles.sectionTitle}>ACTIONS</Text>
                <View style={styles.coachActionsGrid}>
                  <TouchableOpacity
                    style={styles.coachActionButton}
                    onPress={() => navigation.navigate('Messaging', {
                      relationshipId: myCoach.relationship_id,
                      partnerName: myCoach.coach_name,
                      isProfessionalCoach: false,
                      coachId: null
                    })}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
                      style={styles.coachActionInner}
                    >
                      <Text style={styles.coachActionIcon}>💬</Text>
                      <Text style={styles.coachActionText}>Message</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.coachActionButton}
                    onPress={() => setShowRateModal(true)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)']}
                      style={styles.coachActionInner}
                    >
                      <Text style={styles.coachActionIcon}>⭐</Text>
                      <Text style={styles.coachActionText}>Rate Coach</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.coachActionButton}
                    onPress={() => navigation.navigate('StudentDetail', {
                      studentId: user?.id,
                      isViewingAsStudent: true,
                      coach: myCoach
                    })}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(147, 51, 234, 0.3)', 'rgba(147, 51, 234, 0.1)']}
                      style={styles.coachActionInner}
                    >
                      <Text style={styles.coachActionIcon}>📊</Text>
                      <Text style={styles.coachActionText}>Progress</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Professional Coaches Section */}
        {professionalCoaches.length > 0 && (
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>💎</Text>
                <Text style={styles.cardTitle}>MY PROFESSIONAL COACHES</Text>
              </View>

              {professionalCoaches.map((coach, index) => (
                <View key={coach.id || index} style={styles.professionalCoachItem}>
                  <View style={styles.coachInfo}>
                    <LinearGradient
                      colors={['rgba(147, 51, 234, 0.6)', 'rgba(236, 72, 153, 0.6)']}
                      style={styles.coachAvatar}
                    >
                      <Text style={styles.coachAvatarText}>
                        {coach.full_name ? coach.full_name.charAt(0).toUpperCase() : 'P'}
                      </Text>
                    </LinearGradient>
                    <View style={styles.coachDetails}>
                      <Text style={styles.coachName}>{coach.full_name}</Text>
                      <Text style={styles.coachSpecialties}>
                        {coach.specialties?.join(', ') || 'Professional Coach'}
                      </Text>
                      {coach.coach_rating && coach.coach_rating > 0 && (
                        <Text style={styles.coachRating}>
                          ⭐ {Number(coach.coach_rating).toFixed(1)} rating
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewCoachButton}
                    onPress={() => navigation.navigate('Home', {
                      screen: 'CoachProfile',
                      params: { coachId: coach.coach_id }
                    })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewCoachButtonText}>View Profile →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Coach Dashboard Stats */}
        {coachDashboard && students.length > 0 && (
          <View style={styles.card}>
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📊</Text>
                <Text style={styles.cardTitle}>YOUR COACHING PERFORMANCE</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{coachDashboard.active_students || 0}</Text>
                  <Text style={styles.statLabel}>Active Students</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {coachDashboard.average_rating != null ? Number(coachDashboard.average_rating).toFixed(1) : 'N/A'}
                  </Text>
                  <Text style={styles.statLabel}>Avg Rating</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{coachDashboard.total_checkins || 0}</Text>
                  <Text style={styles.statLabel}>Check-Ins</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{coachDashboard.messages_sent || 0}</Text>
                  <Text style={styles.statLabel}>Messages Sent</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewStudentsButton}
                onPress={() => navigation.navigate('MyStudents')}
                activeOpacity={0.8}
              >
                <Text style={styles.cardAction}>View All Students →</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* My Students Card (Simple version if no dashboard) */}
        {students.length > 0 && !coachDashboard && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MyStudents')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>👥</Text>
                <Text style={styles.cardTitle}>MY STUDENTS</Text>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{students.length}</Text>
                  <Text style={styles.statLabel}>Active Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {students.reduce((sum, s) => sum + (s.courses_completed || 0), 0)}
                  </Text>
                  <Text style={styles.statLabel}>Courses Completed</Text>
                </View>
              </View>
              <Text style={styles.cardAction}>View all students →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Incoming Requests Card */}
        {incomingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CoachRequests', { tab: 'incoming' })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📥</Text>
                <Text style={styles.cardTitle}>INCOMING REQUESTS</Text>
                {pendingIncoming > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingIncoming}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>
                {pendingIncoming} {pendingIncoming === 1 ? 'person wants' : 'people want'} you as their coach
              </Text>
              <Text style={styles.cardAction}>Review requests →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Outgoing Requests Card */}
        {outgoingRequests.length > 0 && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CoachRequests', { tab: 'outgoing' })}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
              style={styles.cardInner}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>📤</Text>
                <Text style={styles.cardTitle}>MY REQUESTS</Text>
                {pendingOutgoing > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingOutgoing}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>
                {pendingOutgoing} {pendingOutgoing === 1 ? 'request' : 'requests'} pending
              </Text>
              <Text style={styles.cardAction}>View status →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Empty State */}
        {!myCoach && students.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyTitle}>Start Your Coaching Journey</Text>
            <Text style={styles.emptyDescription}>
              Connect with others in the community! Find inspiring meditators and request them as your coach, or help others by becoming a coach yourself.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Library', { screen: 'Community' })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                style={styles.exploreButtonGradient}
              >
                <Text style={styles.exploreButtonText}>Explore Community</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Home', { screen: 'ProfessionalCoaches' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>🌟</Text>
                <Text style={styles.actionLabel}>Find Coaches</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionLabel}>Settings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Rate Coach Modal */}
      {myCoach && (
        <RateCoachModal
          visible={showRateModal}
          relationshipId={myCoach.relationship_id}
          coachName={myCoach.coach_name}
          onClose={() => setShowRateModal(false)}
          onSuccess={() => {
            loadCoachingData(true);
          }}
        />
      )}
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text,
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    flex: 1,
  },
  badge: {
    backgroundColor: theme.colors.alpha,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  coachDetails: {
    flex: 1,
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
  coachRating: {
    fontSize: theme.fonts.sizes.sm,
    color: '#FFD700',
    marginTop: theme.spacing.xs / 2,
  },
  coachActionsSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  coachActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  coachActionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  coachActionInner: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  coachActionIcon: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  coachActionText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  viewStudentsButton: {
    marginTop: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.alpha,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  cardAction: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  emptyState: {
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
  emptyDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  exploreButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  exploreButtonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  exploreButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  quickActions: {
    marginTop: theme.spacing.xl,
  },
  quickActionsTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  actionButtonInner: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  actionLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  professionalCoachItem: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(147, 51, 234, 0.2)',
  },
  coachSpecialties: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    marginTop: 2,
  },
  viewCoachButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  viewCoachButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
});

export default CoachingHubScreen;
