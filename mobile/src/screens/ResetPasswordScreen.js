import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '../utils/theme';
import { authAPI } from '../services/api';
import BrainPulse from '../components/BrainPulse';
import StarField from '../components/StarField';
import { useAlert } from '../components/CustomAlert';

export const ResetPasswordScreen = ({ route, navigation }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showAlert, AlertComponent } = useAlert();

  // Get token from route params or deep link
  const token = route.params?.token || '';

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animations
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.spring(slideUp, {
      toValue: 0,
      tension: 100,
      friction: 15,
      useNativeDriver: true,
    }).start();

    // Verify token on mount
    verifyToken();
  }, []);

  const verifyToken = async () => {
    if (!token) {
      showAlert({
        type: 'error',
        title: 'Invalid Link',
        message: 'This password reset link is invalid. Please request a new one.',
        buttons: [
          {
            text: 'Back to Login',
            onPress: () => navigation.navigate('Auth'),
          },
        ],
      });
      return;
    }

    try {
      const result = await authAPI.verifyResetToken(token);
      if (result.success) {
        setTokenValid(true);
      } else {
        showAlert({
          type: 'error',
          title: 'Expired Link',
          message: 'This password reset link has expired. Please request a new one.',
          buttons: [
            {
              text: 'Request New Link',
              onPress: () => navigation.navigate('ForgotPassword'),
            },
            {
              text: 'Back to Login',
              style: 'cancel',
              onPress: () => navigation.navigate('Auth'),
            },
          ],
        });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      showAlert({
        type: 'error',
        title: 'Invalid Link',
        message: 'This password reset link is invalid or has expired. Please request a new one.',
        buttons: [
          {
            text: 'Request New Link',
            onPress: () => navigation.navigate('ForgotPassword'),
          },
          {
            text: 'Back to Login',
            style: 'cancel',
            onPress: () => navigation.navigate('Auth'),
          },
        ],
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!newPassword || !confirmPassword) {
      showAlert({
        type: 'error',
        title: 'Fields Required',
        message: 'Please fill in all password fields',
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        type: 'error',
        title: 'Passwords Don\'t Match',
        message: 'Please make sure both passwords match',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.resetPassword(token, newPassword);

      if (result.success) {
        showAlert({
          type: 'success',
          title: 'Password Reset!',
          message: 'Your password has been reset successfully. You can now login with your new password.',
          buttons: [
            {
              text: 'Go to Login',
              onPress: () => navigation.navigate('Auth'),
            },
          ],
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Reset Failed',
          message: result.message || 'Failed to reset password. Please try again.',
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const animatedStyle = {
    opacity: fadeIn,
    transform: [{ translateY: slideUp }],
  };

  if (verifying) {
    return (
      <LinearGradient
        colors={['#000614', '#000614', '#000614']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Custom Alert */}
        <AlertComponent />

        <StarField starCount={150} />
        <View style={styles.centerContent}>
          <BrainPulse size={100} pulseSpeed={1500} />
          <Text style={styles.verifyingText}>Verifying reset link...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!tokenValid) {
    return null; // Alert will handle navigation
  }

  return (
    <LinearGradient
      colors={['#000614', '#000614', '#000614']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Custom Alert */}
      <AlertComponent />

      {/* Starfield background */}
      <StarField starCount={150} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Brain pulse with glow effect */}
          <View style={styles.brainWrapper}>
            <BrainPulse size={120} pulseSpeed={1800} />
          </View>

          {/* Title section */}
          <View style={styles.titleContainer}>
            <MaskedView
              maskElement={
                <Text style={styles.title}>Reset Password</Text>
              }
            >
              <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientText}
              >
                <Text style={[styles.title, { opacity: 0 }]}>
                  Reset Password
                </Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.subtitle}>
              Enter your new password below.
            </Text>
          </View>

          {/* Form section */}
          <View style={styles.formContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor={theme.colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              Password must be at least 6 characters long
            </Text>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradientBorder}
              >
                <View style={styles.submitInner}>
                  <Text style={styles.submitText}>
                    {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Auth')}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>
                ← Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    marginTop: theme.spacing.xl,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  brainWrapper: {
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  gradientText: {
    paddingVertical: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md + 2,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  passwordInput: {
    backgroundColor: 'rgba(26, 20, 72, 0.6)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md + 2,
    paddingRight: 50,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  eyeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  eyeIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  hint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradientBorder: {
    padding: 2,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
  },
  submitText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  backButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ResetPasswordScreen;
