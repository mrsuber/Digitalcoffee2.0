import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { communityAPI } from '../services/api';

const CreatePostScreen = ({ navigation }) => {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [sessionMinutes, setSessionMinutes] = useState('');
  const [loading, setLoading] = useState(false);

  const moods = [
    { label: 'Clear', emoji: '😌', value: 'clear' },
    { label: 'Tired', emoji: '😤', value: 'tired' },
    { label: 'Anxious', emoji: '😨', value: 'anxious' },
    { label: 'Foggy', emoji: '🌫️', value: 'foggy' },
    { label: 'Inspired', emoji: '✨', value: 'inspired' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Required', 'Please share your experience');
      return;
    }

    if (content.length > 500) {
      Alert.alert('Too Long', 'Post must be 500 characters or less');
      return;
    }

    try {
      setLoading(true);

      const minutes = sessionMinutes ? parseInt(sessionMinutes) : null;

      const response = await communityAPI.createPost(
        content.trim(),
        selectedMood,
        minutes
      );

      if (response.success) {
        Alert.alert('Success', 'Your post has been shared!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to share your post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Share Experience</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>YOUR EXPERIENCE</Text>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Share your meditation journey, insights, or how the app is helping you..."
                placeholderTextColor={theme.colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{content.length}/500</Text>
            </View>

            {/* Mood Selection */}
            <Text style={styles.label}>HOW DO YOU FEEL? (Optional)</Text>
            <View style={styles.moodGrid}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.value}
                  style={styles.moodButton}
                  onPress={() =>
                    setSelectedMood(selectedMood === mood.value ? null : mood.value)
                  }
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      selectedMood === mood.value
                        ? ['rgba(59, 130, 246, 0.4)', 'rgba(59, 130, 246, 0.1)']
                        : ['rgba(26, 20, 72, 0.6)', 'rgba(26, 20, 72, 0.3)']
                    }
                    style={styles.moodButtonInner}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                    {selectedMood === mood.value && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Session Duration */}
            <Text style={styles.label}>SESSION DURATION (Optional)</Text>
            <View style={styles.durationContainer}>
              <TextInput
                style={styles.durationInput}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                value={sessionMinutes}
                onChangeText={(text) => setSessionMinutes(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.durationLabel}>minutes</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <Text style={styles.submitText}>Share with Community</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Your post will be visible to all Digital Coffee users. Share your insights
              to inspire others on their meditation journey!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  textInputContainer: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    minHeight: 180,
  },
  textInput: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
    flex: 1,
    minHeight: 120,
  },
  characterCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  moodButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  moodButtonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
    position: 'relative',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  durationInput: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  durationLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  submitButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  submitText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
});

export default CreatePostScreen;
