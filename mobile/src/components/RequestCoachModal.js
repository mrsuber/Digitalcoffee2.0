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

const RequestCoachModal = ({ visible, coachId, coachName, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please tell them why you\'d like them as a coach');
      return;
    }

    if (message.length > 500) {
      Alert.alert('Too Long', 'Message must be 500 characters or less');
      return;
    }

    try {
      setSending(true);

      const response = await coachingAPI.sendRequest(coachId, message.trim());

      if (response.success) {
        Alert.alert(
          'Request Sent! 🎓',
          `Your coaching request has been sent to ${coachName}. They will be notified!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setMessage('');
                onClose();
                onSuccess && onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      Alert.alert('Error', 'Failed to send coaching request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <BlurView intensity={20} style={styles.blurView}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(26, 20, 72, 0.98)', 'rgba(15, 10, 50, 0.98)']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Request Coaching</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🎓</Text>
            </View>

            {/* Info */}
            <Text style={styles.subtitle}>
              Request {coachName} to be your meditation coach
            </Text>

            <Text style={styles.description}>
              Tell them why you'd like them as your coach and what you hope to achieve together.
            </Text>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Hi! I'd love to have you as my coach because..."
                placeholderTextColor={theme.colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{message.length}/500</Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={sending}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                style={styles.sendButtonGradient}
              >
                {sending ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <Text style={styles.sendButtonText}>Send Request</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: theme.borderRadius.xl,
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
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: {
    fontSize: 48,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    minHeight: 150,
  },
  input: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    lineHeight: 22,
    flex: 1,
    minHeight: 100,
  },
  characterCount: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  sendButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  sendButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
});

export default RequestCoachModal;
