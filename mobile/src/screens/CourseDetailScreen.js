import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { courseAPI } from '../services/api';

// Image mapping for course modes (same as CoursesScreen)
const COURSE_IMAGES = {
  'hyper-focus': require('../../assets/course-overthinking.jpg'),
  'calm-down': require('../../assets/course-peace.jpg'),
  'infinite-inspiration': require('../../assets/course-inspiration.jpg'),
  'sleep': require('../../assets/course-sleep.jpg'),
  'anxiety': require('../../assets/course-anxiety.jpg'),
  'performance': require('../../assets/course-performance.jpg'),
};

export const CourseDetailScreen = ({ navigation, route }) => {
  const { courseId } = route.params || {};
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourse(courseId);
      if (response.success) {
        setCourse(response.data);
        // Check if enrolled by seeing if there's enrollment data
        const enrolledResponse = await courseAPI.getEnrolled();
        if (enrolledResponse.success) {
          const enrolled = enrolledResponse.data.some(c => c.id.toString() === courseId.toString());
          setIsEnrolled(enrolled);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const response = await courseAPI.enroll(courseId);
      if (response.success) {
        setIsEnrolled(true);
        loadCourseDetails(); // Reload to get updated data
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const handleStartSession = (session) => {
    if (!session) {
      console.log('No session available');
      return;
    }
    if (session.locked && !isEnrolled) {
      // Show enrollment prompt or alert that this session is locked
      alert('Complete previous sessions to unlock this one!');
      return;
    }

    // Check if session has audio linked
    if (!session.audio_content_id) {
      alert('No audio available for this session yet.');
      return;
    }

    // Navigate to Focus stack's AudioPlayer
    navigation.navigate('Focus', {
      screen: 'AudioPlayer',
      params: {
        audioId: session.audio_content_id,
        courseSessionId: session.id,
        courseId: courseId,
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.alpha} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }]}>
        <Text style={styles.title}>Course not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.enrollButton}>
          <Text style={styles.enrollButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get the correct image based on mode
  const courseImage = COURSE_IMAGES[course.mode] || COURSE_IMAGES['hyper-focus'];
  const sessions = course.sessions || [];
  const benefits = [
    'Reduce mental clutter',
    'Improve decision-making',
    'Increase mental clarity',
    'Better sleep quality',
  ];

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMid,
        theme.colors.gradientEnd,
      ]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.favoriteButton}>
            <Text style={styles.favoriteButtonText}>♡</Text>
          </TouchableOpacity>
        </View>

        {/* Course Banner */}
        <View style={styles.bannerContainer}>
          <Image source={courseImage} style={styles.bannerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
            style={styles.bannerGradient}
          />
        </View>

        {/* Course Info */}
        <View style={styles.infoSection}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>FOCUS</Text>
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{course.duration_days + ' days'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{'75 min'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📊</Text>
              <Text style={styles.metaText}>{'Beginner'}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.description}>{course.description || 'A transformative program designed to enhance your mental clarity and focus.'}</Text>

          {/* Benefits */}
          <Text style={styles.sectionTitle}>What You'll Gain</Text>
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Sessions */}
          <Text style={styles.sectionTitle}>Course Sessions</Text>
          <View style={styles.sessionsList}>
            {sessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  session.completed && styles.sessionCardCompleted,
                  session.locked && !isEnrolled && styles.sessionCardLocked,
                ]}
                onPress={() => handleStartSession(session)}
                disabled={session.locked && !isEnrolled}
                activeOpacity={0.8}
              >
                <View style={styles.sessionLeft}>
                  <View
                    style={[
                      styles.sessionDayBadge,
                      session.completed && styles.sessionDayBadgeCompleted,
                    ]}
                  >
                    {session.completed ? (
                      <Text style={styles.sessionDayText}>✓</Text>
                    ) : (
                      <Text style={styles.sessionDayText}>Day {session.day_number}</Text>
                    )}
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text
                      style={[
                        styles.sessionTitle,
                        session.locked && !isEnrolled && styles.sessionTitleLocked,
                      ]}
                    >
                      {session.title}
                    </Text>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionType}>{session.type}</Text>
                      <Text style={styles.sessionDot}>•</Text>
                      <Text style={styles.sessionDuration}>{session.duration}</Text>
                    </View>
                  </View>
                </View>
                {session.locked && !isEnrolled ? (
                  <Text style={styles.sessionLockIcon}>🔒</Text>
                ) : (
                  <Text style={styles.sessionArrow}>→</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enroll/Start Button */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={styles.enrollButton}
            onPress={isEnrolled ? () => handleStartSession(sessions[0]) : handleEnroll}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollButtonGradient}
            >
              <View style={styles.enrollButtonInner}>
                <Text style={styles.enrollButtonText}>
                  {isEnrolled ? 'Start Course' : 'Enroll Now'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  favoriteButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  bannerContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  infoSection: {
    padding: theme.spacing.lg,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  categoryBadgeText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.alpha,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  courseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  benefitsList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  benefitIcon: {
    fontSize: 16,
    color: theme.colors.alpha,
  },
  benefitText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
  },
  sessionsList: {
    gap: theme.spacing.sm,
  },
  sessionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sessionCardCompleted: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderColor: theme.colors.alpha,
  },
  sessionCardLocked: {
    opacity: 0.6,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  sessionDayBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sessionDayBadgeCompleted: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  sessionDayText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  sessionTitleLocked: {
    color: theme.colors.textSecondary,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionType: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  sessionDot: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  sessionDuration: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  sessionArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  sessionLockIcon: {
    fontSize: 20,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.gradientStart,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  enrollButton: {
    width: '100%',
  },
  enrollButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  enrollButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default CourseDetailScreen;
