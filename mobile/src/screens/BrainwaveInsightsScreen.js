import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const BRAINWAVE_DATA = [
  {
    id: 'alpha',
    name: 'Alpha State',
    frequency: '8-12 Hz',
    currentFrequency: '8.6 Hz',
    color: '#0d9488',
    gradient: ['#0d9488', '#14b8a6'],
    icon: '🧘',
    description: 'Ideal for relaxation & focus',
    benefits: [
      'Reduced stress and anxiety',
      'Enhanced creativity',
      'Improved focus and concentration',
      'Better learning and memory',
    ],
    bestFor: ['Meditation', 'Light focus work', 'Creative tasks', 'Relaxation'],
    bestTime: '9:00 AM',
    avgDuration: '34 min',
    focusPercentage: 78,
    sessionsCount: 12,
  },
  {
    id: 'beta',
    name: 'Beta State',
    frequency: '12-30 Hz',
    currentFrequency: '18 Hz',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#60a5fa'],
    icon: '🎯',
    description: 'Active thinking & problem solving',
    benefits: [
      'Increased alertness',
      'Better decision-making',
      'Enhanced problem-solving',
      'Active engagement',
    ],
    bestFor: ['Deep work', 'Analysis', 'Planning', 'Active learning'],
    bestTime: '10:30 AM',
    avgDuration: '25 min',
    focusPercentage: 85,
    sessionsCount: 8,
  },
  {
    id: 'theta',
    name: 'Theta State',
    frequency: '4-8 Hz',
    currentFrequency: '6 Hz',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#a78bfa'],
    icon: '🌙',
    description: 'Deep meditation & creativity',
    benefits: [
      'Enhanced creativity',
      'Deep relaxation',
      'Emotional healing',
      'Vivid visualization',
    ],
    bestFor: ['Deep meditation', 'Visualization', 'Intuition', 'Creativity'],
    bestTime: '8:00 PM',
    avgDuration: '20 min',
    focusPercentage: 65,
    sessionsCount: 5,
  },
  {
    id: 'delta',
    name: 'Delta State',
    frequency: '0.5-4 Hz',
    currentFrequency: '2 Hz',
    color: '#6366f1',
    gradient: ['#6366f1', '#818cf8'],
    icon: '😴',
    description: 'Deep sleep & healing',
    benefits: [
      'Deepest relaxation',
      'Physical healing',
      'Immune system boost',
      'Restoration',
    ],
    bestFor: ['Sleep preparation', 'Recovery', 'Healing', 'Deep rest'],
    bestTime: '10:00 PM',
    avgDuration: '45 min',
    focusPercentage: 45,
    sessionsCount: 3,
  },
  {
    id: 'gamma',
    name: 'Gamma State',
    frequency: '30+ Hz',
    currentFrequency: '40 Hz',
    color: '#ec4899',
    gradient: ['#ec4899', '#f472b6'],
    icon: '⚡',
    description: 'Peak awareness & cognition',
    benefits: [
      'Peak mental performance',
      'Heightened perception',
      'Enhanced learning',
      'Information processing',
    ],
    bestFor: ['Complex tasks', 'Peak performance', 'Learning', 'Integration'],
    bestTime: '11:00 AM',
    avgDuration: '15 min',
    focusPercentage: 92,
    sessionsCount: 2,
  },
];

export const BrainwaveInsightsScreen = ({ navigation }) => {
  const [selectedBrainwave, setSelectedBrainwave] = useState(BRAINWAVE_DATA[0]);

  const renderWaveAnimation = () => {
    return (
      <View style={styles.waveContainer}>
        <View style={styles.waveVisualization}>
          {/* Simplified wave representation */}
          {[...Array(20)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.waveLine,
                {
                  height: Math.sin(index * 0.5) * 30 + 40,
                  backgroundColor: selectedBrainwave.color,
                  opacity: 0.3 + (index % 5) * 0.15,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Brainwave Insights</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current State Card */}
        <LinearGradient
          colors={selectedBrainwave.gradient}
          style={styles.currentStateCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.currentStateLabel}>Today, 9:41 AM</Text>
          <View style={styles.currentStateContent}>
            <Text style={styles.currentStateIcon}>{selectedBrainwave.icon}</Text>
            <View>
              <Text style={styles.currentStateName}>{selectedBrainwave.name}</Text>
              <Text style={styles.currentStateFrequency}>
                {selectedBrainwave.currentFrequency}
              </Text>
            </View>
          </View>
          <Text style={styles.currentStateDescription}>
            {selectedBrainwave.description}
          </Text>

          {/* Wave Animation */}
          {renderWaveAnimation()}
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best Time</Text>
            <Text style={styles.statValue}>{selectedBrainwave.bestTime}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{selectedBrainwave.avgDuration}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Focus State</Text>
            <Text style={styles.statValue}>
              {selectedBrainwave.focusPercentage}%
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{selectedBrainwave.sessionsCount}</Text>
          </View>
        </View>

        {/* Brainwave Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Brainwave States</Text>
          <View style={styles.brainwaveList}>
            {BRAINWAVE_DATA.map((wave) => (
              <TouchableOpacity
                key={wave.id}
                style={[
                  styles.brainwaveCard,
                  selectedBrainwave.id === wave.id && styles.brainwaveCardSelected,
                  selectedBrainwave.id === wave.id && {
                    borderColor: wave.color,
                  },
                ]}
                onPress={() => setSelectedBrainwave(wave)}
                activeOpacity={0.8}
              >
                <View style={styles.brainwaveLeft}>
                  <View
                    style={[
                      styles.brainwaveIcon,
                      { backgroundColor: wave.color + '30' },
                    ]}
                  >
                    <Text style={styles.brainwaveEmoji}>{wave.icon}</Text>
                  </View>
                  <View>
                    <Text style={styles.brainwaveName}>{wave.name}</Text>
                    <Text style={styles.brainwaveFrequency}>{wave.frequency}</Text>
                  </View>
                </View>
                {selectedBrainwave.id === wave.id && (
                  <Text style={styles.brainwaveCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <View style={styles.benefitsList}>
            {selectedBrainwave.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Best For */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Best For</Text>
          <View style={styles.tagsContainer}>
            {selectedBrainwave.bestFor.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Learn More */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learn More</Text>
          <Text style={styles.learnMoreText}>
            Brain waves are electrical impulses in the brain. Different
            frequencies correspond to different states of consciousness and
            mental activity. By understanding and training your brainwave
            patterns, you can optimize your mental performance and well-being.
          </Text>
          <Text style={styles.learnMoreText}>
            Digital Coffee uses specially designed audio frequencies to help
            guide your brain into desired states, making it easier to achieve
            deep focus, relaxation, or creativity on demand.
          </Text>
        </View>

        {/* Try Audio Button */}
        <TouchableOpacity
          style={styles.tryButton}
          onPress={() =>
            navigation.navigate('Focus', {
              screen: 'AudioPlayer',
              params: { brainwave: selectedBrainwave.id },
            })
          }
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tryButtonGradient}
          >
            <View style={styles.tryButtonInner}>
              <Text style={styles.tryButtonText}>
                Try {selectedBrainwave.name} Audio
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
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
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  currentStateCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  currentStateLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  currentStateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  currentStateIcon: {
    fontSize: 48,
  },
  currentStateName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  currentStateFrequency: {
    fontSize: theme.fonts.sizes.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  currentStateDescription: {
    fontSize: theme.fonts.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.md,
  },
  waveContainer: {
    marginTop: theme.spacing.md,
  },
  waveVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
  },
  waveLine: {
    width: 4,
    borderRadius: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  brainwaveList: {
    gap: theme.spacing.sm,
  },
  brainwaveCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brainwaveCardSelected: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  brainwaveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brainwaveIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainwaveEmoji: {
    fontSize: 24,
  },
  brainwaveName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  brainwaveFrequency: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  brainwaveCheck: {
    fontSize: 20,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  benefitsList: {
    gap: theme.spacing.sm,
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
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.alpha,
  },
  tagText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  learnMoreText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  tryButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  tryButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  tryButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default BrainwaveInsightsScreen;
