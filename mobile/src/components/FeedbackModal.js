import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { feedbackAPI } from '../services/api';

export const FeedbackModal = ({ visible, onClose, type = 'bug' }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getTitle = () => {
    return type === 'bug' ? 'Report a Bug' : 'Feature Request';
  };

  const getIcon = () => {
    return type === 'bug' ? '🐛' : '💡';
  };

  const getPlaceholder = () => {
    return type === 'bug'
      ? 'e.g., App crashes when opening audio player'
      : 'e.g., Add dark mode support';
  };

  const getDescriptionPlaceholder = () => {
    return type === 'bug'
      ? 'Please describe what happened, what you expected to happen, and steps to reproduce the issue...'
      : 'Please describe the feature you would like to see, why it would be useful, and any ideas for how it should work...';
  };

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (subject.length > 255) {
      Alert.alert('Error', 'Subject must be 255 characters or less');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    try {
      setSubmitting(true);
      const response = await feedbackAPI.submit(type, subject.trim(), description.trim());

      if (response.success) {
        Alert.alert(
          'Success',
          type === 'bug'
            ? 'Thank you for reporting this bug! We\'ll look into it as soon as possible.'
            : 'Thank you for your suggestion! We appreciate your feedback.',
          [{ text: 'OK', onPress: handleClose }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientMid, theme.colors.gradientEnd]}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.icon}>{getIcon()}</Text>
              <Text style={styles.title}>{getTitle()}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subject Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder={getPlaceholder()}
                placeholderTextColor={theme.colors.textMuted}
                maxLength={255}
                editable={!submitting}
              />
              <Text style={styles.charCount}>{subject.length}/255</Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={getDescriptionPlaceholder()}
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {type === 'bug'
                  ? '💡 Tip: Include steps to reproduce the issue for faster resolution.'
                  : '💡 Tip: Be specific about how this feature would help you.'}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <LinearGradient
                colors={submitting ? ['#666', '#555'] : [theme.colors.alpha, theme.colors.beta]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={theme.colors.text} />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </>
                ) : (
                  <Text style={styles.submitButtonText}>Submit {type === 'bug' ? 'Bug Report' : 'Request'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  textArea: {
    minHeight: 150,
    paddingTop: theme.spacing.md,
  },
  charCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  infoText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  submitButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});

export default FeedbackModal;
