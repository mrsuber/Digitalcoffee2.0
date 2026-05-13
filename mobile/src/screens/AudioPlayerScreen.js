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
import { Audio } from 'expo-av';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

export const AudioPlayerScreen = ({ navigation, route }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(900); // 15 min default
  const [sound, setSound] = useState(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(
    Array(8).fill(0).map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  // Sample audio data - replace with actual data from route params or API
  const audioData = {
    title: 'Rewire Your Focus',
    subtitle: 'Guided Talk • 15 min',
    frequency: '8.6 Hz',
    waveType: 'Alpha',
  };

  useEffect(() => {
    startBrainAnimation();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startPulseAnimation();
      startParticleAnimation();
    }
  }, [isPlaying]);

  const startBrainAnimation = () => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startParticleAnimation = () => {
    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: -100,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      // Pause
      if (sound) {
        await sound.pauseAsync();
      }
      setIsPlaying(false);
    } else {
      // Play
      if (sound) {
        await sound.playAsync();
      } else {
        // Load and play audio (placeholder - add actual audio file)
        // const { sound: newSound } = await Audio.Sound.createAsync(
        //   require('../../assets/audio/sample.mp3')
        // );
        // setSound(newSound);
        // await newSound.playAsync();
      }
      setIsPlaying(true);
    }
  };

  const handleSkipBackward = () => {
    if (currentTime >= 10) {
      setCurrentTime(currentTime - 10);
    } else {
      setCurrentTime(0);
    }
  };

  const handleSkipForward = () => {
    if (currentTime + 10 <= duration) {
      setCurrentTime(currentTime + 10);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#0a0e27', '#1a1f3a', '#2a1f3a']}
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{audioData.title}</Text>
          <Text style={styles.headerSubtitle}>{audioData.subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Brain Visualization */}
      <View style={styles.visualizationContainer}>
        <Animated.View
          style={[
            styles.brainContainer,
            {
              transform: [{ scale: pulseAnim }, { rotate }],
            },
          ]}
        >
          {/* Outer glow rings */}
          <View style={[styles.glowRing, styles.glowRingOuter]} />
          <View style={[styles.glowRing, styles.glowRingMiddle]} />

          {/* Brain circle */}
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#0d9488']}
            style={styles.brainCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.brainEmoji}>🧠</Text>
          </LinearGradient>

          {/* Particles */}
          {particleAnims.map((anim, index) => {
            const angle = (index / particleAnims.length) * Math.PI * 2;
            const x = Math.cos(angle) * 120;
            const y = Math.sin(angle) * 120;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    left: width / 2 + x - 4,
                    top: '50%',
                    opacity: anim.opacity,
                    transform: [
                      { scale: anim.scale },
                      { translateY: anim.translateY },
                    ],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentTime / duration) * 100}%` },
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              { left: `${(currentTime / duration) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipBackward}
        >
          <View style={styles.skipButton}>
            <Text style={styles.skipIcon}>⏪</Text>
            <Text style={styles.skipText}>10</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={handlePlayPause}
        >
          <LinearGradient
            colors={['#7c3aed', '#0d9488']}
            style={styles.playPauseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.playPauseIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipForward}
        >
          <View style={styles.skipButton}>
            <Text style={styles.skipIcon}>⏩</Text>
            <Text style={styles.skipText}>10</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🔊</Text>
          <Text style={styles.actionLabel}>Sounds</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>✨</Text>
          <Text style={styles.actionLabel}>Affirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⏱️</Text>
          <Text style={styles.actionLabel}>Timer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⋯</Text>
          <Text style={styles.actionLabel}>More</Text>
        </TouchableOpacity>
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
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
  visualizationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  brainContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  glowRingOuter: {
    width: 240,
    height: 240,
  },
  glowRingMiddle: {
    width: 200,
    height: 200,
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  brainCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  brainEmoji: {
    fontSize: 80,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  progressSection: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.alpha,
    marginLeft: -8,
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipIcon: {
    fontSize: 28,
    color: theme.colors.text,
  },
  skipText: {
    position: 'absolute',
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: 'bold',
    top: '50%',
    marginTop: -5,
  },
  playPauseButton: {
    width: 80,
    height: 80,
  },
  playPauseGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  playPauseIcon: {
    fontSize: 32,
    color: theme.colors.text,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs / 2,
  },
  actionLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
});

export default AudioPlayerScreen;
