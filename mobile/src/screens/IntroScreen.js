import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { theme } from '../utils/theme';
import BrainPulse from '../components/BrainPulse';
import StarField from '../components/StarField';

const { width, height } = Dimensions.get('window');

export const IntroScreen = ({ navigation }) => {
  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textFadeIn = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Delay text and image animations
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textFadeIn, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // TODO: Re-enable auto-transition after design is finalized
    // Navigate to mood check after 3 seconds
    // const timer = setTimeout(() => {
    //   navigation.replace('MoodCheck');
    // }, 3000);

    // return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Star field background */}
      <StarField />

      {/* Gradient overlay */}
      <LinearGradient
        colors={[
          theme.colors.gradientStart,
          'rgba(0, 6, 20, 0.8)',
          'rgba(0, 6, 20, 0.6)',
        ]}
        style={styles.gradientOverlay}
      />

      {/* Meditating figure background */}
      <Animated.View
        style={[
          styles.meditatingContainer,
          {
            opacity: imageOpacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/meditating.png')}
          style={styles.meditatingImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Content */}
      <View style={styles.content}>
        {/* Animated Brain Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeIn,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <BrainPulse size={160} pulseSpeed={1800} />
        </Animated.View>

        {/* Title section */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: textFadeIn,
            },
          ]}
        >
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
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  meditatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  meditatingImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
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
});

export default IntroScreen;
