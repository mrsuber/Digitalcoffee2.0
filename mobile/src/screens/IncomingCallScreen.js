import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Vibration,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import api from '../services/api';

const IncomingCallScreen = ({ route, navigation }) => {
  const { sessionId, coachName, roomId } = route.params;
  const [isAnswering, setIsAnswering] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    // Setup audio and start ringtone
    setupAudioAndRing();

    // Vibrate pattern for incoming call
    if (Platform.OS === 'android') {
      const pattern = [0, 1000, 500, 1000, 500, 1000];
      Vibration.vibrate(pattern, true); // Repeat
    } else {
      Vibration.vibrate([0, 1000], true);
    }

    // Auto-reject after 60 seconds
    const timeout = setTimeout(() => {
      handleReject();
    }, 60000);

    return () => {
      Vibration.cancel();
      clearTimeout(timeout);
      stopRingtone();
    };
  }, []);

  const setupAudioAndRing = async () => {
    try {
      // Configure audio mode for ringtone
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and play ringtone sound
      // Using a notification sound URI that's available on both platforms
      const { sound } = await Audio.Sound.createAsync(
        // Using a system sound - you can replace this with a custom sound file
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        }
      );

      soundRef.current = sound;
      console.log('🔔 Ringtone started');
    } catch (error) {
      console.error('Error playing ringtone:', error);
      // Fallback: Continue without sound
    }
  };

  const stopRingtone = async () => {
    try {
      if (soundRef.current) {
        console.log('🔕 Stopping ringtone');
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping ringtone:', error);
    }
  };

  const handleAnswer = async () => {
    try {
      setIsAnswering(true);
      Vibration.cancel();
      await stopRingtone();

      console.log(`📞 Answering call session ${sessionId}`);

      // Answer the call via API
      const response = await api.post(`/video-calls/instant-call/${sessionId}/answer`);

      console.log('📞 API response:', response);

      // Get the full session data from the response
      const sessionData = response.data || response;

      console.log('📞 Session data:', sessionData);

      if (!sessionData.session_token) {
        console.error('❌ No session_token in response!');
        throw new Error('Invalid session data received');
      }

      // Navigate to WaitingRoom first (standard flow)
      navigation.replace('WaitingRoom', {
        bookingId: null, // No booking for instant calls
        session: {
          id: sessionData.id || sessionId,
          session_token: sessionData.session_token,
          room_id: sessionData.room_id || roomId,
          coach_id: sessionData.coach_id,
          coach_user_id: sessionData.coach_user_id, // Include for role detection
          student_id: sessionData.student_id,
          status: sessionData.status || 'in_progress',
          call_type: sessionData.call_type || 'instant',
          coach_name: coachName,
        },
      });
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Failed to answer call. Please try again.');
      setIsAnswering(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      Vibration.cancel();
      await stopRingtone();

      // Reject the call via API
      await api.post(`/video-calls/instant-call/${sessionId}/reject`);

      // Go back
      navigation.goBack();
    } catch (error) {
      console.error('Error rejecting call:', error);
      // Go back anyway
      navigation.goBack();
    }
  };

  return (
    <LinearGradient colors={['#1f2937', '#111827']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Section - Caller Info */}
      <View style={styles.topSection}>
        <Text style={styles.incomingText}>Incoming Call</Text>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPulse} />
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color="#fff" />
          </View>
        </View>

        {/* Caller Name */}
        <Text style={styles.callerName}>{coachName}</Text>
        <Text style={styles.callerTitle}>Professional Coach</Text>
      </View>

      {/* Bottom Section - Call Controls */}
      <View style={styles.bottomSection}>
        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.callButton, styles.rejectButton]}
          onPress={handleReject}
          disabled={isRejecting || isAnswering}
        >
          <Ionicons name="close" size={40} color="#fff" />
        </TouchableOpacity>

        {/* Accept Button */}
        <TouchableOpacity
          style={[styles.callButton, styles.answerButton]}
          onPress={handleAnswer}
          disabled={isRejecting || isAnswering}
        >
          <Ionicons name="call" size={40} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Labels */}
      <View style={styles.labelSection}>
        <Text style={styles.buttonLabel}>Decline</Text>
        <View style={{ width: 100 }} />
        <Text style={styles.buttonLabel}>Accept</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 60,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  incomingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 40,
    fontWeight: '500',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  avatarPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#3b82f6',
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#60a5fa',
  },
  callerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callerTitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    marginBottom: 20,
  },
  callButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  answerButton: {
    backgroundColor: '#10b981',
  },
  labelSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

export default IncomingCallScreen;
