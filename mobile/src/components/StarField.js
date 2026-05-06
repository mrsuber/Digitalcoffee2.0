import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const STAR_COLORS = ['#dfa3e4', '#d6e6f5'];

// Generate random stars with positions, sizes, and colors
const generateStars = (count = 100) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1, // 1-3px
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
      twinkleDuration: Math.random() * 3000 + 2000, // 2-5 seconds
    });
  }
  return stars;
};

export const StarField = ({ starCount = 100 }) => {
  const stars = useRef(generateStars(starCount)).current;
  const twinkleAnims = useRef(
    stars.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Create twinkling animation for each star
    const animations = stars.map((star, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(twinkleAnims[index], {
            toValue: 0.3,
            duration: star.twinkleDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(twinkleAnims[index], {
            toValue: 1,
            duration: star.twinkleDuration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    });

    // Start all animations with random delays
    animations.forEach((anim, index) => {
      setTimeout(() => {
        anim.start();
      }, Math.random() * 2000);
    });

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [stars, twinkleAnims]);

  return (
    <View style={styles.container}>
      {stars.map((star, index) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              opacity: twinkleAnims[index].interpolate({
                inputRange: [0.3, 1],
                outputRange: [star.opacity * 0.3, star.opacity],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  star: {
    position: 'absolute',
    borderRadius: 1,
  },
});

export default StarField;
