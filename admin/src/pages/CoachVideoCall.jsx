import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coachAPI } from '../services/api';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, MessageSquare, Users } from 'lucide-react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const SOCKET_URL = 'https://digitalcoffee.cafe';

// ICE servers configuration with STUN and TURN servers
// TURN servers help establish connections through restrictive NATs/firewalls
const ICE_SERVERS = {
  iceServers: [
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
  ],
  iceCandidatePoolSize: 10
};

export default function CoachVideoCall() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [connectionState, setConnectionState] = useState('new'); // new, connecting, waiting, connected, failed
  const [statusMessage, setStatusMessage] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStartTime = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const activeSessionId = useRef(null);

  useEffect(() => {
    loadStudentInfo();
  }, [studentId]);

  useEffect(() => {
    let interval;
    if (callActive && callStartTime.current) {
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callActive]);

  const loadStudentInfo = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getStudents();
      const studentInfo = response.students.find(s => s.user_id === parseInt(studentId));
      setStudent(studentInfo);
    } catch (error) {
      console.error('Error loading student info:', error);
      alert('Failed to load student information');
    } finally {
      setLoading(false);
    }
  };

  const startCall = async () => {
    try {
      setConnecting(true);
      setConnectionState('connecting');
      setStatusMessage('Accessing camera and microphone...');

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => console.log('Video autoplay:', e));
      }

      setStatusMessage('Connecting to server...');

      // Connect to Socket.IO and wait for registration
      await new Promise((resolve, reject) => {
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10,
          timeout: 20000,
          autoConnect: true,
          upgrade: true
        });

        const registrationTimeout = setTimeout(() => {
          reject(new Error('Socket registration timeout'));
        }, 10000);

        socketRef.current.on('connect', () => {
          console.log('✅ Socket connected:', socketRef.current.id);

          // Register user with socket server
          if (admin?.id) {
            console.log('📝 Registering coach with socket server:', admin.id);
            socketRef.current.emit('register-user', { userId: admin.id });
          } else {
            clearTimeout(registrationTimeout);
            console.error('❌ No admin ID available. Admin object:', admin);
            reject(new Error('No admin user ID available'));
          }
        });

        // Wait for registration confirmation before proceeding
        socketRef.current.once('registration-confirmed', (data) => {
          console.log('✅ Coach registration confirmed:', data);
          clearTimeout(registrationTimeout);
          resolve();
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          clearTimeout(registrationTimeout);
          reject(error);
        });
      });

      console.log('✅ Socket registered and ready');
      setStatusMessage('Calling student...');

      // Set up additional socket event handlers (after successful connection)
      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
        setStatusMessage(`Reconnecting... (attempt ${attemptNumber})`);
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        setStatusMessage('Reconnected to server');
        // Re-register on reconnect
        if (admin?.id) {
          console.log('📝 Re-registering coach after reconnect');
          socketRef.current.emit('register-user', { userId: admin.id });
        }
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('❌ Socket reconnection failed');
        setConnectionState('failed');
        setStatusMessage('Failed to reconnect to server');
        alert('Failed to connect to server. Please check your internet connection.');
      });

      // Listen for call-answered event (CRITICAL - this is when student accepts)
      socketRef.current.on('call-answered', async (data) => {
        console.log('📞 Student answered the call! Data received:', data);
        setConnectionState('waiting');
        setStatusMessage('Student answered! Establishing connection...');
        setSessionData(data);

        // Initialize WebRTC immediately
        try {
          await initializeWebRTC(data);
        } catch (error) {
          console.error('❌ Failed to initialize WebRTC:', error);
          setConnectionState('failed');
          setStatusMessage('Failed to establish video connection');
          alert('Failed to establish video connection: ' + error.message);
        }
      });

      // Listen for call-rejected event
      socketRef.current.on('call-rejected', (data) => {
        console.log('❌ Student rejected the call');
        setConnectionState('failed');
        setStatusMessage('Student declined the call');
        setTimeout(() => {
          endCall();
        }, 3000);
      });

      setStatusMessage('Notifying student...');

      // Call the backend to notify student
      const response = await coachAPI.initiateInstantCall(studentId);
      console.log('📱 Student notified:', response);

      // Store session ID for later cancellation
      if (response?.session?.id) {
        activeSessionId.current = response.session.id;
        console.log('📝 Session ID stored:', activeSessionId.current);
      }

      setCallActive(true);
      setConnecting(false);
      setConnectionState('waiting');
      setStatusMessage('Ringing...');

    } catch (error) {
      console.error('Error starting call:', error);
      setConnecting(false);
      setConnectionState('failed');

      if (error.name === 'NotAllowedError') {
        setStatusMessage('Camera/microphone access denied');
        alert('Camera/microphone access denied. Please allow access and try again.');
      } else if (error.name === 'NotFoundError') {
        setStatusMessage('No camera or microphone found');
        alert('No camera or microphone found on your device.');
      } else {
        setStatusMessage('Failed to start call');
        alert('Failed to start call: ' + error.message);
      }
    }
  };

  const initializeWebRTC = async (callData) => {
    try {
      console.log('🎥 Initializing WebRTC connection...');

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks
      localStreamRef.current.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('📡 Sending ICE candidate');
          socketRef.current.emit('ice-candidate', {
            roomId: callData.roomId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        console.log('📹 Received remote stream');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          callStartTime.current = Date.now();
          setConnectionState('connected');
          setStatusMessage('Connected');
        }
      };

      // Connection state monitoring
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current.connectionState;
        console.log('🔌 Connection state changed:', state);

        switch (state) {
          case 'connecting':
            setConnectionState('waiting');
            setStatusMessage('Connecting...');
            break;
          case 'connected':
            setConnectionState('connected');
            setStatusMessage('Connected');
            break;
          case 'disconnected':
            setConnectionState('waiting');
            setStatusMessage('Connection lost, attempting to reconnect...');
            break;
          case 'failed':
            setConnectionState('failed');
            setStatusMessage('Connection failed');
            break;
          case 'closed':
            setConnectionState('new');
            setStatusMessage('Call ended');
            break;
        }
      };

      // ICE connection state monitoring
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        if (!peerConnectionRef.current) return;

        const state = peerConnectionRef.current.iceConnectionState;
        console.log('🧊 ICE connection state:', state);

        if (state === 'failed') {
          console.warn('⚠️ ICE connection failed, attempting restart...');
          setConnectionState('waiting');
          setStatusMessage('Connection issue, attempting to reconnect...');

          // Attempt ICE restart
          attemptIceRestart();
        } else if (state === 'disconnected') {
          console.warn('⚠️ ICE connection disconnected, monitoring...');
          setStatusMessage('Connection interrupted...');

          // Wait a bit before attempting restart
          setTimeout(() => {
            if (peerConnectionRef.current &&
                peerConnectionRef.current.iceConnectionState === 'disconnected') {
              console.log('🔄 ICE still disconnected, attempting restart...');
              attemptIceRestart();
            }
          }, 5000);
        } else if (state === 'connected' || state === 'completed') {
          setConnectionState('connected');
          setStatusMessage('Connected');
        }
      };

      // ========================================
      // IMPORTANT: Set up ALL socket listeners BEFORE emitting join-session
      // to avoid race conditions with immediate backend responses
      // ========================================

      // Listen for user-joined event (when student joins)
      socketRef.current.on('user-joined', async (data) => {
        console.log('👤 User joined session:', data);

        if (data.userType === 'student') {
          console.log('✅ Student joined! Creating offer now...');
          // Wait a moment for student to set up peer connection
          setTimeout(async () => {
            try {
              console.log('📤 Creating WebRTC offer...');
              const offer = await peerConnectionRef.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await peerConnectionRef.current.setLocalDescription(offer);

              socketRef.current.emit('webrtc-offer', {
                roomId: callData.roomId,
                offer: offer
              });
              console.log('✅ Offer sent to room:', callData.roomId);
            } catch (error) {
              console.error('❌ Error creating offer:', error);
              alert('Failed to establish video connection: ' + error.message);
            }
          }, 1000); // Wait 1 second for student's peer connection to be ready
        }
      });

      // Listen for session-state
      socketRef.current.once('session-state', async (data) => {
        console.log('✅ Session state received:', data);

        // Check if student is already in the session
        if (data.participants?.student?.joined) {
          console.log('📝 Student already in session, creating offer immediately');
          setTimeout(async () => {
            try {
              console.log('📤 Creating WebRTC offer (student already present)...');
              const offer = await peerConnectionRef.current.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await peerConnectionRef.current.setLocalDescription(offer);

              socketRef.current.emit('webrtc-offer', {
                roomId: callData.roomId,
                offer: offer
              });
              console.log('✅ Offer sent to room:', callData.roomId);
            } catch (error) {
              console.error('❌ Error creating offer:', error);
              alert('Failed to establish video connection: ' + error.message);
            }
          }, 1500);
        } else {
          console.log('⏳ Waiting for student to join...');
        }
      });

      // Listen for answer
      socketRef.current.on('webrtc-answer', async (data) => {
        console.log('📥 Received answer from student');
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      });

      // Listen for ICE candidates
      socketRef.current.on('ice-candidate', async (data) => {
        if (data.candidate) {
          console.log('📥 Received ICE candidate');
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      });

      // Listen for call ended
      socketRef.current.on('call-ended', (data) => {
        console.log('📞 Call ended:', data.reason);
        endCall();
      });

      // ========================================
      // NOW emit join-session AFTER all listeners are set up
      // ========================================
      console.log('🔌 Joining session with data:', {
        sessionToken: callData.sessionToken,
        userId: callData.coachUserId,
        userType: 'coach'
      });

      socketRef.current.emit('join-session', {
        sessionToken: callData.sessionToken,
        userId: callData.coachUserId,
        userType: 'coach'
      });

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      alert('Failed to establish video connection: ' + error.message);
    }
  };

  // Attempt ICE restart for connection recovery
  const attemptIceRestart = async () => {
    try {
      if (!peerConnectionRef.current || !sessionData?.roomId) {
        console.error('Cannot restart ICE: missing peer connection or room ID');
        return;
      }

      console.log('🔄 Attempting ICE restart...');
      const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit('webrtc-offer', {
        roomId: sessionData.roomId,
        offer: offer
      });

      console.log('✅ ICE restart offer sent');
      setStatusMessage('Reconnecting...');
    } catch (error) {
      console.error('❌ ICE restart failed:', error);
      setConnectionState('failed');
      setStatusMessage('Connection recovery failed');
    }
  };

  const endCall = async () => {
    try {
      // Cancel the call on backend if we have a session ID and call is still waiting/in-progress
      if (activeSessionId.current) {
        console.log('📞 Cancelling instant call session:', activeSessionId.current);
        try {
          await coachAPI.cancelInstantCall(activeSessionId.current, 'coach_ended_call');
          console.log('✅ Call cancelled on backend');
        } catch (error) {
          // Don't block cleanup if cancel fails (might already be ended)
          console.log('⚠️ Cancel call API failed (might already be ended):', error.message);
        }
      }
    } catch (error) {
      console.error('Error during call end:', error);
    } finally {
      // Cleanup local resources regardless of API result
      // Stop all media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setCallActive(false);
      setConnecting(false);
      callStartTime.current = null;
      setCallDuration(0);
      setSessionData(null);
      activeSessionId.current = null;

      // Navigate back to students
      navigate('/coach/students');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel call if component unmounts while active
      if (activeSessionId.current) {
        console.log('🧹 Component unmounting, cancelling active call');
        coachAPI.cancelInstantCall(activeSessionId.current, 'coach_closed_window')
          .catch(err => console.log('Cleanup cancel failed:', err.message));
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f2937'
      }}>
        <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1f2937',
        gap: '1rem'
      }}>
        <div style={{ color: 'white', fontSize: '1.25rem' }}>Student not found</div>
        <button
          onClick={() => navigate('/coach/students')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: '#1f2937',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 2rem',
        background: '#111827',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600'
          }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
              {student.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {connectionState === 'connected' && (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse 2s infinite'
                  }} />
                  <p style={{ color: '#10b981', fontSize: '0.875rem', margin: 0, fontWeight: '600' }}>
                    Connected • {formatDuration(callDuration)}
                  </p>
                </>
              )}
              {connectionState === 'waiting' && (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    animation: 'pulse 2s infinite'
                  }} />
                  <p style={{ color: '#f59e0b', fontSize: '0.875rem', margin: 0 }}>
                    {statusMessage}
                  </p>
                </>
              )}
              {connectionState === 'connecting' && (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    animation: 'pulse 2s infinite'
                  }} />
                  <p style={{ color: '#3b82f6', fontSize: '0.875rem', margin: 0 }}>
                    {statusMessage}
                  </p>
                </>
              )}
              {connectionState === 'failed' && (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }} />
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
                    {statusMessage}
                  </p>
                </>
              )}
              {connectionState === 'new' && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                  Not Connected
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowChat(!showChat)}
            style={{
              padding: '0.5rem 1rem',
              background: showChat ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <MessageSquare size={18} />
            Chat
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
        {/* Main Video (Remote) */}
        <div style={{
          flex: 1,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
          {!callActive && !connecting && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Users size={64} style={{ color: '#6b7280', marginBottom: '1rem' }} />
              <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
                Click "Start Call" to begin the session
              </p>
            </div>
          )}
          {(connecting || (callActive && connectionState !== 'connected')) && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '2rem',
              borderRadius: '1rem',
              minWidth: '300px'
            }}>
              <Phone
                size={64}
                style={{
                  color: connectionState === 'failed' ? '#ef4444' : '#10b981',
                  marginBottom: '1rem',
                  animation: connectionState !== 'failed' ? 'pulse 2s infinite' : 'none'
                }}
              />
              <p style={{ color: 'white', fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                {connectionState === 'connecting' && 'Connecting...'}
                {connectionState === 'waiting' && `Calling ${student.name}...`}
                {connectionState === 'failed' && 'Connection Failed'}
              </p>
              <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                {statusMessage}
              </p>
              {connectionState === 'waiting' && (
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse 1s infinite'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse 1s infinite 0.2s'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    animation: 'pulse 1s infinite 0.4s'
                  }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Local Video (Self View) */}
        {callActive && (
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            right: showChat ? '22rem' : '2rem',
            width: '240px',
            height: '180px',
            background: '#000',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            border: '2px solid #374151',
            boxShadow: '0 10px 15px rgba(0,0,0,0.3)'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Mirror effect
              }}
            />
            {!videoEnabled && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <VideoOff size={32} style={{ color: '#9ca3af' }} />
              </div>
            )}
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div style={{
            width: '320px',
            background: '#111827',
            borderLeft: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #374151'
            }}>
              <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                Chat
              </h3>
            </div>
            <div style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto'
            }}>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center' }}>
                Chat functionality coming soon...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        padding: '2rem',
        background: '#111827',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        borderTop: '1px solid #374151'
      }}>
        {callActive ? (
          <>
            <button
              onClick={toggleAudio}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: audioEnabled ? '#374151' : '#ef4444',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {audioEnabled ? (
                <Mic size={24} style={{ color: 'white' }} />
              ) : (
                <MicOff size={24} style={{ color: 'white' }} />
              )}
            </button>

            <button
              onClick={endCall}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <PhoneOff size={28} style={{ color: 'white' }} />
            </button>

            <button
              onClick={toggleVideo}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: videoEnabled ? '#374151' : '#ef4444',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {videoEnabled ? (
                <Video size={24} style={{ color: 'white' }} />
              ) : (
                <VideoOff size={24} style={{ color: 'white' }} />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            style={{
              padding: '1rem 2rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1.125rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#10b981';
            }}
          >
            <Phone size={24} />
            Start Call
          </button>
        )}
      </div>
    </div>
  );
}
