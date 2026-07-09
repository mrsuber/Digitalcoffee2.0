import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RTCView } from 'react-native-webrtc';
import { theme } from '../utils/theme';
import { videoCallsAPI } from '../services/api';
import { useAlert } from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';
import webrtcService from '../services/webrtc';

export const WaitingRoomScreen = ({ navigation, route }) => {
  const { bookingId, session: providedSession } = route.params || {};
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useAlert();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(providedSession || null);
  const [localStream, setLocalStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [waitingForOther, setWaitingForOther] = useState(true);
  const [otherUserJoined, setOtherUserJoined] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const initializationAttempted = useRef(false);

  useEffect(() => {
    // If session was provided (instant call), use it directly
    if (providedSession) {
      console.log('📹 WaitingRoom: Using provided session data for instant call');
      // Initialize WebRTC first, THEN proceed
      initializeWebRTCForInstantCall(providedSession);
    } else {
      // Fetch session from booking
      joinSession();
    }

    return () => {
      // Cleanup on unmount - but DON'T stop tracks if navigating to VideoCall
      // The VideoCall screen will manage the stream
      console.log('📹 WaitingRoom: Unmounting, stream will be managed by VideoCall');
      // DO NOT stop tracks here - they're needed in VideoCall
    };
  }, []);

  useEffect(() => {
    if (otherUserJoined && !countdown) {
      // Start countdown when other user joins
      setCountdown(3);
    }
  }, [otherUserJoined]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      // Clean up socket listeners before navigating
      if (webrtcService.socket) {
        webrtcService.socket.off('user-joined');
        console.log('📹 WaitingRoom: Cleaned up listeners, navigating to VideoCall');
      }

      // Verify stream has tracks before navigating
      if (!localStream || localStream.getTracks().length === 0) {
        console.error('❌ Cannot navigate - no valid stream!');
        Alert.alert('Error', 'Camera stream is not ready. Please try again.');
        return;
      }

      console.log('📹 WaitingRoom: Navigating to VideoCall with stream:', {
        id: localStream.id,
        tracks: localStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`)
      });

      // Navigate to video call
      navigation.replace('VideoCall', {
        session: session,
        localStream: localStream,
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const joinSession = async () => {
    try {
      setLoading(true);

      // Get session details from backend
      const response = await videoCallsAPI.joinSession(bookingId);

      if (response.success) {
        const sessionData = response.data;
        setSession(sessionData);

        // Initialize WebRTC service
        if (!initializationAttempted.current) {
          initializationAttempted.current = true;
          await initializeWebRTC(sessionData);
        }
      } else {
        throw new Error(response.message || 'Failed to join session');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to join session. Please try again.',
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize WebRTC for scheduled bookings
  const initializeWebRTC = async (sessionData) => {
    try {
      // For scheduled calls, get the camera preview
      const stream = await webrtcService.getUserMedia(cameraEnabled, micEnabled);
      setLocalStream(stream);

      console.log('📹 WaitingRoom: Got local stream for preview');

    } catch (error) {
      console.error('WaitingRoom initialization error:', error);
      handleCameraError(error);
    }
  };

  // Initialize WebRTC specifically for instant calls
  const initializeWebRTCForInstantCall = async (sessionData) => {
    try {
      console.log('📹 WaitingRoom: Initializing camera for instant call...');

      // Get the camera preview - AWAIT this to ensure stream is ready
      const stream = await webrtcService.getUserMedia(cameraEnabled, micEnabled);

      console.log('📹 WaitingRoom: Got local stream with tracks:',
        stream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`).join(', ')
      );

      setLocalStream(stream);
      setLoading(false);

      // NOW that camera is ready, trigger the countdown
      // For instant calls, both parties are ready
      setOtherUserJoined(true);
      setWaitingForOther(false);

    } catch (error) {
      console.error('WaitingRoom instant call initialization error:', error);
      setLoading(false);
      handleCameraError(error);
    }
  };

  // Centralized error handling for camera/mic issues
  const handleCameraError = (error) => {
    if (error.message?.includes('Permission denied') || error.name === 'NotAllowedError') {
      Alert.alert(
        'Camera/Microphone Access Required',
        'Please grant camera and microphone permissions to join the video call.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else if (error.name === 'NotFoundError') {
      Alert.alert(
        'Camera/Microphone Not Found',
        'No camera or microphone was detected on your device.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      showAlert({
        type: 'error',
        title: 'Setup Error',
        message: 'Failed to setup camera and microphone: ' + (error.message || 'Unknown error'),
        onConfirm: () => navigation.goBack(),
      });
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Leave Waiting Room',
      'Are you sure you want to leave? Your booking will remain active.',
      [
        {
          text: 'Stay',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            if (localStream) {
              localStream.getTracks().forEach(track => track.stop());
            }
            // Disconnect socket but don't cleanup everything since we might navigate to VideoCall
            if (webrtcService.socket) {
              webrtcService.socket.disconnect();
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Joining session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Waiting Room</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Video Preview */}
        <View style={styles.videoPreviewContainer}>
          {localStream && cameraEnabled ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.videoPreview}
              objectFit="cover"
              mirror={true}
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Text style={styles.videoPlaceholderIcon}>📷</Text>
              <Text style={styles.videoPlaceholderText}>
                {cameraEnabled ? 'Starting camera...' : 'Camera is off'}
              </Text>
            </View>
          )}

          {/* Controls Overlay */}
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={[styles.controlButton, !micEnabled && styles.controlButtonMuted]}
              onPress={handleToggleMic}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonIcon}>
                {micEnabled ? '🎤' : '🔇'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !cameraEnabled && styles.controlButtonMuted]}
              onPress={handleToggleCamera}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonIcon}>
                {cameraEnabled ? '📹' : '🚫'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Information */}
        <View style={styles.statusContainer}>
          {countdown !== null ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownText}>Starting call...</Text>
            </View>
          ) : waitingForOther ? (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.waitingSpinner} />
              <Text style={styles.waitingTitle}>Waiting for other participant</Text>
              <Text style={styles.waitingSubtitle}>
                {session?.coach_name && session?.student_name
                  ? user?.id === session.coach_id
                    ? `Waiting for ${session.student_name} to join...`
                    : `Waiting for ${session.coach_name} to join...`
                  : 'The session will begin when everyone joins'}
              </Text>
            </View>
          ) : (
            <View style={styles.readyContainer}>
              <Text style={styles.readyIcon}>✓</Text>
              <Text style={styles.readyText}>Other participant joined!</Text>
            </View>
          )}
        </View>

        {/* Session Details */}
        <View style={styles.detailsContainer}>
          <LinearGradient
            colors={['rgba(76, 29, 149, 0.1)', 'rgba(124, 58, 237, 0.05)']}
            style={styles.detailsGradient}
          >
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Session Type</Text>
              <Text style={styles.detailValue}>30-minute Video Call</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recording</Text>
              <Text style={styles.detailValue}>🎥 This session is recorded</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for a great session:</Text>
          <Text style={styles.tipText}>• Find a quiet, well-lit space</Text>
          <Text style={styles.tipText}>• Check your camera and microphone</Text>
          <Text style={styles.tipText}>• Use headphones for better audio</Text>
          <Text style={styles.tipText}>• Have your notes ready</Text>
        </View>

        <AlertComponent />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  videoPreviewContainer: {
    width: '90%',
    aspectRatio: 3 / 4,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  videoPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  videoPlaceholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  controlButtonMuted: {
    backgroundColor: '#EF4444',
  },
  controlButtonIcon: {
    fontSize: 24,
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 120,
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  waitingContainer: {
    alignItems: 'center',
  },
  waitingSpinner: {
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  readyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  detailsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsGradient: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  detailDivider: {
    height: 1,
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.2,
    marginVertical: 8,
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
});
