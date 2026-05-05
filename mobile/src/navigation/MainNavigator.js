import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../utils/theme';

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
        component={DashboardScreen}
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
        name="Plan"
        component={CoursesScreen}
        options={{
          tabBarLabel: 'Plan',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              icon={<PlanIcon color={color} />}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={ProgressScreen}
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
        name="Profile"
        component={ProfileScreen}
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

// Simple icon components (you can replace with actual icons later)
const HomeIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconInner, { borderColor: color }]} />
  </View>
);

const PlanIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconSquare, { backgroundColor: color }]} />
  </View>
);

const FocusIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconDot, { backgroundColor: color }]} />
  </View>
);

const ProfileIcon = ({ color }) => (
  <View style={[styles.icon, { backgroundColor: color + '30' }]}>
    <View style={[styles.iconCircle, { borderColor: color }]} />
  </View>
);

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
});

export default MainNavigator;
