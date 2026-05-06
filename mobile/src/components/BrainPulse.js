import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../utils/theme';
import BrainLogoSvg from './BrainLogoSvg';

export const BrainPulse = ({ size = 200, pulseSpeed = 2000, glowIntensity = 1 }) => {
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

    // Very slow rotation for subtle effect
    const rotateAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 60000, // 60 seconds for full rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    scaleAnim.start();
    opacityAnim.start();
    rotateAnim.start();

    return () => {
      scaleAnim.stop();
      opacityAnim.stop();
      rotateAnim.stop();
    };
  }, [pulseSpeed, scale, opacity, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [{ scale }, { rotate: spin }],
    opacity,
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow effect */}
      <Animated.View
        style={[
          styles.glowOuter,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: (size * 1.3) / 2,
            opacity: opacity.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.1, 0.3],
            }),
          },
        ]}
      />

      {/* Middle glow ring */}
      <Animated.View
        style={[
          styles.glowMiddle,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: (size * 1.15) / 2,
            opacity: opacity.interpolate({
              inputRange: [0.7, 1],
              outputRange: [0.2, 0.4],
            }),
          },
        ]}
      />

      {/* Main brain logo */}
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <BrainLogoSvg
          size={size}
          color1={theme.colors.alpha}
          color2={theme.colors.theta}
          color3={theme.colors.gamma}
        />
      </Animated.View>

      {/* Inner glow */}
      <Animated.View
        style={[
          styles.glowInner,
          animatedStyle,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
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
    opacity: 0.15,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});

export default BrainPulse;
