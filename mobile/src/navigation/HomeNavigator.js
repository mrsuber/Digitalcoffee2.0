import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';

// Import Home screens
import DashboardScreen from '../screens/DashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfessionalCoachesScreen from '../screens/ProfessionalCoachesScreen';
import CoachProfileScreen from '../screens/CoachProfileScreen';
import MessagingScreen from '../screens/MessagingScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';

// Safely import Video Calling screens with error handling
let BookCallScreen, MyBookingsScreen, WaitingRoomScreen, VideoCallScreen, AvailabilitySetupScreen;

try {
  BookCallScreen = require('../screens/BookCallScreen').BookCallScreen;
  MyBookingsScreen = require('../screens/MyBookingsScreen').MyBookingsScreen;
  WaitingRoomScreen = require('../screens/WaitingRoomScreen').WaitingRoomScreen;
  VideoCallScreen = require('../screens/VideoCallScreen').VideoCallScreen;
  AvailabilitySetupScreen = require('../screens/AvailabilitySetupScreen').AvailabilitySetupScreen;
} catch (error) {
  console.warn('Video calling screens not available:', error.message);

  // Fallback component for video calling features
  const VideoFeatureUnavailable = () => (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Video Calling Unavailable</Text>
      <Text style={errorStyles.message}>
        Video calling requires a custom development build. Please use a built version of the app.
      </Text>
    </View>
  );

  BookCallScreen = VideoFeatureUnavailable;
  MyBookingsScreen = VideoFeatureUnavailable;
  WaitingRoomScreen = VideoFeatureUnavailable;
  VideoCallScreen = VideoFeatureUnavailable;
  AvailabilitySetupScreen = VideoFeatureUnavailable;
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});

const Stack = createStackNavigator();

const HomeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0e27' },
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ProfessionalCoaches" component={ProfessionalCoachesScreen} />
      <Stack.Screen name="CoachProfile" component={CoachProfileScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />

      {/* Video Calling Screens */}
      <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
      <Stack.Screen name="BookCall" component={BookCallScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="AvailabilitySetup" component={AvailabilitySetupScreen} />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
