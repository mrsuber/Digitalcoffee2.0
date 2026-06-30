import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RTCView } from 'react-native-webrtc';
import { theme } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import webrtcService from '../services/webrtc';

const { width, height } = Dimensions.get('window');

export const VideoCallScreen = ({ navigation, route }) => {
  const { session, localStream: initialLocalStream } = route.params || {};
  const { user } = useAuth();

  // Log route params for debugging
  console.log('📹 VideoCallScreen route params:', route.params);
  console.log('📹 Session object:', session);

  const [localStream, setLocalStream] = useState(initialLocalStream);
  const [remoteStream, setRemoteStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [connectionState, setConnectionState] = useState('connecting');
  const [sessionTime, setSessionTime] = useState(0);
  const [timeWarning, setTimeWarning] = useState(null);

  const sessionTimerRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    initializeCall();

    return () => {
      // Cleanup
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      webrtcService.cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log('📹 VideoCall: Initializing call...');

      // Validate session data
      if (!session) {
        throw new Error('Session data is missing');
      }

      console.log('📹 Session coach_id:', session.coach_id, 'coach_user_id:', session.coach_user_id, 'User ID:', user?.id);
      const isCoach = user?.id === session?.coach_user_id; // Compare with coach's user_id, not coach_id
      console.log('📹 Is coach?', isCoach);

      // Set up WebRTC event handlers BEFORE initializing
      webrtcService.onRemoteStream = (stream) => {
        console.log('📹 Remote stream received');
        setRemoteStream(stream);
        setConnectionState('connected');
        startSessionTimer();
      };

      webrtcService.onConnectionStateChange = (state) => {
        console.log('📹 Connection state:', state);
        setConnectionState(state);

        if (state === 'failed' || state === 'disconnected') {
          handleConnectionLost();
        }
      };

      webrtcService.onChatMessage = (message) => {
        setChatMessages(prev => [...prev, message]);
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
      };

      webrtcService.onCallEnded = (data) => {
        handleCallEnded(data.reason);
      };

      webrtcService.onTimeWarning = (data) => {
        setTimeWarning(data.message);
        setTimeout(() => setTimeWarning(null), 5000);
      };

      webrtcService.onError = (error) => {
        console.error('📹 WebRTC error:', error);
        Alert.alert('Connection Error', error.message);
      };

      // For coaches: wait for student to join before creating offer
      webrtcService.onUserJoined = (data) => {
        console.log('📹 User joined event received:', data);

        if (isCoach && data.userType === 'student') {
          console.log('📹 Student joined! Coach will create offer now...');
          // Give the student a moment to set up their peer connection
          setTimeout(async () => {
            try {
              console.log('📹 Creating WebRTC offer...');
              await webrtcService.createOffer();
              console.log('📹 Offer created and sent successfully');
            } catch (error) {
              console.error('📹 Error creating offer:', error);
              setConnectionState('failed');
              Alert.alert('Error', 'Failed to create call offer');
            }
          }, 1000); // Wait 1 second for student to be ready
        }
      };

      // Set the local stream from WaitingRoom
      webrtcService.localStream = initialLocalStream;

      // Initialize WebRTC (creates peer connection, joins session, waits for session-state)
      const userType = isCoach ? 'coach' : 'student';
      console.log('📹 Initializing WebRTC as', userType);
      await webrtcService.initialize(
        session.session_token,
        user?.id,
        userType
      );

      console.log('📹 WebRTC initialized successfully');

      // For students, just wait for offer (handled by socket event)
      if (!isCoach) {
        console.log('📹 Student waiting for offer from coach...');
      } else {
        console.log('📹 Coach waiting for student to join...');
        // If this is an instant call and both parties might already be present,
        // create offer after a short delay as fallback
        setTimeout(async () => {
          // Only create offer if we haven't already (onUserJoined might have triggered it)
          if (webrtcService.peerConnection &&
              webrtcService.peerConnection.signalingState === 'stable') {
            console.log('📹 Creating offer as fallback (student might have joined before coach)...');
            try {
              await webrtcService.createOffer();
              console.log('📹 Fallback offer created and sent');
            } catch (error) {
              console.error('📹 Error creating fallback offer:', error);
            }
          }
        }, 3000);
      }

    } catch (error) {
      console.error('📹 Error initializing call:', error);
      Alert.alert(
        'Call Setup Error',
        'Failed to setup the call. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const startSessionTimer = () => {
    sessionTimerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
  };

  const handleConnectionLost = () => {
    Alert.alert(
      'Connection Lost',
      'The connection was lost. Attempting to reconnect...',
      [
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => handleEndCall(),
        },
        {
          text: 'Wait',
          style: 'cancel',
        },
      ]
    );
  };

  const handleToggleCamera = () => {
    const newState = webrtcService.toggleCamera();
    setCameraEnabled(newState);
  };

  const handleToggleMic = () => {
    const newState = webrtcService.toggleMicrophone();
    setMicEnabled(newState);
  };

  const handleSwitchCamera = () => {
    webrtcService.switchCamera();
  };

  const handleToggleChat = () => {
    setChatVisible(!chatVisible);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      webrtcService.sendChatMessage(
        chatMessage.trim(),
        user?.id,
        user?.name || 'User'
      );
      setChatMessage('');
    }
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            webrtcService.endCall(user?.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCallEnded = (reason) => {
    let message = 'The call has ended.';
    if (reason === 'time_limit') {
      message = 'Session time limit reached (30 minutes).';
    } else if (reason === 'disconnect_timeout') {
      message = 'Call ended due to connection timeout.';
    }

    Alert.alert(
      'Call Ended',
      message,
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return '#10B981';
      case 'connecting':
        return '#F59E0B';
      case 'failed':
      case 'disconnected':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'failed':
        return 'Connection Failed';
      case 'disconnected':
        return 'Disconnected';
      default:
        return connectionState;
    }
  };

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      <View style={styles.remoteVideoContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[theme.colors.background, theme.colors.surface]}
            style={styles.remoteVideoPlaceholder}
          >
            <Text style={styles.placeholderIcon}>👤</Text>
            <Text style={styles.placeholderText}>Waiting for video...</Text>
          </LinearGradient>
        )}
      </View>

      {/* Local Video (Picture-in-Picture) */}
      <View style={styles.localVideoContainer}>
        {localStream && cameraEnabled ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        ) : (
          <View style={styles.localVideoOff}>
            <Text style={styles.localVideoOffText}>📷</Text>
          </View>
        )}
      </View>

      {/* Top Bar */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.6)', 'transparent']}
        style={styles.topBar}
      >
        <View style={styles.topBarContent}>
          <View style={styles.sessionInfo}>
            <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
            <Text style={styles.statusText}>{getConnectionStatusText()}</Text>
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
            <Text style={styles.timerLabel}>/ 30:00</Text>
          </View>
        </View>

        {timeWarning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ {timeWarning}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Bottom Controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
        style={styles.bottomBar}
      >
        <View style={styles.controlsContainer}>
          {/* Microphone */}
          <TouchableOpacity
            style={[styles.controlButton, !micEnabled && styles.controlButtonMuted]}
            onPress={handleToggleMic}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonIcon}>
              {micEnabled ? '🎤' : '🔇'}
            </Text>
            <Text style={[styles.controlButtonLabel, !micEnabled && styles.controlButtonLabelMuted]}>
              {micEnabled ? 'Mute' : 'Unmute'}
            </Text>
          </TouchableOpacity>

          {/* Camera */}
          <TouchableOpacity
            style={[styles.controlButton, !cameraEnabled && styles.controlButtonMuted]}
            onPress={handleToggleCamera}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonIcon}>
              {cameraEnabled ? '📹' : '🚫'}
            </Text>
            <Text style={[styles.controlButtonLabel, !cameraEnabled && styles.controlButtonLabelMuted]}>
              {cameraEnabled ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>

          {/* Switch Camera */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSwitchCamera}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonIcon}>🔄</Text>
            <Text style={styles.controlButtonLabel}>Flip</Text>
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            style={[styles.controlButton, chatVisible && styles.controlButtonActive]}
            onPress={handleToggleChat}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonIcon}>💬</Text>
            <Text style={styles.controlButtonLabel}>Chat</Text>
            {chatMessages.length > 0 && !chatVisible && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{chatMessages.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}
            activeOpacity={0.8}
          >
            <Text style={styles.endCallIcon}>📞</Text>
            <Text style={styles.endCallLabel}>End</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Chat Panel */}
      {chatVisible && (
        <KeyboardAvoidingView
          style={styles.chatPanel}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.9)']}
            style={styles.chatGradient}
          >
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Chat</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Text style={styles.chatClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
            >
              {chatMessages.map((msg, index) => {
                const isMyMessage = msg.userId === user?.id;
                return (
                  <View
                    key={index}
                    style={[
                      styles.chatMessageBubble,
                      isMyMessage ? styles.chatMessageMine : styles.chatMessageTheirs
                    ]}
                  >
                    {!isMyMessage && (
                      <Text style={styles.chatMessageName}>{msg.userName}</Text>
                    )}
                    <Text style={styles.chatMessageText}>{msg.message}</Text>
                    <Text style={styles.chatMessageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.chatInput}>
              <TextInput
                style={styles.chatTextInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={chatMessage}
                onChangeText={setChatMessage}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={handleSendMessage}
                disabled={!chatMessage.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.chatSendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  remoteVideoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoOff: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  localVideoOffText: {
    fontSize: 32,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    position: 'relative',
  },
  controlButtonMuted: {
    opacity: 0.6,
  },
  controlButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  controlButtonIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  controlButtonLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  controlButtonLabelMuted: {
    color: '#EF4444',
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  chatBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  endCallButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  endCallIcon: {
    fontSize: 28,
    transform: [{ rotate: '135deg' }],
  },
  endCallLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
  chatPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  chatGradient: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatClose: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
  },
  chatMessageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  chatMessageMine: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  chatMessageTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatMessageName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  chatMessageText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatMessageTime: {
    fontSize: 10,
    color: '#D1D5DB',
    alignSelf: 'flex-end',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 12,
  },
  chatSendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});

export default VideoCallScreen;
