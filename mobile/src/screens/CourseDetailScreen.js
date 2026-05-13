import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

// Sample course data - would come from API
const COURSE_DATA = {
  id: '1',
  title: 'Beat Overthinking',
  description:
    'A 5-day program designed to help you break free from the cycle of overthinking. Learn practical techniques to calm your mind, increase focus, and regain control of your thoughts.',
  duration: '5 days',
  totalTime: '75 min',
  difficulty: 'Beginner',
  image: require('../../assets/hyper-focus.png'),
  instructor: 'Dr. Sarah Chen',
  category: 'Focus',
  enrolled: false,
  progress: 0,
  sessions: [
    {
      id: '1',
      day: 1,
      title: 'Understanding Your Thoughts',
      duration: '15 min',
      type: 'Guided Talk',
      locked: false,
      completed: false,
    },
    {
      id: '2',
      day: 2,
      title: 'The Pause Technique',
      duration: '12 min',
      type: 'Practice',
      locked: true,
      completed: false,
    },
    {
      id: '3',
      day: 3,
      title: 'Mindful Observation',
      duration: '18 min',
      type: 'Meditation',
      locked: true,
      completed: false,
    },
    {
      id: '4',
      day: 4,
      title: 'Breaking Thought Loops',
      duration: '15 min',
      type: 'Guided Talk',
      locked: true,
      completed: false,
    },
    {
      id: '5',
      day: 5,
      title: 'Creating Mental Space',
      duration: '15 min',
      type: 'Integration',
      locked: true,
      completed: false,
    },
  ],
  benefits: [
    'Reduce mental clutter',
    'Improve decision-making',
    'Increase mental clarity',
    'Better sleep quality',
  ],
  prerequisites: 'None - suitable for beginners',
};

export const CourseDetailScreen = ({ navigation, route }) => {
  const [isEnrolled, setIsEnrolled] = useState(COURSE_DATA.enrolled);

  const handleEnroll = () => {
    setIsEnrolled(true);
    // TODO: Call API to enroll user
  };

  const handleStartSession = (session) => {
    if (session.locked && !isEnrolled) {
      // Show enrollment prompt
      return;
    }
    // Navigate to appropriate screen based on session type
    navigation.navigate('Focus', {
      screen: 'AudioPlayer',
      params: { sessionId: session.id },
    });
  };

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
          <Image source={COURSE_DATA.image} style={styles.bannerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
            style={styles.bannerGradient}
          />
        </View>

        {/* Course Info */}
        <View style={styles.infoSection}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{COURSE_DATA.category}</Text>
          </View>
          <Text style={styles.courseTitle}>{COURSE_DATA.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{COURSE_DATA.duration}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>{COURSE_DATA.totalTime}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📊</Text>
              <Text style={styles.metaText}>{COURSE_DATA.difficulty}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>About This Course</Text>
          <Text style={styles.description}>{COURSE_DATA.description}</Text>

          {/* Benefits */}
          <Text style={styles.sectionTitle}>What You'll Gain</Text>
          <View style={styles.benefitsList}>
            {COURSE_DATA.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Sessions */}
          <Text style={styles.sectionTitle}>Course Sessions</Text>
          <View style={styles.sessionsList}>
            {COURSE_DATA.sessions.map((session) => (
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
                      <Text style={styles.sessionDayText}>Day {session.day}</Text>
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
            onPress={isEnrolled ? () => handleStartSession(COURSE_DATA.sessions[0]) : handleEnroll}
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
