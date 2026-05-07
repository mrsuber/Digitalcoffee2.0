import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

// Import AuthContext
import { AuthProvider } from './src/context/AuthContext';

// Import screens with error boundaries
let SplashScreen, AuthScreen, ForgotPasswordScreen, ResetPasswordScreen, IntroScreen, MoodCheckScreen, MindModeScreen, MainNavigator;

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

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <NavigationContainer>
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
