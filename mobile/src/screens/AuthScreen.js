import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import BrainPulse from '../components/BrainPulse';

export const AuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          setLoading(false);
          return;
        }
        result = await register(email, password, name);
      }

      if (result.success) {
        navigation.replace('MoodCheck');
      } else {
        Alert.alert('Error', result.message || 'Authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
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
      colors={['#0a0e27', '#1a1448', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
            <Text style={styles.title}>
              Digital <Text style={styles.titleAccent}>Coffee</Text>
            </Text>
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

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.alpha, theme.colors.theta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Text style={styles.submitText}>
                  {loading ? 'PLEASE WAIT...' : isLogin ? 'LOGIN' : 'SIGN UP'}
                </Text>
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
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 3,
    marginBottom: theme.spacing.sm,
  },
  titleAccent: {
    color: theme.colors.alpha,
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
  submitButton: {
    marginTop: theme.spacing.lg,
    shadowColor: theme.colors.alpha,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    paddingVertical: theme.spacing.md + 2,
    borderRadius: theme.borderRadius.lg,
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
});

export default AuthScreen;
