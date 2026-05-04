import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';

const { width, height } = Dimensions.get('window');

export const SplashScreen = ({ onComplete }) => {
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  useEffect(() => {
    // Fade in animation
    fadeIn.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });

    // Slide up animation
    slideUp.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });

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

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMid,
        theme.colors.gradientEnd,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        <BrainPulse size={220} pulseSpeed={1800} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Digital <Text style={styles.titleAccent}>Coffee</Text>
          </Text>
          <Text style={styles.tagline}>Take control of your mind</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, animatedStyle]}>
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
  content: {
    alignItems: 'center',
    marginTop: -60,
  },
  textContainer: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  titleAccent: {
    color: theme.colors.alpha,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    letterSpacing: 3,
  },
});

export default SplashScreen;
