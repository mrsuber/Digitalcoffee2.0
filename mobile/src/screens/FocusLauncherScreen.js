import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { audioAPI } from '../services/api';

const SESSION_TYPES = [
  {
    id: 'audio',
    icon: '🎧',
    title: 'Audio Session',
    description: 'Guided talks, binaural beats & affirmations',
    gradient: ['#4c1d95', '#7c3aed'],
    screen: 'Library',
    params: { screen: 'AudioLibrary' },
  },
  {
    id: 'timer',
    icon: '⏱️',
    title: 'Focus Timer',
    description: 'Deep work sessions with countdown timer',
    gradient: ['#0d9488', '#14b8a6'],
    screen: 'FocusTimer',
  },
  {
    id: 'breathing',
    icon: '🫁',
    title: 'Breathing Guide',
    description: 'Box breathing and relaxation exercises',
    gradient: ['#3b82f6', '#60a5fa'],
    screen: 'BreathingGuide',
  },
];

export const FocusLauncherScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      setLoadingRecent(true);
      const response = await audioAPI.getRecentSessions();
      if (response.success) {
        // Transform the data to match the expected format
        const transformedSessions = response.data.map(session => ({
          id: session.id.toString(), // Use listening session ID (unique per session)
          audioContentId: session.audio_content_id.toString(), // Store audio content ID for navigation
          title: session.title,
          type: getTypeLabel(session.type, session.brainwave_type),
          duration: formatDuration(session.total_duration),
          progress: parseFloat(session.progress) || 0,
        }));
        setRecentSessions(transformedSessions);
      }
    } catch (error) {
      console.error('Error loading recent sessions:', error);
      // Silent fail - just show empty recent sessions
    } finally {
      setLoadingRecent(false);
    }
  };

  const getTypeLabel = (type, brainwaveType) => {
    if (type === 'binaural' && brainwaveType) {
      return `${brainwaveType.charAt(0).toUpperCase() + brainwaveType.slice(1)} Waves`;
    }
    const typeMap = {
      meditation: 'Guided Meditation',
      affirmation: 'Affirmations',
      binaural: 'Binaural Beats',
      music: 'Focus Music',
    };
    return typeMap[type] || type;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  };

  const handleSessionTypePress = (sessionType) => {
    setSelectedType(sessionType.id);
    // Navigate to the specific screen after a short delay for visual feedback
    setTimeout(() => {
      if (sessionType.params) {
        navigation.navigate(sessionType.screen, sessionType.params);
      } else {
        navigation.navigate(sessionType.screen);
      }
      setSelectedType(null);
    }, 200);
  };

  const handleRecentSessionPress = (session) => {
    // Navigate to appropriate screen based on session type
    if (session.type === 'Focus Timer') {
      navigation.navigate('FocusTimer', { preset: session });
    } else {
      navigation.navigate('AudioPlayer', { audioId: session.audioContentId });
    }
  };

  const handleQuickAudioStart = async (type, brainwaveType = null) => {
    try {
      // Fetch audio content based on type
      const response = await audioAPI.getAudioContent(type, brainwaveType);

      if (response.success && response.data && response.data.length > 0) {
        // Get the first audio of this type
        const audio = response.data[0];
        navigation.navigate('AudioPlayer', { audioId: audio.id });
      } else {
        Alert.alert('No Audio Found', `No ${type} audio available. Please check the audio library.`);
      }
    } catch (error) {
      console.error('Error loading audio:', error);

      // Check if it's an authentication error
      if (error.response?.status === 403 || error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log out and log back in to continue.',
          [
            {
              text: 'Go to Profile',
              onPress: () => navigation.navigate('Profile')
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load audio. Please try again.');
      }
    }
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Start Your Practice</Text>
          <Text style={styles.headerSubtitle}>
            Choose how you want to focus today
          </Text>
        </View>

        {/* Session Type Cards */}
        <View style={styles.sessionTypesContainer}>
          {SESSION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.sessionTypeCard,
                selectedType === type.id && styles.sessionTypeCardSelected,
              ]}
              onPress={() => handleSessionTypePress(type)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={type.gradient}
                style={styles.sessionTypeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.sessionTypeIcon}>{type.icon}</Text>
              </LinearGradient>
              <View style={styles.sessionTypeContent}>
                <Text style={styles.sessionTypeTitle}>{type.title}</Text>
                <Text style={styles.sessionTypeDescription}>
                  {type.description}
                </Text>
              </View>
              <Text style={styles.sessionTypeArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Sessions */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <View style={styles.recentSessionsContainer}>
            {loadingRecent ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.alpha} size="small" />
                <Text style={styles.loadingText}>Loading recent sessions...</Text>
              </View>
            ) : recentSessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🎧</Text>
                <Text style={styles.emptyText}>No recent sessions yet</Text>
                <Text style={styles.emptySubtext}>Start a session to see it here</Text>
              </View>
            ) : (
              recentSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.recentSessionCard}
                  onPress={() => handleRecentSessionPress(session)}
                  activeOpacity={0.8}
                >
                  <View style={styles.recentSessionInfo}>
                    <Text style={styles.recentSessionTitle}>{session.title}</Text>
                    <View style={styles.recentSessionMeta}>
                      <Text style={styles.recentSessionType}>{session.type}</Text>
                      <Text style={styles.recentSessionDot}>•</Text>
                      <Text style={styles.recentSessionDuration}>
                        {session.duration}
                      </Text>
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${session.progress * 100}%` },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('FocusTimer', { preset: 'pomodoro' })}
            >
              <Text style={styles.quickActionIcon}>🍅</Text>
              <Text style={styles.quickActionText}>25 min{'\n'}Pomodoro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('BreathingGuide', { pattern: 'box' })}
            >
              <Text style={styles.quickActionIcon}>🧘</Text>
              <Text style={styles.quickActionText}>Box{'\n'}Breathing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAudioStart('binaural', 'alpha')}
            >
              <Text style={styles.quickActionIcon}>🧠</Text>
              <Text style={styles.quickActionText}>Alpha{'\n'}Waves</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => handleQuickAudioStart('meditation')}
            >
              <Text style={styles.quickActionIcon}>🎵</Text>
              <Text style={styles.quickActionText}>Guided{'\n'}Meditation</Text>
            </TouchableOpacity>
          </View>
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  sessionTypesContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sessionTypeCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sessionTypeCardSelected: {
    borderColor: theme.colors.alpha,
    transform: [{ scale: 0.98 }],
  },
  sessionTypeGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sessionTypeIcon: {
    fontSize: 28,
  },
  sessionTypeContent: {
    flex: 1,
  },
  sessionTypeTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  sessionTypeDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  sessionTypeArrow: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  recentSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  recentSessionsContainer: {
    gap: theme.spacing.sm,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },
  recentSessionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recentSessionInfo: {
    marginBottom: theme.spacing.sm,
  },
  recentSessionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  recentSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSessionType: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  recentSessionDot: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  recentSessionDuration: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 2,
  },
  quickActionsSection: {
    marginBottom: theme.spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    aspectRatio: 1.2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActionIcon: {
    fontSize: 36,
    marginBottom: theme.spacing.xs,
  },
  quickActionText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default FocusLauncherScreen;
