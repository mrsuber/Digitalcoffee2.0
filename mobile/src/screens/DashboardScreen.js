import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CommonActions } from '@react-navigation/native';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';
import { useAuth } from '../context/AuthContext';
import { progressAPI, courseAPI, notificationAPI, professionalCoachesAPI, subscriptionAPI } from '../services/api';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const [todayProgress, setTodayProgress] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNoCourseModal, setShowNoCourseModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [featuredCoaches, setFeaturedCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.timing(slideUp, {
      toValue: 0,
      duration: 700,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();

    loadDashboardData();
    loadSubscriptionStatus();
  }, []);

  // Update subscription status when user context changes
  useEffect(() => {
    if (user?.subscription_status) {
      setSubscriptionStatus(user.subscription_status);
    }
  }, [user?.subscription_status]);

  useEffect(() => {
    if (subscriptionStatus === 'premium') {
      loadFeaturedCoaches();
    }
  }, [subscriptionStatus]);

  const loadSubscriptionStatus = async () => {
    try {
      // First check user context for subscription status
      if (user?.subscription_status) {
        setSubscriptionStatus(user.subscription_status);
        return;
      }

      // If not in context, fetch from API
      const response = await subscriptionAPI.getStatus();
      if (response.success && response.data) {
        setSubscriptionStatus(response.data.subscription_status || 'free');
      } else {
        setSubscriptionStatus('free');
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setSubscriptionStatus('free');
    }
  };

  const loadFeaturedCoaches = async () => {
    try {
      setLoadingCoaches(true);
      const response = await professionalCoachesAPI.getAll(null, 4.8, 3);
      if (response.success) {
        setFeaturedCoaches(response.data || []);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [progressRes, coursesRes, notifRes] = await Promise.all([
        progressAPI.getToday().catch(() => ({ success: true, data: null })),
        courseAPI.getEnrolled().catch(() => ({ success: true, data: [] })),
        notificationAPI.getUnreadCount().catch(() => ({ success: true, data: { count: 0 } })),
      ]);

      if (progressRes.success) {
        setTodayProgress(progressRes.data);
      }

      if (coursesRes.success) {
        setEnrolledCourses(coursesRes.data || []);
      }

      if (notifRes.success) {
        setUnreadNotifications(notifRes.data.count || 0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const animatedStyle = {
    opacity: fadeIn,
    transform: [{ translateY: slideUp }],
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleStartSession = () => {
    // If user has enrolled courses, show the first active one
    if (enrolledCourses.length > 0) {
      const activeCourse = enrolledCourses[0];
      // First navigate to Library tab (this will show Courses screen)
      navigation.navigate('Library');
      // Then navigate to CourseDetail so back button goes to Courses
      setTimeout(() => {
        navigation.navigate('Library', {
          screen: 'CourseDetail',
          params: { courseId: activeCourse.id }
        });
      }, 50);
    } else {
      // Show custom modal instead of alert
      setShowNoCourseModal(true);
    }
  };

  const currentCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <Animated.View style={[styles.header, animatedStyle]}>
          <View>
            <Text style={styles.greetingTime}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>{user?.name || 'Friend'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            {unreadNotifications > 0 && <View style={styles.notificationDot} />}
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Central brain pulse */}
        <Animated.View style={[styles.brainContainer, animatedStyle]}>
          <BrainPulse size={220} pulseSpeed={1600} />
        </Animated.View>

        {/* Today's Focus Card */}
        <Animated.View style={[styles.sessionCard, animatedStyle]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {currentCourse ? 'TODAY\'S FOCUS SESSION' : 'START YOUR JOURNEY'}
            </Text>
            {currentCourse && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DAY {currentCourse.current_day || 1}</Text>
              </View>
            )}
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>
              {currentCourse ? currentCourse.title : 'Enroll in a Course'}
            </Text>
            <Text style={styles.sessionDetails}>
              {currentCourse
                ? `${currentCourse.duration_days} day program`
                : 'Choose from our curated focus programs'}
            </Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.alpha} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playButton}
              activeOpacity={0.8}
              onPress={handleStartSession}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playGradient}
              >
                <Text style={styles.playIcon}>▶</Text>
                <Text style={styles.playText}>
                  {currentCourse ? 'START SESSION' : 'BROWSE COURSES'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Today's Progress Stats */}
        {todayProgress && (
          <Animated.View style={[styles.statsCard, animatedStyle]}>
            <Text style={styles.cardTitle}>TODAY'S PROGRESS</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayProgress.sessions_completed || 0}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayProgress.total_minutes || 0}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{todayProgress.streak_days || 0}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActions, animatedStyle]}>
          <Text style={styles.cardTitle}>QUICK ACTIONS</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Library', { screen: 'Courses' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>📚</Text>
                <Text style={styles.actionLabel}>Courses</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Library', { screen: 'AudioLibrary' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>🎧</Text>
                <Text style={styles.actionLabel}>Audio</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Library', { screen: 'Journal' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>📝</Text>
                <Text style={styles.actionLabel}>Journal</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Library', { screen: 'Community' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>🌟</Text>
                <Text style={styles.actionLabel}>Community</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Progress')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(13, 148, 136, 0.2)', 'rgba(13, 148, 136, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>📊</Text>
                <Text style={styles.actionLabel}>Progress</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Library', { screen: 'CoachingHub' })}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.05)']}
                style={styles.actionButtonInner}
              >
                <Text style={styles.actionEmoji}>🎓</Text>
                <Text style={styles.actionLabel}>Coaching</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Pro Coaches - Premium Only */}
            {subscriptionStatus === 'premium' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ProfessionalCoaches')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(124, 58, 237, 0.3)', 'rgba(76, 29, 149, 0.1)']}
                  style={styles.actionButtonInner}
                >
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>💎</Text>
                  </View>
                  <Text style={styles.actionEmoji}>👨‍⚕️</Text>
                  <Text style={styles.actionLabel}>Pro Coaches</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Professional Coaches (Premium Only) */}
        {subscriptionStatus === 'premium' && (
          <Animated.View style={[styles.coachesSection, animatedStyle]}>
            <View style={styles.coachesSectionHeader}>
              <Text style={styles.cardTitle}>PROFESSIONAL COACHES</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ProfessionalCoaches')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {loadingCoaches ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.alpha} />
              </View>
            ) : featuredCoaches.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coachesScrollContent}
              >
                {featuredCoaches.map((coach) => (
                  <TouchableOpacity
                    key={coach.id}
                    style={styles.coachCard}
                    onPress={() => navigation.navigate('CoachProfile', { coachId: coach.id })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(76, 29, 149, 0.3)', 'rgba(124, 58, 237, 0.1)']}
                      style={styles.coachCardGradient}
                    >
                      {/* Coach Avatar */}
                      <View style={styles.coachAvatarContainer}>
                        {coach.avatar_url ? (
                          <Image
                            source={{ uri: coach.avatar_url }}
                            style={styles.coachAvatar}
                          />
                        ) : (
                          <View style={styles.coachAvatarPlaceholder}>
                            <Text style={styles.coachAvatarText}>
                              {coach.full_name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          </View>
                        )}
                        <View style={styles.coachRatingBadge}>
                          <Text style={styles.coachRatingText}>⭐ {(parseFloat(coach.rating) || 5.0).toFixed(1)}</Text>
                        </View>
                      </View>

                      {/* Coach Info */}
                      <Text style={styles.coachName} numberOfLines={1}>
                        {coach.full_name}
                      </Text>
                      <Text style={styles.coachSpecialty} numberOfLines={2}>
                        {coach.specialties?.slice(0, 2).join(', ')}
                      </Text>
                      <View style={styles.coachStats}>
                        <Text style={styles.coachStatText}>
                          👥 {coach.total_students || 0} students
                        </Text>
                        <Text style={styles.coachStatText}>
                          💼 {coach.years_experience || 0}y exp
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCoachesContainer}>
                <Text style={styles.emptyCoachesText}>No coaches available at the moment</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* No Course Modal */}
      <Modal
        visible={showNoCourseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoCourseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.blurView}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowNoCourseModal(false)}
            />
          </BlurView>
          <Animated.View style={styles.modalContainer}>
            <LinearGradient
              colors={['rgba(26, 20, 72, 0.98)', 'rgba(15, 10, 50, 0.98)']}
              style={styles.modalContent}
            >
              <View style={styles.modalIcon}>
                <Text style={styles.modalIconEmoji}>📚</Text>
              </View>
              <Text style={styles.modalTitle}>No Active Course</Text>
              <Text style={styles.modalMessage}>
                Enroll in a course to start your focus session and unlock your full potential!
              </Text>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                activeOpacity={0.8}
                onPress={() => {
                  setShowNoCourseModal(false);
                  navigation.navigate('Library');
                }}
              >
                <LinearGradient
                  colors={[theme.colors.alpha, theme.colors.theta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalPrimaryButtonText}>Browse Courses</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                activeOpacity={0.7}
                onPress={() => setShowNoCourseModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  greetingTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  greetingName: {
    fontSize: theme.fonts.sizes.xxl,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.alpha,
  },
  notificationIcon: {
    fontSize: 20,
  },
  brainContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  moodSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    letterSpacing: 2,
    fontWeight: '600',
  },
  moodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  moodButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  moodButtonInner: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  todayMoodCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  todayMoodCardInner: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    borderRadius: theme.borderRadius.lg,
  },
  todayMoodEmoji: {
    fontSize: 36,
    marginRight: theme.spacing.md,
  },
  todayMoodInfo: {
    flex: 1,
  },
  todayMoodLabel: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs / 2,
  },
  todayMoodSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  sessionCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: theme.colors.alpha,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sessionInfo: {
    marginBottom: theme.spacing.lg,
  },
  sessionTitle: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  sessionDetails: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  playButton: {
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  playGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  playIcon: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 2,
  },
  playText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  loadingContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxxl,
    color: theme.colors.alpha,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
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
  quickActions: {
    marginBottom: theme.spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  actionButtonInner: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgeText: {
    fontSize: 10,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  actionLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: width - 60,
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  modalIconEmoji: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  modalPrimaryButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  modalButtonGradient: {
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  modalPrimaryButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  modalSecondaryButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  modalSecondaryButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  successModalContainer: {
    width: width - 100,
    maxWidth: 300,
  },
  successModalContent: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(13, 148, 136, 0.5)',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  successIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  successMessage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  coachesSection: {
    marginBottom: theme.spacing.xl,
  },
  coachesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  seeAllText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  coachesScrollContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  coachCard: {
    width: 180,
    marginRight: theme.spacing.md,
  },
  coachCardGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  coachAvatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  coachAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: theme.colors.alpha,
  },
  coachAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.alpha,
  },
  coachAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  coachRatingBadge: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.alpha,
  },
  coachRatingText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  coachName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
    textAlign: 'center',
  },
  coachSpecialty: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    minHeight: 28,
  },
  coachStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.2)',
  },
  coachStatText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  emptyCoachesContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyCoachesText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
});

export default DashboardScreen;
