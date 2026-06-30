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
import { useAuth } from '../context/AuthContext';
import BrainPulse from '../components/BrainPulse';
import StarField from '../components/StarField';
import { useAlert } from '../components/CustomAlert';

export const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

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
  }, []);

  const handleSubmit = async () => {
    // Validate email
    if (!email) {
      showAlert({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter your email address',
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
      });
      return;
    }

    // Validate password
    if (!password) {
      showAlert({
        type: 'error',
        title: 'Password Required',
        message: 'Please enter your password',
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Validate name for signup
    if (!isLogin && !name) {
      showAlert({
        type: 'error',
        title: 'Name Required',
        message: 'Please enter your full name',
      });
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        // Always register as free, users can upgrade later
        result = await register(email, password, name, 'free');
      }

      if (result.success) {
        showAlert({
          type: 'success',
          title: isLogin ? 'Welcome Back!' : 'Account Created!',
          message: isLogin
            ? 'You have successfully logged in'
            : 'Your account has been created successfully',
          buttons: [
            {
              text: 'Continue',
              onPress: () => navigation.replace('MoodCheck'),
            },
          ],
        });
      } else {
        // Handle specific error messages
        let errorTitle = 'Authentication Failed';
        let errorMessage = result.message || 'Please check your credentials and try again';

        if (result.message?.toLowerCase().includes('email')) {
          if (result.message?.toLowerCase().includes('already exists')) {
            errorTitle = 'Email Already Registered';
            errorMessage = 'An account with this email already exists. Please login instead.';
          } else if (result.message?.toLowerCase().includes('not found') ||
                     result.message?.toLowerCase().includes('invalid')) {
            errorTitle = 'Email Not Found';
            errorMessage = 'No account found with this email address. Please sign up first.';
          }
        } else if (result.message?.toLowerCase().includes('password')) {
          errorTitle = 'Incorrect Password';
          errorMessage = 'The password you entered is incorrect. Please try again.';
        }

        showAlert({
          type: 'error',
          title: errorTitle,
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error('Auth error:', error);

      // Handle network errors
      if (error.message?.toLowerCase().includes('network')) {
        showAlert({
          type: 'error',
          title: 'Connection Error',
          message: 'Unable to connect to server. Please check your internet connection.',
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again later.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const animatedStyle = {
    opacity: fadeIn,
    transform: [{ translateY: slideUp }],
  };

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
            <BrainPulse size={160} pulseSpeed={1800} />
          </View>

          {/* Title section */}
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Digital </Text>
              <MaskedView
                maskElement={
                  <Text style={[styles.title, styles.titleAccent]}>Coffee</Text>
                }
              >
                <LinearGradient
                  colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientText}
                >
                  <Text style={[styles.title, styles.titleAccent, { opacity: 0 }]}>
                    Coffee
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>
            <Text style={styles.tagline}>TAKE CONTROL OF YOUR MIND</Text>
          </View>

          {/* Form section */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <Animated.View style={animatedStyle}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={theme.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </Animated.View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            {isLogin && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {/* Gradient border layer */}
              <LinearGradient
                colors={['#4c1d95', '#5b21b6', '#7c3aed', '#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradientBorder}
              >
                {/* Inner transparent background */}
                <View style={styles.submitInner}>
                  <Text style={styles.submitText}>
                    {loading ? 'PLEASE WAIT...' : isLogin ? 'LOGIN' : 'SIGN UP'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchTextBold}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </Text>
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
  brainWrapper: {
    marginBottom: theme.spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 3,
  },
  titleAccent: {
    color: theme.colors.alpha,
  },
  gradientText: {
    paddingVertical: 2,
  },
  tagline: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '300',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  forgotPasswordText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradientBorder: {
    padding: 2, // 2px border width
    borderRadius: 30,
    alignItems: 'center',
  },
  submitInner: {
    backgroundColor: 'rgba(0, 6, 20, 0.6)', // Semi-transparent dark background
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
  switchButton: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  switchText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  switchTextBold: {
    color: theme.colors.alpha,
    fontWeight: 'bold',
  },
  subscriptionContainer: {
    marginVertical: theme.spacing.lg,
  },
  subscriptionLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subscriptionOptions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  subscriptionOption: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  subscriptionOptionSelected: {
    borderColor: theme.colors.alpha,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  subscriptionEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  subscriptionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs / 2,
  },
  subscriptionTitleSelected: {
    color: theme.colors.alpha,
  },
  subscriptionPrice: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  subscriptionFeature: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs / 2,
  },
});

export default AuthScreen;
