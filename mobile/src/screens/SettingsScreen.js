import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [skipMoodCheck, setSkipMoodCheck] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [downloadOverWifi, setDownloadOverWifi] = useState(true);

  // Helper function to get user-specific storage key
  const getUserKey = (key) => {
    return user?.id ? `${key}_user_${user.id}` : key;
  };

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      const [
        skipMoodCheckValue,
        soundEffectsValue,
        autoPlayValue,
        downloadOverWifiValue,
      ] = await AsyncStorage.multiGet([
        getUserKey('skipMoodCheck'),
        getUserKey('soundEffects'),
        getUserKey('autoPlay'),
        getUserKey('downloadOverWifi'),
      ]);

      if (skipMoodCheckValue[1] !== null) {
        setSkipMoodCheck(skipMoodCheckValue[1] === 'true');
      }
      if (soundEffectsValue[1] !== null) {
        setSoundEffects(soundEffectsValue[1] === 'true');
      }
      if (autoPlayValue[1] !== null) {
        setAutoPlay(autoPlayValue[1] === 'true');
      }
      if (downloadOverWifiValue[1] !== null) {
        setDownloadOverWifi(downloadOverWifiValue[1] === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSkipMoodCheckToggle = async (value) => {
    setSkipMoodCheck(value);
    try {
      await AsyncStorage.setItem(getUserKey('skipMoodCheck'), value.toString());
    } catch (error) {
      console.error('Error saving skip mood check preference:', error);
    }
  };

  const handleSoundEffectsToggle = async (value) => {
    setSoundEffects(value);
    try {
      await AsyncStorage.setItem(getUserKey('soundEffects'), value.toString());
    } catch (error) {
      console.error('Error saving sound effects preference:', error);
    }
  };

  const handleAutoPlayToggle = async (value) => {
    setAutoPlay(value);
    try {
      await AsyncStorage.setItem(getUserKey('autoPlay'), value.toString());
    } catch (error) {
      console.error('Error saving auto play preference:', error);
    }
  };

  const handleDownloadOverWifiToggle = async (value) => {
    setDownloadOverWifi(value);
    try {
      await AsyncStorage.setItem(getUserKey('downloadOverWifi'), value.toString());
    } catch (error) {
      console.error('Error saving download over wifi preference:', error);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will free up storage space but may slow down the app temporarily.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear specific cache items but keep authentication
              const keysToRemove = [
                'audioCache',
                'courseCache',
                'progressCache',
                'imageCache',
              ];

              await AsyncStorage.multiRemove(keysToRemove);

              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reset to default values
              setSkipMoodCheck(false);
              setSoundEffects(true);
              setAutoPlay(false);
              setDownloadOverWifi(true);

              // Persist default values
              await AsyncStorage.multiSet([
                ['skipMoodCheck', 'false'],
                ['soundEffects', 'true'],
                ['autoPlay', 'false'],
                ['downloadOverWifi', 'true'],
              ]);

              Alert.alert('Success', 'Settings reset to defaults');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
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

  const renderActionItem = (title, subtitle, onPress, icon, destructive = false) => {
    const content = (
      <View style={styles.actionItem}>
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
        {onPress && <Text style={styles.actionArrow}>→</Text>}
      </View>
    );

    if (!onPress) {
      return content;
    }

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
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
              'Sound Effects',
              'Play sounds for interactions',
              soundEffects,
              handleSoundEffectsToggle,
              '🔊'
            )}
            {renderSettingItem(
              'Auto-Play Next',
              'Automatically play next session',
              autoPlay,
              handleAutoPlayToggle,
              '⏭️'
            )}
          </View>
        </View>

        {/* Audio & Downloads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Downloads</Text>
          <View style={styles.settingsGroup}>
            {renderSettingItem(
              'Download Over WiFi Only',
              'Save mobile data',
              downloadOverWifi,
              handleDownloadOverWifiToggle,
              '📶'
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
              null,
              'ℹ️'
            )}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.dangerZone}>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleLogout}
              activeOpacity={0.7}
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
