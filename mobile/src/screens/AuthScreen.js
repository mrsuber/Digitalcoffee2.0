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
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import BrainPulse from '../components/BrainPulse';
import StarField from '../components/StarField';

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
      colors={['#000614', '#000614', '#000614']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
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
});

export default AuthScreen;
