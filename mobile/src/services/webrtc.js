import io from 'socket.io-client';
import { API_URL } from './api';

// Safely import WebRTC with fallback
let RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices;

try {
  const WebRTC = require('react-native-webrtc');
  RTCPeerConnection = WebRTC.RTCPeerConnection;
  RTCSessionDescription = WebRTC.RTCSessionDescription;
  RTCIceCandidate = WebRTC.RTCIceCandidate;
  mediaDevices = WebRTC.mediaDevices;
} catch (error) {
  console.warn('WebRTC module not available:', error.message);
  // Provide mock implementations to prevent crashes
  RTCPeerConnection = null;
  RTCSessionDescription = null;
  RTCIceCandidate = null;
  mediaDevices = null;
}

const SOCKET_URL = API_URL.replace('/api', ''); // Remove /api from base URL

// ICE servers configuration with STUN and TURN servers
// TURN servers help establish connections through restrictive NATs/firewalls
const ICE_SERVERS = [
  // Google's public STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },

  // Publicly available TURN servers (consider setting up your own for production)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.roomId = null;
    this.sessionToken = null;
    this.userType = null; // 'coach' or 'student'

    // Callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onChatMessage = null;
    this.onCallEnded = null;
    this.onUserJoined = null;
    this.onTimeWarning = null;
    this.onError = null;
  }

  // Join session and wait for session state (used when socket/stream already set up)
  async joinSession(sessionToken, userId, userType) {
    try {
      console.log('📹 Joining session...', { sessionToken, userId, userType });

      this.sessionToken = sessionToken;
      this.userType = userType;

      // Ensure socket is connected
      if (!this.socket || !this.socket.connected) {
        console.log('📹 Socket not connected, connecting now...');
        await this.connectSocket();
      }

      // Wait for session-state before resolving
      const sessionStatePromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for session state'));
        }, 10000); // 10 second timeout

        const sessionStateHandler = (data) => {
          clearTimeout(timeout);
          console.log('✅ Session state received:', data);
          this.roomId = data.roomId;
          resolve(data);
        };

        this.socket.once('session-state', sessionStateHandler);
      });

      // Join session room
      this.socket.emit('join-session', {
        sessionToken,
        userId,
        userType
      });

      // Wait for session state
      await sessionStatePromise;

      console.log('✅ Joined session successfully with roomId:', this.roomId);
      return { success: true, roomId: this.roomId };
    } catch (error) {
      console.error('Session join error:', error);
      this.handleError('Failed to join session', error);
      throw error;
    }
  }

  // Initialize WebRTC and Socket connection (full initialization)
  async initialize(sessionToken, userId, userType) {
    try {
      // Check if WebRTC is available
      if (!RTCPeerConnection || !mediaDevices) {
        throw new Error('WebRTC is not available on this device. Please ensure you have installed react-native-webrtc and linked it properly.');
      }

      console.log('Initializing WebRTC...', { sessionToken, userId, userType });

      this.sessionToken = sessionToken;
      this.userType = userType;

      // Connect to Socket.io if not already connected
      if (!this.socket || !this.socket.connected) {
        await this.connectSocket();
      }

      // Get user media if not already available
      if (!this.localStream) {
        console.log('📹 No local stream found, getting user media...');
        await this.getUserMedia();
      } else {
        console.log('📹 Using existing local stream with', this.localStream.getTracks().length, 'tracks');
        // Verify tracks
        this.localStream.getTracks().forEach(track => {
          console.log(`   - ${track.kind}: ${track.enabled}, ${track.readyState}`);
        });
      }

      // Create peer connection if not already created
      if (!this.peerConnection) {
        console.log('📹 Creating peer connection...');
        this.createPeerConnection();
      } else {
        console.log('📹 Using existing peer connection');
      }

      // Join session
      await this.joinSession(sessionToken, userId, userType);

      console.log('✅ WebRTC initialized successfully with roomId:', this.roomId);
      return { success: true };
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      this.handleError('Failed to initialize video call', error);
      throw error;
    }
  }

  // Connect to Socket.io signaling server
  connectSocket() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to socket server:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10, // Increased for better resilience
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
        upgrade: true,
        path: '/socket.io/', // Explicitly set the path
        rejectUnauthorized: false, // Allow self-signed certificates
        secure: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.handleError('Socket connection failed', error);
        // Don't reject immediately, let reconnection logic handle it
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed after all attempts');
        this.handleError('Failed to connect to server after multiple attempts');
        reject(new Error('Socket connection failed'));
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.handleError('Connection error', error);
      });

      // Session state received (for updates after initial join)
      this.socket.on('session-state', (data) => {
        console.log('Session state update:', data);

        // Update roomId if not already set
        if (!this.roomId && data.roomId) {
          this.roomId = data.roomId;
        }

        // Load existing chat messages
        if (data.chatMessages && this.onChatMessage) {
          data.chatMessages.forEach(msg => this.onChatMessage(msg));
        }
      });

      // User joined
      this.socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        if (this.onUserJoined) {
          this.onUserJoined(data);
        }
      });

      // WebRTC signaling
      this.socket.on('webrtc-offer', async (data) => {
        console.log('Received WebRTC offer');
        await this.handleOffer(data.offer);
      });

      this.socket.on('webrtc-answer', async (data) => {
        console.log('Received WebRTC answer');
        await this.handleAnswer(data.answer);
      });

      this.socket.on('ice-candidate', async (data) => {
        await this.handleIceCandidate(data.candidate);
      });

      // Call events
      this.socket.on('call-started', (data) => {
        console.log('Call started:', data);
      });

      this.socket.on('time-warning', (data) => {
        console.log('Time warning:', data);
        if (this.onTimeWarning) {
          this.onTimeWarning(data);
        }
      });

      this.socket.on('call-ended', (data) => {
        console.log('Call ended:', data);
        if (this.onCallEnded) {
          this.onCallEnded(data);
        }
        this.cleanup();
      });

      // Chat
      this.socket.on('chat-message', (message) => {
        if (this.onChatMessage) {
          this.onChatMessage(message);
        }
      });

      // Peer events
      this.socket.on('peer-disconnected', (data) => {
        console.log('Peer disconnected:', data);
      });

      this.socket.on('peer-connection-issue', (data) => {
        console.log('Peer connection issue:', data);
      });

      // Screen sharing
      this.socket.on('screen-share-started', (data) => {
        console.log('Screen sharing started:', data);
      });

      this.socket.on('screen-share-stopped', (data) => {
        console.log('Screen sharing stopped:', data);
      });
    });
  }

  // Get local media stream
  async getUserMedia(videoEnabled = true, audioEnabled = true) {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      });

      this.localStream = stream;

      if (this.onLocalStream) {
        this.onLocalStream(stream);
      }

      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  // Create RTCPeerConnection
  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS
    });

    // Add local stream tracks
    if (this.localStream) {
      console.log('📹 Adding local tracks to peer connection:');
      this.localStream.getTracks().forEach(track => {
        console.log(`  - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`, track.getSettings());
        this.peerConnection.addTrack(track, this.localStream);
      });
      console.log('📹 Total tracks added:', this.localStream.getTracks().length);
    } else {
      console.warn('⚠️ No local stream available when creating peer connection!');
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Received remote track:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        muted: event.track.muted,
        id: event.track.id,
        label: event.track.label
      });
      console.log('📹 Track settings:', event.track.getSettings());
      console.log('📹 Stream ID:', event.streams[0]?.id);
      console.log('📹 Stream tracks:', event.streams[0]?.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`));

      if (event.streams[0]) {
        const newStream = event.streams[0];

        // Always update to latest stream
        if (!this.remoteStream || this.remoteStream.id !== newStream.id) {
          console.log('📹 Setting remote stream:', newStream.id);
          this.remoteStream = newStream;

          // Log all tracks
          const videoTracks = newStream.getVideoTracks();
          const audioTracks = newStream.getAudioTracks();
          console.log('📹 Remote stream has', videoTracks.length, 'video tracks and', audioTracks.length, 'audio tracks');

          videoTracks.forEach((track, idx) => {
            console.log(`📹 Video track ${idx}:`, {
              id: track.id,
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState
            });
          });

          if (this.onRemoteStream) {
            this.onRemoteStream(this.remoteStream);
          }
        } else {
          console.log('📹 New track added to existing stream. Total tracks:', this.remoteStream.getTracks().length);
          // Notify again in case UI needs to re-render
          if (this.onRemoteStream && event.track.kind === 'video') {
            this.onRemoteStream(this.remoteStream);
          }
        }
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      // Check if peer connection still exists (might be null during cleanup)
      if (!this.peerConnection) {
        console.log('Connection state change fired but peer connection is null');
        return;
      }

      console.log('Connection state:', this.peerConnection.connectionState);

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }

      if (this.peerConnection.connectionState === 'connected') {
        // Call officially started
        this.socket.emit('call-started', { roomId: this.roomId });
      }
    };

    // ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      // Check if peer connection still exists (might be null during cleanup)
      if (!this.peerConnection) {
        console.log('ICE connection state change fired but peer connection is null');
        return;
      }

      console.log('ICE connection state:', this.peerConnection.iceConnectionState);

      if (this.peerConnection.iceConnectionState === 'failed') {
        console.warn('⚠️ ICE connection failed, attempting restart...');
        this.socket.emit('connection-issue', { roomId: this.roomId });

        // Attempt ICE restart
        this.attemptIceRestart();
      } else if (this.peerConnection.iceConnectionState === 'disconnected') {
        console.warn('⚠️ ICE connection disconnected, monitoring...');
        // Wait a bit before attempting restart (connection might recover)
        setTimeout(() => {
          if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
            console.log('🔄 ICE still disconnected after timeout, attempting restart...');
            this.attemptIceRestart();
          }
        }, 5000);
      }
    };
  }

  // Attempt to restart ICE connection
  async attemptIceRestart() {
    try {
      if (!this.peerConnection || !this.roomId) {
        console.error('Cannot restart ICE: missing peer connection or room ID');
        return;
      }

      console.log('🔄 Attempting ICE restart...');

      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      this.socket.emit('webrtc-offer', {
        roomId: this.roomId,
        offer: offer
      });

      console.log('✅ ICE restart offer sent');
    } catch (error) {
      console.error('❌ ICE restart failed:', error);
      this.handleError('Connection restart failed', error);
    }
  }

  // Create and send offer (for initiator)
  async createOffer() {
    try {
      if (!this.peerConnection) {
        console.error('Cannot create offer: peer connection not initialized');
        throw new Error('Peer connection not initialized');
      }

      if (!this.roomId) {
        console.error('Cannot create offer: roomId not set');
        throw new Error('Room ID not set');
      }

      console.log('Creating offer for room:', this.roomId);

      // Log current senders/tracks before creating offer
      const senders = this.peerConnection.getSenders();
      console.log('📹 Current senders before creating offer:', senders.length);
      senders.forEach(sender => {
        if (sender.track) {
          console.log(`   - Sending ${sender.track.kind}: enabled=${sender.track.enabled}, readyState=${sender.track.readyState}`);
        } else {
          console.log('   - Sender with no track');
        }
      });

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      console.log('📹 Offer SDP created. Video present:', offer.sdp.includes('m=video'));
      console.log('📹 Offer SDP audio present:', offer.sdp.includes('m=audio'));
      // Log the actual video line from SDP
      const videoMatch = offer.sdp.match(/m=video.*\n.*\n.*\n/);
      if (videoMatch) {
        console.log('📹 Video SDP line:', videoMatch[0].substring(0, 100));
      }

      console.log('Setting local description with offer...');
      await this.peerConnection.setLocalDescription(offer);
      console.log('Local description set successfully');

      console.log('Emitting webrtc-offer to room:', this.roomId);
      this.socket.emit('webrtc-offer', {
        roomId: this.roomId,
        offer: offer
      });

      console.log('Offer sent successfully to room:', this.roomId);
    } catch (error) {
      console.error('Error creating offer:', error);
      this.handleError('Failed to create call offer', error);
      throw error;
    }
  }

  // Handle received offer
  async handleOffer(offer) {
    try {
      if (!this.peerConnection) {
        console.error('Cannot handle offer: peer connection not initialized');
        throw new Error('Peer connection not initialized');
      }

      console.log('📹 Received offer. Video present:', offer.sdp.includes('m=video'));
      console.log('📹 Received offer. Audio present:', offer.sdp.includes('m=audio'));

      // Log current senders before handling offer
      const senders = this.peerConnection.getSenders();
      console.log('📹 Current senders before setting remote desc:', senders.length);
      senders.forEach(sender => {
        if (sender.track) {
          console.log(`  - ${sender.track.kind}: enabled=${sender.track.enabled}, readyState=${sender.track.readyState}`);
        }
      });

      console.log('Setting remote description from offer...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote description set successfully');

      console.log('Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      console.log('📹 Answer SDP created. Video present:', answer.sdp.includes('m=video'));
      console.log('📹 Answer SDP audio present:', answer.sdp.includes('m=audio'));

      await this.peerConnection.setLocalDescription(answer);
      console.log('Local description set with answer');

      this.socket.emit('webrtc-answer', {
        roomId: this.roomId,
        answer: answer
      });

      console.log('Answer sent to room:', this.roomId);
    } catch (error) {
      console.error('Error handling offer:', error);
      this.handleError('Failed to process call offer', error);
      throw error;
    }
  }

  // Handle received answer
  async handleAnswer(answer) {
    try {
      console.log('📹 Received answer. Video present:', answer.sdp.includes('m=video'));
      console.log('📹 Received answer. Audio present:', answer.sdp.includes('m=audio'));

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Answer received and remote description set');

      // Log transceivers to verify media types
      const transceivers = this.peerConnection.getTransceivers();
      console.log('📹 Transceivers after answer:', transceivers.length);
      transceivers.forEach((t, i) => {
        console.log(`  [${i}] ${t.mid}: ${t.direction}, sender=${t.sender?.track?.kind}, receiver=${t.receiver?.track?.kind}`);
      });
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  // Send chat message
  sendChatMessage(message, userId, userName) {
    this.socket.emit('chat-message', {
      roomId: this.roomId,
      message,
      userId,
      userName
    });
  }

  // Toggle microphone
  toggleMicrophone() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle camera
  toggleCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Switch camera (front/back)
  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Switch between front and back camera
        videoTrack._switchCamera();
      }
    }
  }

  // End call
  endCall(userId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('end-call', {
        roomId: this.roomId,
        userId,
        reason: 'normal'
      });
    }
    this.cleanup();
  }

  // Report quality metrics
  reportQualityMetrics(userId, metrics) {
    this.socket.emit('quality-metrics', {
      roomId: this.roomId,
      userId,
      metrics
    });
  }

  // Start screen sharing (placeholder - requires native module)
  async startScreenShare() {
    // Screen sharing implementation would go here
    // Requires additional native modules
    console.log('Screen sharing not implemented yet');
  }

  // Cleanup
  cleanup() {
    console.log('Cleaning up WebRTC resources...');

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.remoteStream = null;
    this.roomId = null;
  }

  // Error handler
  handleError(message, error) {
    console.error(message, error);
    if (this.onError) {
      this.onError({ message, error });
    }
  }
}

export default new WebRTCService();
