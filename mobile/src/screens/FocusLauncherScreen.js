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

const SESSION_TYPES = [
  {
    id: 'audio',
    icon: '🎧',
    title: 'Audio Session',
    description: 'Guided talks, binaural beats & affirmations',
    gradient: ['#4c1d95', '#7c3aed'],
    screen: 'AudioPlayer',
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

const RECENT_SESSIONS = [
  {
    id: '1',
    title: 'Rewire Your Focus',
    type: 'Guided Talk',
    duration: '15 min',
    progress: 0.7,
  },
  {
    id: '2',
    title: 'Deep Work Session',
    type: 'Focus Timer',
    duration: '25 min',
    progress: 1.0,
  },
  {
    id: '3',
    title: 'Alpha Waves - 8.6 Hz',
    type: 'Binaural Beats',
    duration: '20 min',
    progress: 0.4,
  },
];

export const FocusLauncherScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);

  const handleSessionTypePress = (sessionType) => {
    setSelectedType(sessionType.id);
    // Navigate to the specific screen after a short delay for visual feedback
    setTimeout(() => {
      navigation.navigate(sessionType.screen);
      setSelectedType(null);
    }, 200);
  };

  const handleRecentSessionPress = (session) => {
    // Navigate to appropriate screen based on session type
    if (session.type === 'Focus Timer') {
      navigation.navigate('FocusTimer', { preset: session });
    } else {
      navigation.navigate('AudioPlayer', { audioId: session.id });
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
            {RECENT_SESSIONS.map((session) => (
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
            ))}
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
              onPress={() => navigation.navigate('AudioPlayer', { filter: 'alpha' })}
            >
              <Text style={styles.quickActionIcon}>🧠</Text>
              <Text style={styles.quickActionText}>Alpha{'\n'}Waves</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AudioPlayer', { filter: 'meditation' })}
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
