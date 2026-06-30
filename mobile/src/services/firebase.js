/**
 * Digital Coffee 2.0 - Notification Service
 * Handles push notifications using Expo Notifications
 *
 * Setup Instructions:
 * 1. For Firebase Cloud Messaging:
 *    - Add google-services.json (Android) to android/app/
 *    - Add GoogleService-Info.plist (iOS) to ios/
 *    - Configure app.json with FCM credentials
 * 2. Test notifications in development with Expo Go
 * 3. Production requires EAS Build
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Request notification permissions and get FCM/Expo Push Token
   */
  async registerForPushNotifications() {
    try {
      let token;

      // Setup notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        // Incoming call channel with higher priority
        await Notifications.setNotificationChannelAsync('incoming-call', {
          name: 'Incoming Calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 500, 500],
          lightColor: '#10b981',
          sound: 'default',
          enableVibrate: true,
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }

        try {
          // Try to get device push token (FCM for Android, APNS for iOS)
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = deviceToken.data;
          console.log('📱 FCM/APNS Token:', token);
        } catch (deviceTokenError) {
          console.log('Device token not available, falling back to Expo token');
          // Fallback to Expo Push Token
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id',
          })).data;
          console.log('📱 Expo Push Token:', token);
        }

        this.expoPushToken = token;
        await AsyncStorage.setItem('expoPushToken', token);
        await AsyncStorage.setItem('fcmToken', token); // Store as FCM token

        return token;
      } else {
        console.log('Must use physical device for Push Notifications');
        return null;
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Get stored push token
   */
  async getToken() {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    const stored = await AsyncStorage.getItem('expoPushToken');
    if (stored) {
      this.expoPushToken = stored;
      return stored;
    }

    return null;
  }

  /**
   * Set up listeners for notifications
   */
  setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when a user taps on or interacts with a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleNotification(title, body, data = {}, seconds = 1) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: {
          seconds,
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('Error setting badge count:', error);
      return false;
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge() {
    return this.setBadgeCount(0);
  }

  /**
   * Clear push token
   */
  async clearToken() {
    this.expoPushToken = null;
    await AsyncStorage.removeItem('expoPushToken');
  }

  /**
   * Check if device supports notifications
   */
  isSupported() {
    return Device.isDevice;
  }
}

export const notificationService = new NotificationService();
