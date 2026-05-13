import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const TIMER_PRESETS = {
  pomodoro: { duration: 25 * 60, name: 'Pomodoro', type: 'Work' },
  shortBreak: { duration: 5 * 60, name: 'Short Break', type: 'Break' },
  longBreak: { duration: 15 * 60, name: 'Long Break', type: 'Break' },
  deepWork: { duration: 52 * 60, name: 'Deep Work', type: 'Focus' },
  custom: { duration: 30 * 60, name: 'Custom', type: 'Focus' },
};

export const FocusTimerScreen = ({ navigation, route }) => {
  const preset = route.params?.preset || 'deepWork';
  const initialDuration = TIMER_PRESETS[preset]?.duration || 25 * 60;

  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      startPulseAnimation();
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    // TODO: Show completion modal/celebration
    // TODO: Save session to backend
    console.log('Timer completed!');
  };

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(true);
    } else {
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(initialDuration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeRemaining / initialDuration);

  return (
    <LinearGradient
      colors={['#1a0f2e', '#2d1b3d', '#1a0f2e']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.sessionType}>
            {TIMER_PRESETS[preset]?.name || 'Deep Work'}
          </Text>
          <Text style={styles.sessionSubtype}>Focus Session</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Animated.View
          style={[
            styles.timerCircle,
            {
              transform: [{ scale: isRunning ? pulseAnim : 1 }],
            },
          ]}
        >
          {/* Progress Ring */}
          <View style={styles.progressRingContainer}>
            <View style={styles.progressRingBackground} />
            <Animated.View
              style={[
                styles.progressRing,
                {
                  transform: [
                    { rotate: `${progress * 360}deg` },
                  ],
                },
              ]}
            />
          </View>

          {/* Time Text */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.motivationText}>
              {isRunning
                ? 'Stay focused.\nGreat things are built\nin silence.'
                : isPaused
                ? 'Take a breath.\nYou\'re doing great.'
                : 'Ready to focus?'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={handleStartPause}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pauseButtonGradient}
          >
            <View style={styles.pauseButtonInner}>
              <Text style={styles.pauseButtonText}>
                {isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {(isRunning || isPaused) && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.floor((initialDuration - timeRemaining) / 60)}
          </Text>
          <Text style={styles.statLabel}>Minutes Focused</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(progress * 100)}%
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Session Today</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  sessionType: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sessionSubtype: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  timerCircle: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  progressRingBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.375,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.375,
    borderWidth: 8,
    borderColor: '#0d9488',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  motivationText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.xl,
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  pauseButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  pauseButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  pauseButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resetButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  resetButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default FocusTimerScreen;
