import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(20);

  useEffect(() => {
    fadeIn.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    slideUp.value = withTiming(0, {
      duration: 700,
      easing: Easing.out(Easing.back(1.1)),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1448', '#0f172a']}
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
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <View style={styles.notificationDot} />
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Central brain pulse */}
        <Animated.View style={[styles.brainContainer, animatedStyle]}>
          <BrainPulse size={220} pulseSpeed={1600} />
        </Animated.View>

        {/* Quick mood check */}
        <Animated.View style={[styles.moodSection, animatedStyle]}>
          <Text style={styles.sectionTitle}>HOW DO YOU FEEL?</Text>
          <View style={styles.moodButtons}>
            <TouchableOpacity style={styles.moodButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['rgba(13, 148, 136, 0.2)', 'rgba(13, 148, 136, 0.05)']}
                style={styles.moodButtonInner}
              >
                <Text style={styles.moodEmoji}>😌</Text>
                <Text style={styles.moodLabel}>Clear</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                style={styles.moodButtonInner}
              >
                <Text style={styles.moodEmoji}>😤</Text>
                <Text style={styles.moodLabel}>Tired</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodButton} activeOpacity={0.7}>
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                style={styles.moodButtonInner}
              >
                <Text style={styles.moodEmoji}>😨</Text>
                <Text style={styles.moodLabel}>Anxious</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Today's Focus Card */}
        <Animated.View style={[styles.sessionCard, animatedStyle]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>TODAY'S FOCUS SESSION</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>DAY 1</Text>
            </View>
          </View>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionTitle}>Rewire Your Focus</Text>
            <Text style={styles.sessionDetails}>
              15 min guided talk + 5 min focus-sprint
            </Text>
          </View>
          <TouchableOpacity style={styles.playButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.colors.alpha, theme.colors.theta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playGradient}
            >
              <Text style={styles.playIcon}>▶</Text>
              <Text style={styles.playText}>START SESSION</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Brainwave Status Card */}
        <Animated.View style={[styles.brainwaveCard, animatedStyle]}>
          <Text style={styles.cardTitle}>CURRENT BRAINWAVE</Text>
          <View style={styles.brainwaveInfo}>
            <View>
              <Text style={styles.brainwaveType}>Alpha State</Text>
              <Text style={styles.brainwaveFreq}>8.6 Hz</Text>
              <Text style={styles.brainwaveDesc}>Relaxed & Alert</Text>
            </View>
            <View style={styles.waveformContainer}>
              <View style={styles.waveform}>
                {[...Array(15)].map((_, i) => {
                  const height = Math.sin(i * 0.6) * 15 + 25;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: height,
                          backgroundColor: theme.colors.alpha,
                          opacity: 0.8,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  brainwaveCard: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  brainwaveInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brainwaveType: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  brainwaveFreq: {
    fontSize: theme.fonts.sizes.xxxl,
    color: theme.colors.alpha,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  brainwaveDesc: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  waveformContainer: {
    flex: 1,
    maxWidth: 120,
    marginLeft: theme.spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default DashboardScreen;
