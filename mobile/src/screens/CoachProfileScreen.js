import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../utils/theme';
import { professionalCoachesAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';
import RateProfessionalCoachModal from '../components/RateProfessionalCoachModal';

export const CoachProfileScreen = ({ route, navigation }) => {
  const { coachId } = route.params;
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [isMyCoach, setIsMyCoach] = useState(false);
  const [myCoachRelationship, setMyCoachRelationship] = useState(null);
  const { showAlert, AlertComponent } = useAlert();

  useEffect(() => {
    loadCoachProfile();
    checkIfMyCoach();
  }, [coachId]);

  const checkIfMyCoach = async () => {
    try {
      const response = await professionalCoachesAPI.getMyCoaches();
      if (response.success && response.data) {
        const relationship = response.data.find(
          (rel) => rel.coach_id === parseInt(coachId)
        );
        if (relationship) {
          setIsMyCoach(true);
          setMyCoachRelationship(relationship);
        }
      }
    } catch (error) {
      console.error('Error checking coach relationship:', error);
      // Don't show error to user, just assume not their coach
    }
  };

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      const response = await professionalCoachesAPI.getById(coachId);

      if (response.success) {
        setCoach(response.data);
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: response.message || 'Failed to load coach profile',
        });
      }
    } catch (error) {
      console.error('Error loading coach:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load coach profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCoaching = async () => {
    if (!requestMessage.trim()) {
      showAlert({
        type: 'error',
        title: 'Message Required',
        message: 'Please tell the coach why you want to work with them',
      });
      return;
    }

    try {
      setRequesting(true);
      const response = await professionalCoachesAPI.requestCoaching(
        coachId,
        [requestMessage] // Backend expects goals as an array
      );

      if (response.success) {
        setShowRequestModal(false);
        setRequestMessage('');
        showAlert({
          type: 'success',
          title: 'Request Sent!',
          message: 'Your coaching request has been sent. The coach will review and respond soon.',
          buttons: [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Request Failed',
          message: response.message || 'Failed to send request',
        });
      }
    } catch (error) {
      console.error('Error requesting coaching:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Failed to send request. Please try again.',
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleRatingSuccess = () => {
    // Reload coach profile to get updated reviews
    loadCoachProfile();
    showAlert({
      type: 'success',
      title: 'Review Submitted!',
      message: 'Thank you for your feedback. Your review has been posted.',
    });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.colors.gradientMid,
          theme.colors.gradientEnd,
        ]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.alpha} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!coach) {
    return (
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          theme.colors.gradientMid,
          theme.colors.gradientEnd,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Coach not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[
        theme.colors.gradientStart,
        theme.colors.gradientMid,
        theme.colors.gradientEnd,
      ]}
      style={styles.container}
    >
      <AlertComponent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coach Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {coach.avatar_url ? (
              <Image
                source={{ uri: coach.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {coach.full_name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {(parseFloat(coach.rating) || 5.0).toFixed(1)}</Text>
            </View>
          </View>

          {/* Name & Credentials */}
          <Text style={styles.coachName}>{coach.full_name}</Text>
          <Text style={styles.credentials}>{coach.credentials}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.total_students || 0}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.years_experience || 0}</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coach.total_sessions_completed || 0}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{(parseFloat(coach.rating) || 5.0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{coach.bio}</Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {coach.specialties?.map((specialty, index) => (
              <View key={index} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.languagesContainer}>
            {coach.languages?.map((language, index) => (
              <View key={index} style={styles.languageChip}>
                <Text style={styles.languageText}>🌐 {language}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Certifications */}
        {coach.certifications && coach.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {coach.certifications.map((cert, index) => (
              <View key={index} style={styles.certCard}>
                <Text style={styles.certIcon}>🏆</Text>
                <View style={styles.certInfo}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certIssuer}>
                    {cert.issuer} • {cert.year}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Reviews */}
        {((coach.recent_reviews && coach.recent_reviews.length > 0) || (coach.reviews && coach.reviews.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {(coach.reviews || coach.recent_reviews || []).map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.user_name}</Text>
                  <Text style={styles.reviewRating}>{'⭐'.repeat(review.rating)}</Text>
                </View>
                {(review.review || review.review_text) && (
                  <Text style={styles.reviewText}>{review.review || review.review_text}</Text>
                )}
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Availability Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityEmoji}>📅</Text>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityText}>
                {coach.is_accepting_students
                  ? '✓ Currently accepting new students'
                  : '⚠️ Currently not accepting new students'}
              </Text>
              <Text style={styles.availabilitySubtext}>
                Timezone: {coach.timezone}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom CTA Button */}
      {coach.is_accepting_students && (
        <View style={styles.ctaContainer}>
          {isMyCoach ? (
            // Already your coach - show different actions
            <View style={styles.myCoachActions}>
              <Text style={styles.myCoachBadge}>✓ Your Professional Coach</Text>
              <View style={styles.myCoachButtonsRow}>
                <TouchableOpacity
                  style={styles.myCoachButton}
                  onPress={() => {
                    if (myCoachRelationship) {
                      navigation.navigate('Messaging', {
                        relationshipId: myCoachRelationship.id,
                        partnerName: coach.full_name,
                        isProfessionalCoach: true,
                        coachId: coach.id
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#059669', '#10b981']}
                    style={styles.myCoachButtonGradient}
                  >
                    <Text style={styles.myCoachButtonText}>💬 Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.myCoachButton}
                  onPress={() => setShowRatingModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.myCoachButtonGradient}
                  >
                    <Text style={styles.myCoachButtonText}>⭐ Rate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Not your coach yet - show request button
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => setShowRequestModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4c1d95', '#7c3aed']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>Request Coaching Session</Text>
                <Text style={styles.ctaSubtext}>$0 during testing phase</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={styles.blurView}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Request Coaching</Text>
              <Text style={styles.modalSubtitle}>
                Tell {coach.full_name.split(' ')[0]} why you'd like to work together
              </Text>

              <TextInput
                style={styles.messageInput}
                placeholder="Share your goals, challenges, or what you hope to achieve..."
                placeholderTextColor={theme.colors.textSecondary}
                value={requestMessage}
                onChangeText={setRequestMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowRequestModal(false)}
                  disabled={requesting}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitButton, requesting && styles.modalSubmitButtonDisabled]}
                  onPress={handleRequestCoaching}
                  disabled={requesting}
                >
                  <LinearGradient
                    colors={['#4c1d95', '#7c3aed']}
                    style={styles.modalSubmitGradient}
                  >
                    <Text style={styles.modalSubmitText}>
                      {requesting ? 'Sending...' : 'Send Request'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Rating Modal */}
      <RateProfessionalCoachModal
        visible={showRatingModal}
        coach={coach}
        onClose={() => setShowRatingModal(false)}
        onSuccess={handleRatingSuccess}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButtonText: {
    fontSize: 24,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.alpha,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.alpha,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.alpha,
  },
  ratingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  coachName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  credentials: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statBox: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  bioText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  specialtyChip: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.alpha,
  },
  specialtyText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  languageChip: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  languageText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
  },
  certCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  certIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  certIssuer: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  reviewerName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reviewRating: {
    fontSize: theme.fonts.sizes.sm,
  },
  reviewText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  reviewDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  availabilityCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  availabilityEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    marginBottom: 4,
  },
  availabilitySubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  bottomSpacer: {
    height: 20,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ctaButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  ctaGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ctaSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  messageInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.alpha,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  myCoachActions: {
    width: '100%',
  },
  myCoachBadge: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  myCoachButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  myCoachButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  myCoachButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myCoachButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
});

export default CoachProfileScreen;
