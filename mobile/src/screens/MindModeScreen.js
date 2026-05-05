import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const MIND_MODES = [
  {
    id: 'hyper-focus',
    icon: '🎯',
    title: 'Hyper-Focus Mode',
    description: 'Short, intense sessions to help you lock into deep work mode.',
    color: theme.colors.beta,
  },
  {
    id: 'calm-down',
    icon: '🌊',
    title: 'Calm-Down Mode',
    description: 'Relaxation and breathing exercises to reset your mental state.',
    color: theme.colors.theta,
  },
  {
    id: 'infinite-inspiration',
    icon: '✨',
    title: 'Infinite-Inspiration Mode',
    description: 'Long-form talks and affirmations to expand your mindset.',
    color: theme.colors.gamma,
  },
];

export const MindModeScreen = ({ navigation, route }) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const moodData = route.params?.moodData;

  const handleContinue = () => {
    if (!selectedMode) return;

    // Navigate to main app with selected mode and mood data
    navigation.replace('Main', {
      moodData,
      selectedMode,
    });
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
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>2/3</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Choose your Mind-Mode</Text>
          <Text style={styles.subtitle}>
            You can choose 1 or 2 modes to focus on
          </Text>

          <View style={styles.modesContainer}>
            {MIND_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && styles.modeCardSelected,
                ]}
                onPress={() => setSelectedMode(mode.id)}
              >
                <View style={styles.modeHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: mode.color + '20' },
                    ]}
                  >
                    <Text style={styles.modeIcon}>{mode.icon}</Text>
                  </View>
                  {selectedMode === mode.id && (
                    <View
                      style={[styles.checkmark, { backgroundColor: mode.color }]}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMode && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedMode}
        >
          <LinearGradient
            colors={[theme.colors.alpha, theme.colors.theta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>Continue</Text>
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
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.xl,
  },
  stepIndicator: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  modesContainer: {
    gap: theme.spacing.md,
  },
  modeCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 24,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeTitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  modeDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  continueText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});

export default MindModeScreen;
