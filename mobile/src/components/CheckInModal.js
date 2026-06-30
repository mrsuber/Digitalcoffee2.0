import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../utils/theme';
import { coachingAPI } from '../services/api';

const CheckInModal = ({ visible, relationshipId, studentName, onClose, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const response = await coachingAPI.createCheckin(relationshipId, notes.trim() || null);

      if (response.success) {
        Alert.alert(
          'Check-In Recorded! ✓',
          `Your check-in with ${studentName} has been logged.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setNotes('');
                onClose();
                onSuccess && onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to record check-in');
      }
    } catch (error) {
      console.error('Error recording check-in:', error);
      Alert.alert('Error', 'Failed to record check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <BlurView intensity={20} style={styles.blurView}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        </BlurView>

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 20, 72, 0.98)', 'rgba(15, 10, 50, 0.98)']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Check-In</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Icon */}
            <Text style={styles.icon}>✓</Text>

            {/* Description */}
            <Text style={styles.description}>
              Record your check-in with {studentName}
            </Text>

            {/* Notes Input */}
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Add any notes about your student's progress, challenges, or next steps..."
              placeholderTextColor={theme.colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={6}
              maxLength={500}
            />

            <Text style={styles.charCount}>{notes.length}/500</Text>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={submitting ? ['#555', '#333'] : ['#3B82F6', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Record Check-In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  label: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    height: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  charCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  submitButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
  },
});

export default CheckInModal;
