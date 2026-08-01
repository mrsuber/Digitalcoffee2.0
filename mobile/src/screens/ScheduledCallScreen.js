import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function ScheduledCallScreen({ navigation, route }) {
  const { booking, coach } = route.params || {};
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Start pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Vibrate in a pattern
    const vibrationPattern = [0, 500, 200, 500, 200, 500];
    Vibration.vibrate(vibrationPattern, true);

    return () => {
      pulse.stop();
      Vibration.cancel();
    };
  }, []);

  const handleAnswer = () => {
    Vibration.cancel();
    // Navigate to the video call screen
    navigation.replace('WaitingRoom', {
      sessionToken: booking?.session_token,
      bookingId: booking?.id,
      coachName: coach?.name || 'Coach',
    });
  };

  const handleDecline = () => {
    Vibration.cancel();
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#000614', '#1a1448', '#000614']}
      style={styles.container}
    >
      {/* Coach Avatar */}
      <Animated.View
        style={[
          styles.avatarContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={['#7c3aed', '#0d9488']}
          style={styles.avatarGradient}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {coach?.name?.charAt(0)?.toUpperCase() || 'C'}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{coach?.name || 'Professional Coach'}</Text>
        <Text style={styles.callType}>Scheduled Video Call</Text>
        <Text style={styles.callTime}>
          {booking?.scheduled_at
            ? new Date(booking.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Now'}
        </Text>
      </View>

      {/* Ringing Indicator */}
      <View style={styles.ringingContainer}>
        <Text style={styles.ringingText}>Ringing...</Text>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Decline Button */}
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          activeOpacity={0.8}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.buttonIcon}>✕</Text>
          </View>
          <Text style={styles.buttonLabel}>Decline</Text>
        </TouchableOpacity>

        {/* Answer Button */}
        <TouchableOpacity
          style={styles.answerButton}
          onPress={handleAnswer}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.answerGradient}
          >
            <Text style={styles.buttonIcon}>📞</Text>
          </LinearGradient>
          <Text style={styles.buttonLabel}>Answer</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginTop: 40,
  },
  avatarGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  callInfo: {
    alignItems: 'center',
    gap: 8,
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  callType: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  callTime: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  ringingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  ringingText: {
    fontSize: 20,
    color: theme.colors.alpha,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.alpha,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    gap: 60,
  },
  declineButton: {
    alignItems: 'center',
    gap: 12,
  },
  buttonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  answerButton: {
    alignItems: 'center',
    gap: 12,
  },
  answerGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    fontSize: 32,
  },
  buttonLabel: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
});
