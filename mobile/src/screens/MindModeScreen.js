import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const MIND_MODES = [
  {
    id: 'hyper-focus',
    image: require('../../assets/hyper-focus.png'),
    title: 'Hyper-Focus Mode',
    description: 'Short, intense sessions to lock in.',
    backgroundColor: '#141c42',
  },
  {
    id: 'calm-down',
    image: require('../../assets/calm.png'),
    title: 'Calm-Down Mode',
    description: 'Relaxation & breathing to reset your mind.',
    backgroundColor: '#07212e',
  },
  {
    id: 'infinite-inspiration',
    image: require('../../assets/infinite-inspiration.png'),
    title: 'Infinite-Inspiration Mode',
    description: 'Deep talks & affirmations to expand your mind.',
    backgroundColor: '#161628',
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>2/3</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Choose your{'\n'}Mind-Mode</Text>

          <View style={styles.modesContainer}>
            {MIND_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  { backgroundColor: mode.backgroundColor },
                  selectedMode === mode.id && styles.modeCardSelected,
                ]}
                onPress={() => setSelectedMode(mode.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <Image
                    source={mode.image}
                    style={styles.modeImage}
                    resizeMode="contain"
                  />
                  <View style={styles.textContent}>
                    <Text style={styles.modeTitle}>{mode.title}</Text>
                    <Text style={styles.modeDescription}>{mode.description}</Text>
                  </View>
                </View>
                {selectedMode === mode.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
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
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradientBorder}
          >
            <View style={styles.continueInner}>
              <Text style={styles.continueText}>Next</Text>
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
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
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
    fontSize: 32,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
    lineHeight: 40,
  },
  modesContainer: {
    gap: theme.spacing.md,
  },
  modeCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 120,
  },
  modeCardSelected: {
    borderColor: theme.colors.alpha,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  modeImage: {
    width: 70,
    height: 70,
  },
  textContent: {
    flex: 1,
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
  checkmark: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  checkmarkText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradientBorder: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  continueInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default MindModeScreen;
