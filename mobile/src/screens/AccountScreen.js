import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { progressAPI, coachingAPI, authAPI, professionalCoachesAPI, subscriptionAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';

export const AccountScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showAlert, AlertComponent } = useAlert();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [switchingSubscription, setSwitchingSubscription] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [coachingData, setCoachingData] = useState(null);
  const [loadingCoaching, setLoadingCoaching] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    loadSubscriptionStatus();
    loadUserStats();
    loadCoachingData();
  }, [user]);

  const loadSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      // Use subscription status directly from user context or call subscription API
      if (user?.subscription_status) {
        setSubscriptionStatus(user.subscription_status);
      } else {
        // Fallback to API call if not in context
        const response = await subscriptionAPI.getStatus();
        if (response.success && response.data) {
          setSubscriptionStatus(response.data.subscription_status || 'free');
        } else {
          setSubscriptionStatus('free');
        }
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      // On error, fallback to free
      setSubscriptionStatus('free');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadUserStats = async () => {
    try {
      setLoadingStats(true);
      const response = await progressAPI.getOverview(30);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCoachingData = async () => {
    try {
      setLoadingCoaching(true);
      const [coachRes, studentsRes] = await Promise.all([
        coachingAPI.getMyCoach().catch(() => ({ success: true, data: null })),
        coachingAPI.getMyStudents().catch(() => ({ success: true, data: [] })),
      ]);

      const data = {
        myCoach: coachRes.success ? coachRes.data : null,
        students: studentsRes.success ? studentsRes.data || [] : [],
      };
      setCoachingData(data);
    } catch (error) {
      console.error('Error loading coaching data:', error);
    } finally {
      setLoadingCoaching(false);
    }
  };

  const formatTotalTime = (minutes) => {
    if (!minutes) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    // TODO: Call API to update name
  };

  const handleSaveEmail = () => {
    setIsEditingEmail(false);
    // TODO: Call API to update email
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // TODO: Call API to change password
    setShowChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      showAlert({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter your password to confirm account deletion.',
      });
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await authAPI.deleteAccount(deletePassword, deletionReason);

      if (response.success) {
        setShowDeleteAccountModal(false);
        setDeletePassword('');
        setDeletionReason('');

        showAlert({
          type: 'success',
          title: 'Account Deleted',
          message: response.message || 'Your account has been deleted successfully.',
          buttons: [
            {
              text: 'OK',
              onPress: async () => {
                // Logout user and clear all data
                await logout();
                // Navigate to Auth screen
                navigation.replace('Auth');
              },
            },
          ],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Deletion Failed',
          message: response.message || 'Failed to delete account. Please try again.',
        });
      }
    } catch (error) {
      console.error('Delete account error:', error);

      let errorMessage = 'An error occurred while deleting your account.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showAlert({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSwitchSubscription = async (newType) => {
    if (newType === subscriptionStatus) {
      return;
    }

    const typeLabel = newType === 'premium' ? 'Premium' : 'Free';

    showAlert({
      type: 'warning',
      title: `Switch to ${typeLabel}?`,
      message: `Are you sure you want to switch to the ${typeLabel} plan? (Both are $0 for testing)`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              setSwitchingSubscription(true);
              const response = await authAPI.switchSubscription(newType);

              if (response.success) {
                // Reload subscription status from backend to ensure it's in sync
                await loadSubscriptionStatus();
                showAlert({
                  type: 'success',
                  title: 'Success!',
                  message: `Successfully switched to ${typeLabel} plan`,
                });
              } else {
                showAlert({
                  type: 'error',
                  title: 'Switch Failed',
                  message: response.message || 'Failed to switch subscription',
                });
              }
            } catch (error) {
              console.error('Error switching subscription:', error);
              showAlert({
                type: 'error',
                title: 'Error',
                message: 'Failed to switch subscription. Please try again.',
              });
            } finally {
              setSwitchingSubscription(false);
            }
          },
        },
      ],
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
      {/* Custom Alert */}
      <AlertComponent />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Picture */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#4c1d95', '#7c3aed', '#0d9488']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Text style={styles.editAvatarButtonText}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.memberSince}>Member since January 2024</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoGroup}>
            {/* Name */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditingName ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={() => setIsEditingName(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={handleSaveName}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>{name}</Text>
                  <TouchableOpacity onPress={() => setIsEditingName(true)}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email Address</Text>
              {isEditingEmail ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={() => setIsEditingEmail(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editActionButton}
                      onPress={handleSaveEmail}
                    >
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.infoValue}>{email}</Text>
                  <TouchableOpacity onPress={() => setIsEditingEmail(true)}>
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Password</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoValue}>••••••••</Text>
                <TouchableOpacity
                  onPress={() => setShowChangePasswordModal(true)}
                >
                  <Text style={styles.changePasswordText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Subscription */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plan</Text>

          {loadingSubscription ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.alpha} />
              <Text style={styles.loadingText}>Loading subscription...</Text>
            </View>
          ) : (
            <>
              {/* Current Plan Card */}
              <View style={styles.subscriptionCard}>
                <LinearGradient
                  colors={subscriptionStatus === 'premium' ? ['#4c1d95', '#7c3aed'] : ['#374151', '#4b5563']}
                  style={styles.subscriptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.subscriptionContent}>
                    <Text style={styles.subscriptionBadge}>
                      {subscriptionStatus === 'premium' ? '💎 PREMIUM' : '🎁 FREE'}
                    </Text>
                    <Text style={styles.subscriptionTitle}>
                      {subscriptionStatus === 'premium' ? 'Premium Member' : 'Free Member'}
                    </Text>
                    <Text style={styles.subscriptionDescription}>
                      {subscriptionStatus === 'premium'
                        ? 'Full access to all premium features'
                        : 'Basic features and audio library'}
                    </Text>
                    <View style={styles.subscriptionMeta}>
                      <Text style={styles.subscriptionMetaText}>$0/month (Testing)</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Switch Plan Section */}
              <View style={styles.switchPlanContainer}>
                <Text style={styles.switchPlanLabel}>
                  {subscriptionStatus === 'premium'
                    ? 'Want to downgrade to Free?'
                    : 'Want to upgrade to Premium?'}
                </Text>
                <TouchableOpacity
                  style={[styles.switchPlanButton, switchingSubscription && styles.switchPlanButtonDisabled]}
                  onPress={() => handleSwitchSubscription(subscriptionStatus === 'premium' ? 'free' : 'premium')}
                  disabled={switchingSubscription}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={subscriptionStatus === 'premium' ? ['#6b7280', '#9ca3af'] : ['#4c1d95', '#7c3aed']}
                    style={styles.switchPlanGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.switchPlanButtonText}>
                      {switchingSubscription
                        ? 'Switching...'
                        : subscriptionStatus === 'premium'
                        ? '⬇️ Switch to Free'
                        : '⬆️ Upgrade to Premium'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          {loadingStats ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.alpha} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.total_sessions || 0}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatTotalTime(stats?.total_minutes || 0)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.streak_days || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.courses_enrolled || 0}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>
            </View>
          )}
        </View>

        {/* Coaching Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coaching</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Library', { screen: 'CoachingHub' })}
            >
              <Text style={styles.viewAllText}>View Hub →</Text>
            </TouchableOpacity>
          </View>
          {loadingCoaching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.alpha} />
            </View>
          ) : (
            <View style={styles.coachingContent}>
              {coachingData?.myCoach && (
                <TouchableOpacity
                  style={styles.coachingCard}
                  onPress={() => navigation.navigate('Library', {
                    screen: 'StudentDetail',
                    params: {
                      studentId: user?.id,
                      isViewingAsStudent: true,
                      coach: coachingData.myCoach
                    }
                  })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.05)']}
                    style={styles.coachingCardInner}
                  >
                    <Text style={styles.coachingIcon}>🎓</Text>
                    <View style={styles.coachingInfo}>
                      <Text style={styles.coachingLabel}>Your Coach</Text>
                      <Text style={styles.coachingName}>{coachingData.myCoach.coach_name}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {coachingData?.students && coachingData.students.length > 0 && (
                <TouchableOpacity
                  style={styles.coachingCard}
                  onPress={() => navigation.navigate('Library', { screen: 'MyStudents' })}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(147, 51, 234, 0.2)', 'rgba(147, 51, 234, 0.05)']}
                    style={styles.coachingCardInner}
                  >
                    <Text style={styles.coachingIcon}>👥</Text>
                    <View style={styles.coachingInfo}>
                      <Text style={styles.coachingLabel}>Your Students</Text>
                      <Text style={styles.coachingName}>
                        {coachingData.students.length} {coachingData.students.length === 1 ? 'Student' : 'Students'}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {!coachingData?.myCoach && (!coachingData?.students || coachingData.students.length === 0) && (
                <View style={styles.coachingEmpty}>
                  <Text style={styles.coachingEmptyIcon}>🎓</Text>
                  <Text style={styles.coachingEmptyText}>No coaching connections yet</Text>
                  <TouchableOpacity
                    style={styles.exploreCoachingButton}
                    onPress={() => navigation.navigate('Library', { screen: 'CoachingHub' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exploreCoachingText}>Explore Coaching</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => setShowDeleteAccountModal(true)}
            >
              <Text style={styles.dangerButtonIcon}>⚠️</Text>
              <Text style={styles.dangerButtonText}>Delete Account</Text>
            </TouchableOpacity>
            <Text style={styles.dangerWarning}>
              This action cannot be undone. All your data will be permanently
              deleted.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Enter new password"
                placeholderTextColor={theme.colors.textMuted}
              />
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.textMuted}
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
            >
              <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButtonGradient}
              >
                <View style={styles.modalButtonInner}>
                  <Text style={styles.modalButtonText}>Change Password</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteAccountModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!deleteLoading) {
            setShowDeleteAccountModal(false);
            setDeletePassword('');
            setDeletionReason('');
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.deleteModalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalIcon}>⚠️</Text>
              <Text style={styles.deleteModalTitle}>Delete Account?</Text>
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete your account? This action cannot be
                undone and all your data will be permanently deleted.
              </Text>

              {/* Password Input */}
              <View style={styles.deleteInputContainer}>
                <Text style={styles.deleteInputLabel}>
                  Enter your password to confirm
                </Text>
                <TextInput
                  style={styles.deleteInput}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!deleteLoading}
                />
              </View>

              {/* Reason Input (Optional) */}
              <View style={styles.deleteInputContainer}>
                <Text style={styles.deleteInputLabel}>
                  Reason for leaving (optional)
                </Text>
                <TextInput
                  style={[styles.deleteInput, styles.deleteInputMultiline]}
                  placeholder="Help us improve by sharing why you're leaving..."
                  placeholderTextColor="#999"
                  value={deletionReason}
                  onChangeText={setDeletionReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  editable={!deleteLoading}
                />
              </View>

              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={[
                    styles.deleteModalCancelButton,
                    deleteLoading && styles.deleteModalButtonDisabled,
                  ]}
                  onPress={() => {
                    setShowDeleteAccountModal(false);
                    setDeletePassword('');
                    setDeletionReason('');
                  }}
                  disabled={deleteLoading}
                >
                  <Text style={styles.deleteModalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteModalDeleteButton,
                    deleteLoading && styles.deleteModalButtonDisabled,
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.deleteModalDeleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl * 2,
    paddingBottom: theme.spacing.md,
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
  headerTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.alpha,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButtonText: {
    fontSize: 16,
  },
  memberSince: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGroup: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  infoItem: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  editIcon: {
    fontSize: 18,
  },
  changePasswordText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  editContainer: {
    marginTop: theme.spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  editActionButton: {
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
  },
  cancelText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  saveText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  subscriptionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  subscriptionGradient: {
    padding: theme.spacing.lg,
  },
  subscriptionContent: {
    marginBottom: theme.spacing.md,
  },
  subscriptionBadge: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  subscriptionTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  subscriptionDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  subscriptionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subscriptionMetaText: {
    fontSize: theme.fonts.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  manageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  manageButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
  },
  switchPlanContainer: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  switchPlanLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  switchPlanButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  switchPlanButtonDisabled: {
    opacity: 0.6,
  },
  switchPlanGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  switchPlanButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  dangerZone: {
    alignItems: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: theme.spacing.sm,
  },
  dangerButtonIcon: {
    fontSize: 20,
  },
  dangerButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  dangerWarning: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
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
  modalBody: {
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalButton: {
    margin: theme.spacing.lg,
  },
  modalButtonGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  modalButtonInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg - 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  deleteModalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  deleteModalIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  deleteModalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  deleteModalText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  deleteModalDeleteButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteModalDeleteText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  deleteModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  deleteInputContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  deleteInputLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  deleteInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
  },
  deleteInputMultiline: {
    minHeight: 80,
    paddingTop: theme.spacing.md,
  },
  deleteModalButtonDisabled: {
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  coachingContent: {
    gap: theme.spacing.sm,
  },
  coachingCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  coachingCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: theme.borderRadius.lg,
  },
  coachingIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  coachingInfo: {
    flex: 1,
  },
  coachingLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coachingName: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
  },
  coachingEmpty: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  coachingEmptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  coachingEmptyText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  exploreCoachingButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  exploreCoachingText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
});

export default AccountScreen;
