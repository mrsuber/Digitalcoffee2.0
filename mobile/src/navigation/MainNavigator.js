import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';
import HomeNavigator from './HomeNavigator';
import FocusNavigator from './FocusNavigator';
import LibraryNavigator from './LibraryNavigator';
import ProfileNavigator from './ProfileNavigator';

// Import screens with error handling
let ProgressScreen;

try {
  ProgressScreen = require('../screens/ProgressScreen').default;
} catch (e) {
  console.error('Error loading ProgressScreen:', e);
  ProgressScreen = () => (
    <View style={errorStyles.container}>
      <Text style={errorStyles.text}>ProgressScreen Error</Text>
      <Text style={errorStyles.detail}>{e.message}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, focused }) => (
  <View style={[styles.iconContainer, focused && styles.iconFocused]}>
    <View style={focused ? styles.iconGlow : null}>
      {icon}
    </View>
  </View>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.cardBackground,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.colors.alpha,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<HomeIcon color={color} />}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusNavigator}
        options={{
          tabBarLabel: 'Focus',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<FocusIcon color={color} />}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<ProgressIcon color={color} />}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryNavigator}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<LibraryIcon color={color} />}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<ProfileIcon color={color} />}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple icon components
const HomeIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconInner, { borderColor: color }]} />
  </View>
);

const FocusIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconDot, { backgroundColor: color }]} />
  </View>
);

const ProgressIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconSquare, { backgroundColor: color }]} />
  </View>
);

const LibraryIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconStack, { borderColor: color }]} />
  </View>
);

const ProfileIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconCircle, { borderColor: color }]} />
  </View>
);

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#ff0000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detail: {
    color: '#ff6666',
    fontSize: 14,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
  iconGlow: {
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  iconSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  iconStack: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 2,
  },
});

export default MainNavigator;
