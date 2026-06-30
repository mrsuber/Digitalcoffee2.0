import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../utils/theme';
import { professionalCoachesAPI } from '../services/api';

const RateProfessionalCoachModal = ({ visible, coach, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const response = await professionalCoachesAPI.reviewCoach(
        coach.id,
        rating,
        review.trim()
      );

      if (response.success) {
        onSuccess?.();
        setRating(0);
        setReview('');
        onClose();
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
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
      <View style={styles.overlay}>
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
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.title}>Rate Your Coach</Text>
              <Text style={styles.coachName}>{coach?.full_name}</Text>

              {/* Star Rating */}
              <View style={styles.starsSection}>
                <Text style={styles.sectionLabel}>Your Rating</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.star}>
                        {star <= rating ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <Text style={styles.ratingLabel}>
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </Text>
                )}
              </View>

              {/* Review Text */}
              <View style={styles.reviewSection}>
                <Text style={styles.sectionLabel}>Your Review (Optional)</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Share your experience with this coach..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  numberOfLines={4}
                  value={review}
                  onChangeText={setReview}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {review.length}/500
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting || rating === 0}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    rating === 0
                      ? ['rgba(107, 114, 128, 0.5)', 'rgba(75, 85, 99, 0.5)']
                      : [theme.colors.alpha, theme.colors.theta]
                  }
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
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
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  coachName: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.alpha,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  starsSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  star: {
    fontSize: 40,
  },
  ratingLabel: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.alpha,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  reviewSection: {
    marginBottom: theme.spacing.xl,
  },
  reviewInput: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    textAlignVertical: 'top',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  characterCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: theme.spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
});

export default RateProfessionalCoachModal;
