import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { theme } from '../utils/theme';

// TODO: Replace with actual brain logo image
// For now, we'll use a placeholder that shows we need the image
const BRAIN_LOGO_PLACEHOLDER = 'https://via.placeholder.com/200x200/0a0e27/0d9488?text=Brain+Logo';

export const BrainPulse = ({ size = 200, pulseSpeed = 2000, logoSource }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation - scale
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: pulseSpeed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: pulseSpeed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation - opacity
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: pulseSpeed * 0.8,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: pulseSpeed * 0.8,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scaleAnim.start();
    opacityAnim.start();

    return () => {
      scaleAnim.stop();
      opacityAnim.stop();
    };
  }, [pulseSpeed, scale, opacity]);

  const animatedStyle = {
    transform: [{ scale }],
    opacity,
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          styles.glowOuter,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            opacity: opacity.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.15, 0.35],
            }),
          },
        ]}
      />

      {/* Middle glow ring */}
      <Animated.View
        style={[
          styles.glowMiddle,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            opacity: opacity.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.25, 0.45],
            }),
          },
        ]}
      />

      {/* Main brain logo */}
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image
          source={
            logoSource || require('../../assets/brain-logo.png') // Will use local file when available
          }
          style={{
            width: size,
            height: size,
          }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Inner glow */}
      <Animated.View
        style={[
          styles.glowInner,
          animatedStyle,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
    backgroundColor: theme.colors.alpha,
  },
  glowMiddle: {
    position: 'absolute',
    backgroundColor: theme.colors.theta,
  },
  glowInner: {
    position: 'absolute',
    backgroundColor: theme.colors.beta,
    opacity: 0.2,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default BrainPulse;
