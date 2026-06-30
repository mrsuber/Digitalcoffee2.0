import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { notificationService } from './src/services/firebase';
import api from './src/services/api';
import socketService from './src/services/socketService';

// Import AuthContext
import { AuthProvider } from './src/context/AuthContext';

// Import screens with error boundaries
let SplashScreen, AuthScreen, ForgotPasswordScreen, ResetPasswordScreen, IntroScreen, MoodCheckScreen, MindModeScreen, MainNavigator, IncomingCallScreen, WaitingRoomScreen, VideoCallScreen;

try {
  SplashScreen = require('./src/screens/SplashScreen').default;
} catch (e) {
  console.error('Error loading SplashScreen:', e);
  SplashScreen = () => <View style={styles.error}><Text style={styles.errorText}>SplashScreen Error</Text></View>;
}

try {
  AuthScreen = require('./src/screens/AuthScreen').default;
} catch (e) {
  console.error('Error loading AuthScreen:', e);
  AuthScreen = () => <View style={styles.error}><Text style={styles.errorText}>AuthScreen Error</Text></View>;
}

try {
  ForgotPasswordScreen = require('./src/screens/ForgotPasswordScreen').default;
} catch (e) {
  console.error('Error loading ForgotPasswordScreen:', e);
  ForgotPasswordScreen = () => <View style={styles.error}><Text style={styles.errorText}>ForgotPasswordScreen Error</Text></View>;
}

try {
  ResetPasswordScreen = require('./src/screens/ResetPasswordScreen').default;
} catch (e) {
  console.error('Error loading ResetPasswordScreen:', e);
  ResetPasswordScreen = () => <View style={styles.error}><Text style={styles.errorText}>ResetPasswordScreen Error</Text></View>;
}

try {
  IntroScreen = require('./src/screens/IntroScreen').default;
} catch (e) {
  console.error('Error loading IntroScreen:', e);
  IntroScreen = () => <View style={styles.error}><Text style={styles.errorText}>IntroScreen Error</Text></View>;
}

try {
  MoodCheckScreen = require('./src/screens/MoodCheckScreen').default;
} catch (e) {
  console.error('Error loading MoodCheckScreen:', e);
  MoodCheckScreen = () => <View style={styles.error}><Text style={styles.errorText}>MoodCheckScreen Error</Text></View>;
}

try {
  MindModeScreen = require('./src/screens/MindModeScreen').default;
} catch (e) {
  console.error('Error loading MindModeScreen:', e);
  MindModeScreen = () => <View style={styles.error}><Text style={styles.errorText}>MindModeScreen Error</Text></View>;
}

try {
  MainNavigator = require('./src/navigation/MainNavigator').default;
} catch (e) {
  console.error('Error loading MainNavigator:', e);
  MainNavigator = () => <View style={styles.error}><Text style={styles.errorText}>MainNavigator Error</Text></View>;
}

try {
  IncomingCallScreen = require('./src/screens/IncomingCallScreen').default;
} catch (e) {
  console.error('Error loading IncomingCallScreen:', e);
  IncomingCallScreen = () => <View style={styles.error}><Text style={styles.errorText}>IncomingCallScreen Error</Text></View>;
}

try {
  WaitingRoomScreen = require('./src/screens/WaitingRoomScreen').WaitingRoomScreen;
} catch (e) {
  console.error('Error loading WaitingRoomScreen:', e);
  WaitingRoomScreen = () => <View style={styles.error}><Text style={styles.errorText}>WaitingRoomScreen Error</Text></View>;
}

try {
  VideoCallScreen = require('./src/screens/VideoCallScreen').default;
} catch (e) {
  console.error('Error loading VideoCallScreen:', e);
  VideoCallScreen = () => <View style={styles.error}><Text style={styles.errorText}>VideoCallScreen Error</Text></View>;
}

let CallDetailScreen;
try {
  CallDetailScreen = require('./src/screens/CallDetailScreen').default;
} catch (e) {
  console.error('Error loading CallDetailScreen:', e);
  CallDetailScreen = () => <View style={styles.error}><Text style={styles.errorText}>CallDetailScreen Error</Text></View>;
}

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef(null);

  useEffect(() => {
    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    // Setup push notifications
    setupPushNotifications();

    return () => {
      clearTimeout(timer);
      notificationService.removeNotificationListeners();
    };
  }, []);

  const setupPushNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        // Save token to backend
        await api.saveFCMToken(token);
      }

      // Setup notification listeners
      notificationService.setupNotificationListeners(
        handleNotificationReceived,
        handleNotificationResponse
      );
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const handleNotificationReceived = (notification) => {
    console.log('Notification received:', notification);
    const data = notification.request.content.data;

    // Handle incoming call notification
    if (data.type === 'incoming_call' && navigationRef.current) {
      navigationRef.current.navigate('IncomingCall', {
        sessionId: data.sessionId,
        coachName: data.coachName,
        roomId: data.roomId,
      });
    }
  };

  const handleNotificationResponse = (response) => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;

    // Handle incoming call notification tap
    if (data.type === 'incoming_call' && navigationRef.current) {
      navigationRef.current.navigate('IncomingCall', {
        sessionId: data.sessionId,
        coachName: data.coachName,
        roomId: data.roomId,
      });
    }
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider navigationRef={navigationRef}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#0a0e27' }
          }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="MoodCheck" component={MoodCheckScreen} />
          <Stack.Screen name="MindModeSelection" component={MindModeScreen} />
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="IncomingCall"
            component={IncomingCallScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="WaitingRoom"
            component={WaitingRoomScreen}
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="VideoCallScreen"
            component={VideoCallScreen}
            options={{ presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="CallDetail"
            component={CallDetailScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    backgroundColor: '#0a0e27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 18,
  },
});
