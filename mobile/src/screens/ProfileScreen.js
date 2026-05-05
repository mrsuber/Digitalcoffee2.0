import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Auth');
  };

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientMid, theme.colors.gradientEnd]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 20,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  email: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.error,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
