import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const BREATHING_PATTERNS = {
  box: {
    name: 'Box Breathing',
    subtitle: '4-4-4-4',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold', duration: 4 },
    ],
    totalRounds: 8,
  },
  calm: {
    name: '4-7-8 Breathing',
    subtitle: 'Calm Down',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Exhale', duration: 8 },
    ],
    totalRounds: 6,
  },
  energize: {
    name: 'Energizing Breath',
    subtitle: '3-0-3',
    phases: [
      { name: 'Inhale', duration: 3 },
      { name: 'Exhale', duration: 3 },
    ],
    totalRounds: 10,
  },
};

export const BreathingGuideScreen = ({ navigation, route }) => {
  const patternKey = route.params?.pattern || 'box';
  const pattern = BREATHING_PATTERNS[patternKey];

  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  const currentPhase = pattern.phases[currentPhaseIndex];
  const progress = secondsInPhase / currentPhase.duration;

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsInPhase((prev) => {
          if (prev >= currentPhase.duration - 1) {
            // Move to next phase
            const nextPhaseIndex = (currentPhaseIndex + 1) % pattern.phases.length;
            setCurrentPhaseIndex(nextPhaseIndex);

            // If completing a full cycle, increment round
            if (nextPhaseIndex === 0) {
              setCurrentRound((prevRound) => {
                if (prevRound >= pattern.totalRounds) {
                  handleComplete();
                  return prevRound;
                }
                return prevRound + 1;
              });
            }
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentPhaseIndex, currentPhase]);

  useEffect(() => {
    if (isActive) {
      animateBreathing();
    }
  }, [isActive, currentPhase, secondsInPhase]);

  const animateBreathing = () => {
    const phaseName = currentPhase.name.toLowerCase();

    if (phaseName === 'inhale') {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: currentPhase.duration * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: currentPhase.duration * 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (phaseName === 'exhale') {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: currentPhase.duration * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: currentPhase.duration * 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // Hold phases keep the current state
  };

  const handleComplete = () => {
    setIsActive(false);
    // TODO: Show completion celebration
    // TODO: Save session to backend
    console.log('Breathing session completed!');
  };

  const handleStartStop = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentRound(1);
    setCurrentPhaseIndex(0);
    setSecondsInPhase(0);
    scaleAnim.setValue(0.5);
    opacityAnim.setValue(0.3);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#020a1e' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.sessionType}>{pattern.name}</Text>
          <Text style={styles.sessionSubtype}>{pattern.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Breathing Animation */}
      <View style={styles.breathingContainer}>
        <Animated.View
          style={[
            styles.breathingSquareWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Outer glow effect */}
          <Animated.View style={[styles.glowEffect, { opacity: opacityAnim }]}>
            <LinearGradient
              colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Animated border gradient */}
          <Animated.View style={[styles.borderGradient, { opacity: opacityAnim }]}>
            <LinearGradient
              colors={['#7c3aed', '#0d9488', '#14b8a6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.breathingSquare}>
                {/* Phase instruction */}
                <Text style={styles.phaseText}>{currentPhase.name}</Text>
                <Text style={styles.durationText}>
                  {currentPhase.duration - secondsInPhase} sec
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Round Counter */}
      <View style={styles.roundContainer}>
        <Text style={styles.roundText}>
          Round {currentRound} of {pattern.totalRounds}
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(currentRound / pattern.totalRounds) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleStartStop}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.controlButtonGradient}
          >
            <View style={styles.controlButtonInner}>
              <Text style={styles.controlButtonText}>
                {isActive ? 'Pause' : 'Start'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {(isActive || currentRound > 1) && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pattern Info */}
      <View style={styles.patternInfo}>
        <Text style={styles.patternInfoTitle}>Breathing Pattern</Text>
        <View style={styles.phasesContainer}>
          {pattern.phases.map((phase, index) => (
            <View
              key={index}
              style={[
                styles.phaseChip,
                currentPhaseIndex === index && isActive && styles.phaseChipActive,
              ]}
            >
              <Text
                style={[
                  styles.phaseChipText,
                  currentPhaseIndex === index && isActive && styles.phaseChipTextActive,
                ]}
              >
                {phase.name}: {phase.duration}s
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
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
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  breathingSquareWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 40,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    opacity: 0.3,
  },
  borderGradient: {
    width: '100%',
    height: '100%',
  },
  gradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    padding: 3,
  },
  breathingSquare: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    backgroundColor: 'rgba(2, 10, 30, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  phaseText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: 2,
  },
  durationText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    fontWeight: '300',
  },
  roundContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  roundText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 3,
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  controlButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  controlButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  controlButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
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
  patternInfo: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: theme.spacing.lg,
  },
  patternInfoTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  phasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  phaseChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  phaseChipActive: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderColor: theme.colors.alpha,
  },
  phaseChipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  phaseChipTextActive: {
    color: theme.colors.alpha,
    fontWeight: '600',
  },
});

export default BreathingGuideScreen;
