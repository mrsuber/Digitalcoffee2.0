import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Library screens
import LibraryScreen from '../screens/LibraryScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import AudioLibraryScreen from '../screens/AudioLibraryScreen';
import JournalScreen from '../screens/JournalScreen';
import BrainwaveInsightsScreen from '../screens/BrainwaveInsightsScreen';

const Stack = createStackNavigator();

const LibraryNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0a0e27' },
      }}
    >
      <Stack.Screen name="LibraryHome" component={LibraryScreen} />
      <Stack.Screen name="Courses" component={CoursesScreen} />
      <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
      <Stack.Screen name="AudioLibrary" component={AudioLibraryScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="BrainwaveInsights" component={BrainwaveInsightsScreen} />
    </Stack.Navigator>
  );
};

export default LibraryNavigator;
