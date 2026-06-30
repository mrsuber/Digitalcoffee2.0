import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import Library screens
import LibraryScreen from '../screens/LibraryScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import AudioLibraryScreen from '../screens/AudioLibraryScreen';
import JournalScreen from '../screens/JournalScreen';
import BrainwaveInsightsScreen from '../screens/BrainwaveInsightsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CoachingHubScreen from '../screens/CoachingHubScreen';
import MyStudentsScreen from '../screens/MyStudentsScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import CoachRequestsScreen from '../screens/CoachRequestsScreen';
import MessagingScreen from '../screens/MessagingScreen';

const Stack = createStackNavigator();

const LibraryNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Courses"
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
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CoachingHub" component={CoachingHubScreen} />
      <Stack.Screen name="MyStudents" component={MyStudentsScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="CoachRequests" component={CoachRequestsScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
    </Stack.Navigator>
  );
};

export default LibraryNavigator;
