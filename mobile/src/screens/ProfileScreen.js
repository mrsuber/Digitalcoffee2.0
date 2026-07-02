import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { progressAPI, subscriptionAPI } from '../services/api';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    loadUserStats();
    loadSubscriptionStatus();
  }, []);

  // Refresh user data when screen comes into focus (e.g., after upgrading to premium)
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      loadSubscriptionStatus();
    }, [])
  );

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const response = await progressAPI.getOverview(30);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionAPI.getStatus();
      if (response.success) {
        setSubscriptionStatus(response.data.subscription_status);

        // Update user object in storage with subscription info
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const updatedUser = {
            ...JSON.parse(userData),
            subscription_status: response.data.subscription_status,
            subscription_type: response.data.subscription_status // For backward compatibility
          };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          // Trigger a refresh to update context
          await refreshUser();
        }
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Auth');
  };

  // Debug: Log user subscription info
  useEffect(() => {
    console.log('User object:', user);
    console.log('Subscription type:', user?.subscription_type);
    console.log('Subscription status:', user?.subscription_status);
  }, [user]);

  // Video calling menu items (conditional based on subscription)
  // Check both subscription_type and subscription_status for compatibility
  const hasPremiumAccess =
    user?.subscription_type === 'premium' ||
    user?.subscription_type === 'professional' ||
    user?.subscription_status === 'premium' ||
    user?.subscription_status === 'professional';

  const videoCallMenuItems = hasPremiumAccess
    ? [
        { id: 'bookings', icon: '📹', title: 'My Video Sessions', subtitle: 'View your call bookings', screen: 'MyBookings' },
        { id: 'bookCall', icon: '📞', title: 'Book Video Call', subtitle: 'Schedule a session with a coach', screen: 'BookCall' },
      ]
    : [];

  // Coach-only menu items
  const coachMenuItems = user?.is_coach
    ? [
        { id: 'availability', icon: '🗓️', title: 'My Availability', subtitle: 'Set your coaching hours', screen: 'AvailabilitySetup' },
      ]
    : [];

  const menuItems = [
    ...videoCallMenuItems,
    ...coachMenuItems,
    { id: 'account', icon: '👤', title: 'Account Details', subtitle: 'Manage your profile', screen: 'Account' },
    { id: 'mood', icon: '😌', title: 'Mood History', subtitle: 'View your mood trends', screen: 'MoodHistory' },
    { id: 'settings', icon: '⚙️', title: 'Settings', subtitle: 'App preferences', screen: 'Settings' },
    { id: 'help', icon: '❓', title: 'Help & Support', subtitle: 'Get help or send feedback', screen: 'Help' },
  ];

  const formatTotalTime = (minutes) => {
    if (!minutes) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientMid, theme.colors.gradientEnd]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#4c1d95', '#7c3aed', '#0d9488']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {(user?.name || 'User')
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </LinearGradient>
          <Text style={styles.title}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.alpha} />
            </View>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.total_sessions || 0}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.streak_days || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatTotalTime(stats?.total_minutes || 0)}</Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </>
          )}
        </View>

        {/* Premium Upgrade Button */}
        {!hasPremiumAccess && (
          <TouchableOpacity
            style={styles.premiumButton}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#D4AF37', '#C19A2E']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.premiumIcon}>👑</Text>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>Unlock all features & content</Text>
              </View>
              <Text style={styles.premiumArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  email: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  premiumButton: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  premiumIcon: {
    fontSize: 32,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  premiumArrow: {
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  menuArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
