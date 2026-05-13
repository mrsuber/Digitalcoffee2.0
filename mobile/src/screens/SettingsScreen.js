import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';

export const SettingsScreen = ({ navigation }) => {
  const [skipMoodCheck, setSkipMoodCheck] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [downloadOverWifi, setDownloadOverWifi] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleSkipMoodCheckToggle = async (value) => {
    setSkipMoodCheck(value);
    try {
      await AsyncStorage.setItem('skipMoodCheck', value.toString());
    } catch (error) {
      console.error('Error saving skip mood check preference:', error);
    }
  };

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    console.log('Clear cache');
  };

  const handleResetSettings = () => {
    // TODO: Show confirmation dialog
    console.log('Reset settings');
  };

  const renderSettingItem = (title, subtitle, value, onValueChange, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3e3e3e', true: theme.colors.alpha }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
      />
    </View>
  );

  const renderActionItem = (title, subtitle, onPress, icon, destructive = false) => (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingInfo}>
          <Text
            style={[
              styles.settingTitle,
              destructive && styles.settingTitleDestructive,
            ]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Text style={styles.actionArrow}>→</Text>
    </TouchableOpacity>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              'Skip Mood Check',
              'Go directly to mind mode selection',
              skipMoodCheck,
              handleSkipMoodCheckToggle,
              '😌'
            )}
            {renderSettingItem(
              'Dark Mode',
              'Use dark theme throughout the app',
              darkMode,
              setDarkMode,
              '🌙'
            )}
            {renderSettingItem(
              'Sound Effects',
              'Play sounds for interactions',
              soundEffects,
              setSoundEffects,
              '🔊'
            )}
            {renderSettingItem(
              'Auto-Play Next',
              'Automatically play next session',
              autoPlay,
              setAutoPlay,
              '⏭️'
            )}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              'Push Notifications',
              'Receive notifications from the app',
              notifications,
              setNotifications,
              '🔔'
            )}
            {renderSettingItem(
              'Daily Reminder',
              'Remind me to practice daily',
              dailyReminder,
              setDailyReminder,
              '⏰'
            )}
          </View>
        </View>

        {/* Audio & Downloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Downloads</Text>
          <View style={styles.settingsGroup}>
            {renderActionItem(
              'Audio Quality',
              'High',
              () => console.log('Audio quality'),
              '🎵'
            )}
            {renderSettingItem(
              'Download Over WiFi Only',
              'Save mobile data',
              downloadOverWifi,
              setDownloadOverWifi,
              '📶'
            )}
            {renderActionItem(
              'Downloaded Content',
              'Manage offline audio',
              () => console.log('Downloaded content'),
              '⬇️'
            )}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsGroup}>
            {renderActionItem(
              'Account Details',
              'Manage your profile',
              () => navigation.navigate('Account'),
              '👤'
            )}
            {renderActionItem(
              'Subscription',
              'Premium',
              () => console.log('Subscription'),
              '💎'
            )}
            {renderActionItem(
              'Privacy Policy',
              'View our privacy policy',
              () => console.log('Privacy policy'),
              '🔒'
            )}
            {renderActionItem(
              'Terms of Service',
              'View terms and conditions',
              () => console.log('Terms'),
              '📄'
            )}
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <View style={styles.settingsGroup}>
            {renderActionItem(
              'Clear Cache',
              'Free up storage space',
              handleClearCache,
              '🗑️'
            )}
            {renderActionItem(
              'Export Data',
              'Download your data',
              () => console.log('Export data'),
              '📤'
            )}
          </View>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <View style={styles.settingsGroup}>
            {renderActionItem(
              'Reset Settings',
              'Restore default settings',
              handleResetSettings,
              '⚙️',
              true
            )}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingsGroup}>
            {renderActionItem(
              'App Version',
              'v2.0.0 (Build 42)',
              () => console.log('Version'),
              'ℹ️'
            )}
            {renderActionItem(
              'Help & Support',
              'Get help or send feedback',
              () => console.log('Help'),
              '❓'
            )}
            {renderActionItem(
              'Rate Digital Coffee',
              'Share your experience',
              () => console.log('Rate app'),
              '⭐'
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => console.log('Logout')}
            >
              <Text style={styles.dangerButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  settingsGroup: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingTitleDestructive: {
    color: '#ef4444',
  },
  settingSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  actionArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  dangerZone: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
  },
  dangerButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: '#ef4444',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
