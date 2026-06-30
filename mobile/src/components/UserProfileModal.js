import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../utils/theme';
import { coachingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserProfileModal = ({ visible, userId, userName, onClose, onRequestCoach }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    console.log('UserProfileModal - visible:', visible, 'userId:', userId, 'userName:', userName);
    if (visible && userId) {
      loadProfile();
    } else if (visible && !userId) {
      console.error('UserProfileModal opened without userId!');
      setLoading(false);
      Alert.alert(
        'Error',
        'User profile cannot be loaded. Please refresh the page by pulling down and try again.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  }, [visible, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('Loading profile for userId:', userId);

      if (!userId) {
        throw new Error('User ID is required');
      }

      const [profileResponse, ratingsResponse] = await Promise.all([
        coachingAPI.getCoachingProfile(userId),
        coachingAPI.getCoachRatings(userId).catch(() => ({ success: true, data: [] }))
      ]);

      console.log('Profile response:', profileResponse);
      console.log('Ratings response:', ratingsResponse);

      if (profileResponse.success && profileResponse.data) {
        console.log('Profile data received:', profileResponse.data);
        setProfile(profileResponse.data);
      } else {
        console.log('Profile load failed:', profileResponse.error || 'Unknown error');
        Alert.alert('Error', 'Failed to load profile: ' + (profileResponse.error || 'No data returned'));
      }

      if (ratingsResponse.success && ratingsResponse.data) {
        setRatings(ratingsResponse.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCoach = () => {
    onClose();
    setTimeout(() => {
      onRequestCoach && onRequestCoach(userId, userName);
    }, 300);
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

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.alpha} />
              </View>
            ) : profile ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Name */}
                <Text style={styles.name}>{profile.name || 'Anonymous'}</Text>

                {/* Bio */}
                {profile.coaching_bio && (
                  <Text style={styles.bio}>{profile.coaching_bio}</Text>
                )}

                {/* Coaching Stats */}
                {profile.is_available_as_coach && (
                  <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>COACHING ACHIEVEMENTS</Text>

                    <View style={styles.statsGrid}>
                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                          style={styles.statCardInner}
                        >
                          <Text style={styles.statIcon}>🎓</Text>
                          <Text style={styles.statValue}>{profile.students_coached || 0}</Text>
                          <Text style={styles.statLabel}>Students Coached</Text>
                        </LinearGradient>
                      </View>

                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                          style={styles.statCardInner}
                        >
                          <Text style={styles.statIcon}>✅</Text>
                          <Text style={styles.statValue}>{profile.courses_helped_complete || 0}</Text>
                          <Text style={styles.statLabel}>Courses Completed</Text>
                        </LinearGradient>
                      </View>

                      <View style={styles.statCard}>
                        <LinearGradient
                          colors={['rgba(236, 72, 153, 0.2)', 'rgba(236, 72, 153, 0.05)']}
                          style={styles.statCardInner}
                        >
                          <Text style={styles.statIcon}>📈</Text>
                          <Text style={styles.statValue}>{profile.active_students || 0}</Text>
                          <Text style={styles.statLabel}>Active Students</Text>
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                )}

                {/* Student Reviews */}
                {profile.is_available_as_coach && ratings.length > 0 && (
                  <View style={styles.reviewsContainer}>
                    <Text style={styles.statsTitle}>STUDENT REVIEWS</Text>

                    <View style={styles.reviewsList}>
                      {ratings.map((rating) => (
                        <View key={rating.id} style={styles.reviewCard}>
                          <LinearGradient
                            colors={['rgba(59, 130, 246, 0.15)', 'rgba(147, 51, 234, 0.05)']}
                            style={styles.reviewCardInner}
                          >
                            {/* Student info and stars */}
                            <View style={styles.reviewHeader}>
                              <View style={styles.reviewStudent}>
                                <View style={styles.reviewAvatar}>
                                  <Text style={styles.reviewAvatarText}>
                                    {(rating.student_name || 'A').charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={styles.reviewStudentInfo}>
                                  <Text style={styles.reviewStudentName}>
                                    {rating.student_name || 'Anonymous'}
                                  </Text>
                                  <Text style={styles.reviewDate}>
                                    {new Date(rating.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                </View>
                              </View>

                              {/* Star Rating */}
                              <View style={styles.starsContainer}>
                                {[...Array(5)].map((_, i) => (
                                  <Text key={i} style={styles.starIcon}>
                                    {i < rating.rating ? '⭐' : '☆'}
                                  </Text>
                                ))}
                              </View>
                            </View>

                            {/* Feedback */}
                            {rating.feedback && (
                              <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackText}>"{rating.feedback}"</Text>
                              </View>
                            )}
                          </LinearGradient>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                {userId !== user?.id && (
                  <View style={styles.actions}>
                    {profile.is_available_as_coach && (
                      <TouchableOpacity
                        style={styles.requestButton}
                        onPress={handleRequestCoach}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={[theme.colors.alpha, theme.colors.theta]}
                          style={styles.requestButtonGradient}
                        >
                          <Text style={styles.requestIcon}>🎓</Text>
                          <Text style={styles.requestButtonText}>Request as Coach</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {!profile.is_available_as_coach && (
                      <View style={styles.unavailableContainer}>
                        <Text style={styles.unavailableText}>
                          This user is not currently available as a coach
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load profile</Text>
              </View>
            )}
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
  loadingContainer: {
    paddingVertical: theme.spacing.xxl * 2,
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  name: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  bio: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  statsContainer: {
    marginBottom: theme.spacing.xl,
  },
  statsTitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    gap: theme.spacing.sm,
  },
  statCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  statCardInner: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.alpha,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing.md,
  },
  requestButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  requestButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  requestIcon: {
    fontSize: 20,
  },
  requestButtonText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  unavailableContainer: {
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  unavailableText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    paddingVertical: theme.spacing.xxl * 2,
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
  },
  reviewsContainer: {
    marginBottom: theme.spacing.xl,
  },
  reviewsList: {
    gap: theme.spacing.md,
  },
  reviewCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  reviewCardInner: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  reviewStudentInfo: {
    flex: 1,
  },
  reviewStudentName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 16,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.alpha,
  },
  feedbackText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default UserProfileModal;
