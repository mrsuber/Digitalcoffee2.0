import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const MOODS = [
  { emoji: '😌', label: 'Clear', value: 'clear' },
  { emoji: '😤', label: 'Tired', value: 'tired' },
  { emoji: '😨', label: 'Anxious', value: 'anxious' },
  { emoji: '😴', label: 'Foggy', value: 'foggy' },
  { emoji: '😬', label: 'Inspired', value: 'inspired' },
];

const FOCUS_LEVELS = ['low', 'medium', 'high'];

export const MoodCheckScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState(null);
  const [focusLevel, setFocusLevel] = useState('medium');
  const [dailyGoal, setDailyGoal] = useState('');
  const [emojiRating, setEmojiRating] = useState(3);

  const handleNext = () => {
    if (currentStep === 1 && !selectedMood) return;

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save mood check-in data and navigate to mind-mode selection
      const moodData = {
        mood: selectedMood,
        focus_level: focusLevel,
        daily_goal: dailyGoal,
        emoji_rating: emojiRating,
      };

      navigation.navigate('MindModeSelection', { moodData });
    }
  };

  const renderStep1 = () => (
    <>
      <Text style={styles.questionText}>How do you feel right now?</Text>
      <View style={styles.moodContainer}>
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
      </View>

      <View style={styles.emojiSliderContainer}>
        <Text style={styles.sliderLabel}>Overall feeling (1-5)</Text>
        <View style={styles.ratingButtons}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                emojiRating === rating && styles.ratingButtonSelected,
              ]}
              onPress={() => setEmojiRating(rating)}
            >
              <Text
                style={[
                  styles.ratingText,
                  emojiRating === rating && styles.ratingTextSelected,
                ]}
              >
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
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
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.questionText}>
        What one thing do you really want to finish today?
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Type your goal..."
        placeholderTextColor={theme.colors.textMuted}
        value={dailyGoal}
        onChangeText={setDailyGoal}
        multiline
        numberOfLines={3}
      />
    </>
  );

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
          <Text style={styles.stepIndicator}>{currentStep}/3</Text>
        </View>

        <View style={styles.content}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (currentStep === 1 && !selectedMood) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentStep === 1 && !selectedMood}
          activeOpacity={0.8}
        >
          {/* Gradient border layer */}
          <LinearGradient
            colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradientBorder}
          >
            {/* Inner transparent background */}
            <View style={styles.nextButtonInner}>
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? 'CONTINUE' : 'NEXT'}
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
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  questionText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  moodButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    width: width / 3 - theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  moodButtonSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  moodLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
  },
  emojiSliderContainer: {
    marginTop: theme.spacing.lg,
  },
  sliderLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
  },
  ratingText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  ratingTextSelected: {
    color: theme.colors.alpha,
  },
  focusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nextButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradientBorder: {
    borderRadius: theme.borderRadius.lg,
    padding: 2, // Border width
  },
  nextButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)', // Semi-transparent dark background
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
});

export default MoodCheckScreen;
