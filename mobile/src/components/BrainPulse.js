import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { theme } from '../utils/theme';

export const BrainPulse = ({ size = 200, pulseSpeed = 2000 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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

    // Subtle glow animation - opacity
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: pulseSpeed * 0.8,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.85,
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
      {/* Circular container with glow effect */}
      <Animated.View
        style={[
          styles.circularContainer,
          animatedStyle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
      >
        <Image
          source={require('../../assets/brain-logo.png')}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default BrainPulse;
