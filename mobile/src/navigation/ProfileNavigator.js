import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Profile screens
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountScreen from '../screens/AccountScreen';
import MoodHistoryScreen from '../screens/MoodHistoryScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';

// Import Video Calling screens (named exports)
import { BookCallScreen } from '../screens/BookCallScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { WaitingRoomScreen } from '../screens/WaitingRoomScreen';
import { VideoCallScreen } from '../screens/VideoCallScreen';
import { AvailabilitySetupScreen } from '../screens/AvailabilitySetupScreen';

const Stack = createStackNavigator();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0e27' },
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="MoodHistory" component={MoodHistoryScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />

      {/* Video Calling Screens */}
      <Stack.Screen name="BookCall" component={BookCallScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="WaitingRoom" component={WaitingRoomScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="AvailabilitySetup" component={AvailabilitySetupScreen} />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;
