import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { moodAPI } from '../services/api';

const { width } = Dimensions.get('window');

const MOODS = [
  { emoji: '😌', label: 'Clear', value: 'clear' },
  { emoji: '🧘', label: 'Calm', value: 'calm' },
  { emoji: '😤', label: 'Tired', value: 'tired' },
  { emoji: '😨', label: 'Anxious', value: 'anxious' },
  { emoji: '😴', label: 'Foggy', value: 'foggy' },
];

const FOCUS_LEVELS = ['low', 'medium', 'high'];

const DAILY_GOALS = [
  'Complete a work project',
  'Study or learn something new',
  'Exercise or workout',
  'Meditate or practice mindfulness',
  'Read a book or article',
  'Connect with friends or family',
  'Organize or clean',
  'Creative work (art, music, writing)',
  'Self-care and relaxation',
  'Other',
];

export const MoodCheckScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodIntensity, setMoodIntensity] = useState(50); // Percentage 0-100
  const [focusLevel, setFocusLevel] = useState('medium');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [sliderWidth, setSliderWidth] = useState(width - 80);
  const [saving, setSaving] = useState(false);

  // Helper function to get user-specific storage key
  const getUserKey = (key) => {
    return user?.id ? `${key}_user_${user.id}` : key;
  };

  // Load skip preference
  useEffect(() => {
    if (user?.id) {
      checkSkipPreference();
    }
  }, [user?.id]);

  const checkSkipPreference = async () => {
    try {
      const skipMoodCheck = await AsyncStorage.getItem(getUserKey('skipMoodCheck'));
      if (skipMoodCheck === 'true') {
        // User chose to skip mood checks, go directly to mind mode
        navigation.replace('MindModeSelection', { skipped: true });
      }
    } catch (error) {
      console.error('Error checking skip preference:', error);
    }
  };

  const handleSkipForNow = () => {
    navigation.replace('MindModeSelection', { skipped: true });
  };

  const handleSkipAlways = async () => {
    try {
      await AsyncStorage.setItem(getUserKey('skipMoodCheck'), 'true');
      navigation.replace('MindModeSelection', { skipped: true });
    } catch (error) {
      console.error('Error saving skip preference:', error);
    }
  };

  const handleNext = async () => {
    if (!selectedMood || saving) return;

    const finalGoal = selectedGoal === 'Other' ? customGoal : selectedGoal;

    try {
      setSaving(true);

      // Save mood check-in to backend
      const response = await moodAPI.createCheckin(
        selectedMood,
        focusLevel,
        finalGoal,
        null // emoji_rating is optional, we can add this later
      );

      if (response.success) {
        console.log('✅ Mood check-in saved:', response.data);

        // Still pass mood data to next screen for immediate use
        const moodData = {
          mood: selectedMood,
          mood_intensity: moodIntensity,
          focus_level: focusLevel,
          daily_goal: finalGoal,
        };

        navigation.navigate('MindModeSelection', { moodData });
      } else {
        console.error('Failed to save mood check-in:', response);
        // Still navigate even if save fails
        navigation.navigate('MindModeSelection', {
          moodData: {
            mood: selectedMood,
            mood_intensity: moodIntensity,
            focus_level: focusLevel,
            daily_goal: finalGoal,
          }
        });
      }
    } catch (error) {
      console.error('Error saving mood check-in:', error);
      // Still navigate even if there's an error
      navigation.navigate('MindModeSelection', {
        moodData: {
          mood: selectedMood,
          mood_intensity: moodIntensity,
          focus_level: focusLevel,
          daily_goal: finalGoal,
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSliderTouch = (event) => {
    const { locationX } = event.nativeEvent;
    const percentage = Math.max(0, Math.min(100, (locationX / sliderWidth) * 100));
    setMoodIntensity(Math.round(percentage));
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
        {/* Header with back button and step indicator */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>1/3</Text>
        </View>

        <View style={styles.content}>
          {/* Question 1: How do you feel right now? */}
          <Text style={styles.questionText}>How do you feel right now?</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodScrollContainer}
            contentContainerStyle={styles.moodScrollContent}
          >
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && styles.moodButtonSelected,
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Slider for mood intensity percentage */}
          {selectedMood && (
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                style={styles.sliderTrack}
                activeOpacity={1}
                onPress={handleSliderTouch}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  setSliderWidth(width);
                }}
              >
                <View
                  style={[
                    styles.sliderFill,
                    { width: `${moodIntensity}%` }
                  ]}
                />
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${moodIntensity}%` }
                  ]}
                />
              </TouchableOpacity>
              <Text style={styles.sliderPercentage}>{moodIntensity}%</Text>
            </View>
          )}

          {/* Question 2: How focused are you? */}
          <Text style={styles.questionText}>How focused are you?</Text>
          <View style={styles.focusContainer}>
            {FOCUS_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.focusButton,
                  focusLevel === level && styles.focusButtonSelected,
                ]}
                onPress={() => setFocusLevel(level)}
              >
                <Text
                  style={[
                    styles.focusText,
                    focusLevel === level && styles.focusTextSelected,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Question 3: Daily goal dropdown */}
          <Text style={styles.questionText}>
            What one thing do you really want to finish today?
          </Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowGoalPicker(true)}
          >
            <Text style={[
              styles.dropdownButtonText,
              !selectedGoal && styles.dropdownPlaceholder
            ]}>
              {selectedGoal || 'Type your goal...'}
            </Text>
            <Text style={styles.dropdownIcon}>→</Text>
          </TouchableOpacity>

          {/* Show custom input if "Other" is selected */}
          {selectedGoal === 'Other' && (
            <TextInput
              style={styles.customGoalInput}
              placeholder="Type your custom goal..."
              placeholderTextColor={theme.colors.textMuted}
              value={customGoal}
              onChangeText={setCustomGoal}
              multiline
            />
          )}

          {/* Skip options */}
          <View style={styles.skipContainer}>
            <TouchableOpacity onPress={handleSkipForNow}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
            <Text style={styles.skipDivider}>|</Text>
            <TouchableOpacity onPress={handleSkipAlways}>
              <Text style={styles.skipText}>Don't show again</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedMood || saving) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedMood || saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradientBorder}
          >
            <View style={styles.nextButtonInner}>
              {saving ? (
                <ActivityIndicator color={theme.colors.text} />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select your daily goal</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {DAILY_GOALS.map((goal, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.goalOption,
                    selectedGoal === goal && styles.goalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedGoal(goal);
                    if (goal !== 'Other') {
                      setShowGoalPicker(false);
                    } else {
                      setShowGoalPicker(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.goalOptionText,
                    selectedGoal === goal && styles.goalOptionTextSelected,
                  ]}>
                    {goal}
                  </Text>
                  {selectedGoal === goal && (
                    <Text style={styles.goalCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: theme.spacing.md,
  },
  questionText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  // Mood selection styles
  moodScrollContainer: {
    marginBottom: theme.spacing.lg,
  },
  moodScrollContent: {
    paddingRight: theme.spacing.lg,
  },
  moodButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.md,
    minWidth: 80,
  },
  moodButtonSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '500',
  },
  // Slider styles
  sliderContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: theme.colors.alpha,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.alpha,
    marginLeft: -12,
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  sliderPercentage: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  // Focus level styles
  focusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  focusButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  focusButtonSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
  },
  focusText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  focusTextSelected: {
    color: theme.colors.alpha,
  },
  // Dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  dropdownButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: theme.colors.textMuted,
  },
  dropdownIcon: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  customGoalInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.alpha,
    marginBottom: theme.spacing.md,
  },
  // Skip options styles
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  skipText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
  skipDivider: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textMuted,
    marginHorizontal: theme.spacing.md,
  },
  // Next button styles
  nextButton: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradientBorder: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  nextButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
    color: theme.colors.textSecondary,
  },
  modalScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  goalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  goalOptionSelected: {
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  goalOptionText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    flex: 1,
  },
  goalOptionTextSelected: {
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  goalCheckmark: {
    fontSize: 20,
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
});

export default MoodCheckScreen;
