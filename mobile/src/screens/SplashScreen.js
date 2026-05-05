import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';

const { width, height } = Dimensions.get('window');

export const SplashScreen = ({ onComplete }) => {
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const progressWidth = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Fade in animation
    fadeIn.value = withTiming(1, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    });

    // Slide up animation
    slideUp.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.2)),
    });

    // Progress bar animation
    progressWidth.value = withTiming(100, {
      duration: 2300,
      easing: Easing.inOut(Easing.ease),
    });

    // Glow pulse animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );

    // Navigate to next screen after 2.5 seconds
    const timeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2500);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideUp.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1448', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background stars/particles effect */}
      <Animated.View style={[styles.glowBackground, glowStyle]} />

      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Main brain visualization */}
        <View style={styles.brainContainer}>
          <BrainPulse size={240} pulseSpeed={1600} />
        </View>

        {/* Title and tagline */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Digital <Text style={styles.titleAccent}>Coffee</Text>
          </Text>
          <Text style={styles.tagline}>TAKE CONTROL OF YOUR MIND</Text>
        </View>
      </Animated.View>

      {/* Progress bar at bottom */}
      <Animated.View style={[styles.footer, animatedStyle]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View style={[styles.progressBar, progressStyle]}>
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
        </View>
        <Text style={styles.footerText}>POWERING ON...</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  content: {
    alignItems: 'center',
    marginTop: -80,
  },
  brainContainer: {
    marginBottom: theme.spacing.xl,
  },
  textContainer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 3,
  },
  titleAccent: {
    color: theme.colors.alpha,
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    letterSpacing: 4,
    textTransform: 'uppercase',
    fontWeight: '300',
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
    width: width * 0.7,
  },
  progressContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  progressBarBackground: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
    height: '100%',
  },
  footerText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    letterSpacing: 3,
    fontWeight: '300',
  },
});

export default SplashScreen;
