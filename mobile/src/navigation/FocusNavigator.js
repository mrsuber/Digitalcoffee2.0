import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Focus screens
import FocusLauncherScreen from '../screens/FocusLauncherScreen';
import AudioPlayerScreen from '../screens/AudioPlayerScreen';
import FocusTimerScreen from '../screens/FocusTimerScreen';
import BreathingGuideScreen from '../screens/BreathingGuideScreen';

const Stack = createStackNavigator();

const FocusNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0e27' },
      }}
    >
      <Stack.Screen name="FocusLauncher" component={FocusLauncherScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="FocusTimer" component={FocusTimerScreen} />
      <Stack.Screen name="BreathingGuide" component={BreathingGuideScreen} />
    </Stack.Navigator>
  );
};

export default FocusNavigator;
