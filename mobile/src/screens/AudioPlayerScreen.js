import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { theme } from '../utils/theme';
import { audioAPI, courseAPI } from '../services/api';

const { width } = Dimensions.get('window');

export const AudioPlayerScreen = ({ navigation, route }) => {
  const { audioId, courseSessionId, courseId } = route.params || {};

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [hasAdvancedProgress, setHasAdvancedProgress] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const particleAnims = useRef(
    Array(8).fill(0).map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      translateY: new Animated.Value(0),
    }))
  ).current;

  const progressIntervalRef = useRef(null);

  useEffect(() => {
    startBrainAnimation();
    loadAudioData();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const loadAudioData = async () => {
    if (!audioId) {
      console.error('No audioId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch audio metadata
      const response = await audioAPI.getAudio(audioId);
      if (response.success && response.data) {
        const audio = response.data;
        setAudioData(audio);
        setDuration(audio.duration_seconds);

        // Start listening session with course session ID if available
        const sessionResponse = await audioAPI.startSession(audioId, courseSessionId);
        if (sessionResponse.success) {
          setSessionId(sessionResponse.data.id);
        }
      } else {
        console.error('Audio data not found in response');
        // Set audioData to null to trigger "Audio not found" message
        setAudioData(null);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      // Check if it's an authentication error
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Already handled by API interceptor
      }
      // Set audioData to null to trigger "Audio not found" message
      setAudioData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startParticleAnimation();
    }
  }, [isPlaying]);

  const startBrainAnimation = () => {
    // Slow pulsing scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow opacity animation for glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1500,
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
    if (!audioData) {
      console.error('No audio data available');
      return;
    }

    try {
      if (isPlaying) {
        // Pause
        if (sound) {
          await sound.pauseAsync();
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        setIsPlaying(false);
      } else {
        // Play
        if (sound) {
          await sound.playAsync();
          startProgressTracking();
        } else {
          // Load and play audio from URL
          console.log('Loading audio from:', audioData.audio_url);

          // Configure audio mode
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
          });

          // Load audio
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioData.audio_url },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          );

          setSound(newSound);
          startProgressTracking();
        }
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Error playing audio. The audio file may not be available.');
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = async (status) => {
    if (status.isLoaded) {
      const currentSeconds = Math.floor(status.positionMillis / 1000);
      const totalSeconds = Math.floor(status.durationMillis / 1000);

      setCurrentTime(currentSeconds);
      setDuration(totalSeconds);

      // Check if user has listened to at least 80% of the audio
      const completionPercentage = (currentSeconds / totalSeconds) * 100;
      if (completionPercentage >= 80 && !hasAdvancedProgress && courseSessionId && courseId) {
        setHasAdvancedProgress(true);
        await advanceCourseProgress();
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        if (sessionId) {
          await audioAPI.completeSession(sessionId, totalSeconds);
        }

        // Navigate back to course detail after completion
        if (courseId) {
          setTimeout(() => {
            navigation.navigate('Library', {
              screen: 'CourseDetail',
              params: { courseId }
            });
          }, 1500);
        }
      }
    }
  };

  const advanceCourseProgress = async () => {
    try {
      // Get current course details to find enrollment and current day
      const courseResponse = await courseAPI.getCourse(courseId);
      if (courseResponse.success) {
        const currentDay = courseResponse.data.current_day || 1;

        // Get all sessions for the course
        const allSessions = courseResponse.data.sessions || [];

        // Check if all sessions for current day are completed (or will be after this one)
        const currentDaySessions = allSessions.filter(s => s.day_number === currentDay);
        const completedCurrentDay = currentDaySessions.every(s =>
          s.id === courseSessionId || s.completed
        );

        // If all sessions for current day are done, advance to next day
        if (completedCurrentDay && currentDay < courseResponse.data.duration_days) {
          const enrolledResponse = await courseAPI.getEnrolled();
          if (enrolledResponse.success) {
            const enrollment = enrolledResponse.data.find(e => e.id === courseId);
            if (enrollment) {
              await courseAPI.updateProgress(enrollment.enrollment_id, currentDay + 1);
              console.log(`Advanced to day ${currentDay + 1}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error advancing course progress:', error);
    }
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(async () => {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const currentSeconds = Math.floor(status.positionMillis / 1000);
          setCurrentTime(currentSeconds);

          // Update progress every 10 seconds
          if (sessionId && currentSeconds % 10 === 0) {
            audioAPI.updateProgress(sessionId, currentSeconds);
          }
        }
      }
    }, 1000);
  };

  const handleSkipBackward = async () => {
    if (sound) {
      const newPosition = Math.max(0, currentTime - 15) * 1000;
      await sound.setPositionAsync(newPosition);
      setCurrentTime(Math.floor(newPosition / 1000));
    }
  };

  const handleSkipForward = async () => {
    if (sound) {
      const newPosition = Math.min(duration, currentTime + 15) * 1000;
      await sound.setPositionAsync(newPosition);
      setCurrentTime(Math.floor(newPosition / 1000));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#000819', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.alpha} />
        <Text style={[styles.loadingText, { marginTop: theme.spacing.md }]}>Loading audio...</Text>
      </View>
    );
  }

  if (!audioData) {
    return (
      <View style={[styles.container, { backgroundColor: '#000819', justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl }]}>
        <Text style={styles.headerTitle}>Audio not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: theme.spacing.lg }}>
          <Text style={[styles.headerSubtitle, { color: theme.colors.alpha }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const audioType = audioData.type === 'guided-talk' ? 'Guided Talk' :
                   audioData.type === 'binaural' ? 'Binaural Beats' :
                   audioData.type === 'affirmation' ? 'Affirmation' :
                   audioData.type === 'breathing' ? 'Breathing' : 'Meditation';

  const subtitle = `${audioType} • ${formatDuration(audioData.duration_seconds)}`;

  return (
    <View style={[styles.container, { backgroundColor: '#000819' }]}>
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
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
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
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {/* Brain image only */}
          <Animated.Image
            source={require('../../assets/brain.png')}
            style={[
              styles.brainImage,
              {
                opacity: opacityAnim.interpolate({
                  inputRange: [0.85, 1],
                  outputRange: [0.765, 0.90], // 0.85*0.9 to 1.0*0.9
                }),
              },
            ]}
            resizeMode="contain"
          />

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
          style={styles.skipButton}
          onPress={handleSkipBackward}
          activeOpacity={0.7}
        >
          <View style={styles.skipContainer}>
            <View style={styles.skipIconContainer}>
              <Text style={styles.skipArrowIcon}>«</Text>
            </View>
            <Text style={styles.skipTime}>15s</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playPauseGradientBorder}
          >
            <View style={styles.playPauseInner}>
              <Text style={styles.playPauseIcon}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipForward}
          activeOpacity={0.7}
        >
          <View style={styles.skipContainer}>
            <View style={styles.skipIconContainer}>
              <Text style={styles.skipArrowIcon}>»</Text>
            </View>
            <Text style={styles.skipTime}>15s</Text>
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
          <Text style={styles.actionIcon}>⋮⋮</Text>
          <Text style={styles.actionLabel}>More</Text>
        </TouchableOpacity>
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
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  brainImage: {
    width: 280,
    height: 280,
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
  skipButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    gap: 4,
  },
  skipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  skipArrowIcon: {
    fontSize: 22,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  skipTime: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  playPauseButton: {
    width: 80,
    height: 80,
  },
  playPauseGradientBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    padding: 2,
  },
  playPauseInner: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 8, 25, 0.6)',
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default AudioPlayerScreen;
