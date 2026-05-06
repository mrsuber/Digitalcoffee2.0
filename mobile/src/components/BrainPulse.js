import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

export const BrainPulse = ({ size = 200, pulseSpeed = 2000, glowIntensity = 1 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Pulse animation
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
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

    // Glow animation
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: pulseSpeed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: pulseSpeed,
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
      {/* Outer glow rings */}
      <Animated.View
        style={[
          styles.ring,
          animatedStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: theme.colors.alpha,
          },
        ]}
      />

      {/* Middle ring */}
      <Animated.View
        style={[
          styles.ring,
          animatedStyle,
          {
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: (size * 0.85) / 2,
            borderWidth: 1.5,
            borderColor: theme.colors.theta,
          },
        ]}
      />

      {/* Core gradient circle */}
      <Animated.View style={[animatedStyle, styles.core]}>
        <LinearGradient
          colors={[theme.colors.alpha, theme.colors.theta, theme.colors.beta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientCore,
            {
              width: size * 0.7,
              height: size * 0.7,
              borderRadius: (size * 0.7) / 2,
            },
          ]}
        />
      </Animated.View>

      {/* Inner pulse */}
      <Animated.View
        style={[
          styles.innerPulse,
          animatedStyle,
          {
            width: size * 0.4,
            height: size * 0.4,
            borderRadius: (size * 0.4) / 2,
            backgroundColor: theme.colors.alpha,
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
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  core: {
    position: 'absolute',
  },
  gradientCore: {
    // gradient styles applied inline
  },
  innerPulse: {
    position: 'absolute',
  },
});

export default BrainPulse;
