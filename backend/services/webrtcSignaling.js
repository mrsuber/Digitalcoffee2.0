const { Server } = require('socket.io');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class WebRTCSignalingServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.activeSessions = new Map(); // roomId -> { coach, student, session }
    this.userSockets = new Map(); // userId -> socketId
    this.userRooms = new Map(); // userId -> Set of rooms they're in

    this.setupSocketHandlers();
  }

  // Public method to get io instance for use in routes
  getIO() {
    return this.io;
  }

  // Emit instant call notification to student
  emitInstantCallNotification(studentId, callData) {
    const socketId = this.userSockets.get(studentId.toString());
    if (socketId) {
      this.io.to(socketId).emit('incoming-instant-call', callData);
      console.log(`📞 Instant call notification sent to student ${studentId}`);
      return true;
    } else {
      console.log(`⚠️ Student ${studentId} not connected via socket`);
      return false;
    }
  }

  // Emit call cancelled notification to student
  emitCallCancelled(studentId, callData) {
    const socketId = this.userSockets.get(studentId.toString());
    if (socketId) {
      this.io.to(socketId).emit('call-cancelled', callData);
      console.log(`❌ Call cancelled notification sent to student ${studentId}`);
      return true;
    }
    return false;
  }

  // Emit call answered notification to coach
  emitCallAnswered(coachUserId, callData) {
    const userIdString = coachUserId.toString();
    const socketId = this.userSockets.get(userIdString);

    console.log(`📡 Attempting to send call-answered to coach ${coachUserId}`);
    console.log(`   Looking for userId: "${userIdString}"`);
    console.log(`   Socket ID found: ${socketId || 'NOT FOUND'}`);
    console.log(`   Currently registered users:`, Array.from(this.userSockets.keys()));

    if (socketId) {
      this.io.to(socketId).emit('call-answered', callData);
      console.log(`✅ Call answered notification sent to coach ${coachUserId} via socket ${socketId}`);
      return true;
    } else {
      console.error(`❌ Coach ${coachUserId} socket not found in userSockets map!`);
      return false;
    }
  }

  // Emit call rejected notification to coach
  emitCallRejected(coachUserId, callData) {
    const socketId = this.userSockets.get(coachUserId.toString());
    if (socketId) {
      this.io.to(socketId).emit('call-rejected', callData);
      console.log(`❌ Call rejected notification sent to coach ${coachUserId}`);
      return true;
    }
    return false;
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Register user for instant call notifications
      socket.on('register-user', (data) => {
        const { userId } = data;
        if (userId) {
          this.userSockets.set(userId.toString(), socket.id);
          console.log(`✅ User ${userId} registered with socket ${socket.id}`);
          socket.userId = userId; // Store userId on socket for cleanup
          socket.emit('registration-confirmed', { userId });
        }
      });

      // Join session room
      socket.on('join-session', async (data) => {
        try {
          const { sessionToken, userId, userType } = data;

          // Verify session exists and user has permission
          const session = await this.getSession(sessionToken);
          if (!session) {
            socket.emit('error', { message: 'Invalid session token' });
            return;
          }

          // Check user is part of this session
          if (session.coach_id !== userId && session.student_id !== userId) {
            socket.emit('error', { message: 'Unauthorized access to session' });
            return;
          }

          const roomId = session.room_id;
          socket.join(roomId);

          // Track user socket
          this.userSockets.set(userId, socket.id);

          // Update session with join time
          await this.updateSessionJoinTime(session.id, userId, userType);

          // Get or create session state
          if (!this.activeSessions.has(roomId)) {
            this.activeSessions.set(roomId, {
              sessionId: session.id,
              roomId,
              coach: null,
              student: null,
              startTime: null,
              chatMessages: []
            });
          }

          const sessionState = this.activeSessions.get(roomId);

          if (userType === 'coach') {
            sessionState.coach = { userId, socketId: socket.id, joined: true };
          } else {
            sessionState.student = { userId, socketId: socket.id, joined: true };
          }

          // Notify other user
          socket.to(roomId).emit('user-joined', {
            userId,
            userType,
            timestamp: new Date().toISOString()
          });

          // Send current session state to joining user
          socket.emit('session-state', {
            roomId,
            participants: {
              coach: sessionState.coach ? { joined: true } : { joined: false },
              student: sessionState.student ? { joined: true } : { joined: false }
            },
            chatMessages: sessionState.chatMessages
          });

          console.log(`User ${userId} (${userType}) joined room ${roomId}`);

        } catch (error) {
          console.error('Error joining session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // WebRTC Signaling: Offer
      socket.on('webrtc-offer', (data) => {
        const { roomId, offer, to } = data;
        socket.to(roomId).emit('webrtc-offer', {
          offer,
          from: socket.id
        });
        console.log('WebRTC offer sent to room:', roomId);
      });

      // WebRTC Signaling: Answer
      socket.on('webrtc-answer', (data) => {
        const { roomId, answer, to } = data;
        socket.to(roomId).emit('webrtc-answer', {
          answer,
          from: socket.id
        });
        console.log('WebRTC answer sent to room:', roomId);
      });

      // WebRTC Signaling: ICE Candidate
      socket.on('ice-candidate', (data) => {
        const { roomId, candidate } = data;
        socket.to(roomId).emit('ice-candidate', {
          candidate,
          from: socket.id
        });
      });

      // Call Started
      socket.on('call-started', async (data) => {
        const { roomId } = data;
        const sessionState = this.activeSessions.get(roomId);

        if (sessionState) {
          sessionState.startTime = new Date();

          // Update database - use 'in_progress' for consistency
          await db.query(
            `UPDATE call_sessions
             SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
             WHERE room_id = $1`,
            [roomId]
          );

          // Update booking status
          await db.query(
            `UPDATE call_bookings
             SET status = 'in_progress'
             WHERE id = (SELECT booking_id FROM call_sessions WHERE room_id = $1)`,
            [roomId]
          );

          // Notify both participants
          this.io.to(roomId).emit('call-started', {
            startTime: sessionState.startTime,
            maxDuration: 30 * 60 // 30 minutes in seconds
          });

          // Start 30-minute timer
          this.startSessionTimer(roomId, sessionState.sessionId);

          console.log('Call started in room:', roomId);
        }
      });

      // Chat Message
      socket.on('chat-message', async (data) => {
        const { roomId, message, userId, userName } = data;

        const sessionState = this.activeSessions.get(roomId);
        if (sessionState) {
          const chatMessage = {
            id: uuidv4(),
            userId,
            userName,
            message,
            timestamp: new Date().toISOString(),
            type: 'text'
          };

          sessionState.chatMessages.push(chatMessage);

          // Save to database
          await db.query(
            `INSERT INTO call_chat_messages (session_id, sender_id, message, message_type)
             VALUES ($1, $2, $3, $4)`,
            [sessionState.sessionId, userId, message, 'text']
          );

          // Broadcast to room
          this.io.to(roomId).emit('chat-message', chatMessage);
        }
      });

      // Screen Sharing Started
      socket.on('screen-share-start', async (data) => {
        const { roomId, userId } = data;

        const sessionState = this.activeSessions.get(roomId);
        if (sessionState) {
          // Record in database
          await db.query(
            `INSERT INTO screen_sharing_sessions (session_id, user_id, started_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)`,
            [sessionState.sessionId, userId]
          );

          // Notify other participant
          socket.to(roomId).emit('screen-share-started', { userId });
          console.log(`Screen sharing started by user ${userId} in room ${roomId}`);
        }
      });

      // Screen Sharing Stopped
      socket.on('screen-share-stop', async (data) => {
        const { roomId, userId } = data;

        const sessionState = this.activeSessions.get(roomId);
        if (sessionState) {
          // Update database
          await db.query(
            `UPDATE screen_sharing_sessions
             SET ended_at = CURRENT_TIMESTAMP,
                 duration_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))
             WHERE session_id = $1 AND user_id = $2 AND ended_at IS NULL`,
            [sessionState.sessionId, userId]
          );

          // Notify other participant
          socket.to(roomId).emit('screen-share-stopped', { userId });
        }
      });

      // Call Quality Metrics
      socket.on('quality-metrics', async (data) => {
        const { roomId, userId, metrics } = data;

        const sessionState = this.activeSessions.get(roomId);
        if (sessionState) {
          // Save metrics to database
          await db.query(
            `INSERT INTO call_quality_metrics
             (session_id, user_id, video_bitrate, audio_bitrate, packet_loss_percentage,
              latency_ms, jitter_ms, frame_rate, resolution, network_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              sessionState.sessionId, userId, metrics.videoBitrate, metrics.audioBitrate,
              metrics.packetLoss, metrics.latency, metrics.jitter, metrics.frameRate,
              metrics.resolution, metrics.networkType
            ]
          );
        }
      });

      // End Call
      socket.on('end-call', async (data) => {
        const { roomId, userId, reason } = data;
        await this.endSession(roomId, userId, reason);
      });

      // Connection issues - attempt reconnect
      socket.on('connection-issue', (data) => {
        const { roomId } = data;
        socket.to(roomId).emit('peer-connection-issue', {
          timestamp: new Date().toISOString()
        });
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Clean up user socket mapping
        if (socket.userId) {
          this.userSockets.delete(socket.userId.toString());
          console.log(`🔌 User ${socket.userId} disconnected and removed from socket map`);
        }

        // Find and handle any active sessions
        for (const [roomId, sessionState] of this.activeSessions.entries()) {
          if (
            (sessionState.coach && sessionState.coach.socketId === socket.id) ||
            (sessionState.student && sessionState.student.socketId === socket.id)
          ) {
            // Notify other participant about disconnect
            socket.to(roomId).emit('peer-disconnected', {
              timestamp: new Date().toISOString(),
              canReconnect: true
            });

            // Set reconnection timeout (60 seconds)
            setTimeout(() => {
              this.checkAndCleanupSession(roomId, sessionState.sessionId);
            }, 60000);
          }
        }
      });
    });
  }

  async getSession(sessionToken) {
    const result = await db.query(
      `SELECT s.*, b.duration_minutes
       FROM call_sessions s
       LEFT JOIN call_bookings b ON s.booking_id = b.id
       WHERE s.session_token = $1 AND s.status != 'completed'`,
      [sessionToken]
    );
    return result.rows[0];
  }

  async updateSessionJoinTime(sessionId, userId, userType) {
    const field = userType === 'coach' ? 'coach_joined_at' : 'student_joined_at';
    await db.query(
      `UPDATE call_sessions SET ${field} = CURRENT_TIMESTAMP WHERE id = $1`,
      [sessionId]
    );
  }

  startSessionTimer(roomId, sessionId) {
    // 30 minute limit
    const maxDuration = 30 * 60 * 1000; // milliseconds

    // Warning at 25 minutes
    setTimeout(() => {
      this.io.to(roomId).emit('time-warning', {
        timeRemaining: 5 * 60, // 5 minutes in seconds
        message: '5 minutes remaining in this session'
      });
    }, 25 * 60 * 1000);

    // Auto-end at 30 minutes
    setTimeout(async () => {
      await this.endSession(roomId, null, 'time_limit');
    }, maxDuration);
  }

  async endSession(roomId, endedBy, reason = 'normal') {
    const sessionState = this.activeSessions.get(roomId);

    if (sessionState) {
      const duration = sessionState.startTime
        ? Math.floor((new Date() - sessionState.startTime) / 1000)
        : 0;

      // Update database
      await db.query(
        `UPDATE call_sessions
         SET status = 'completed',
             ended_at = CURRENT_TIMESTAMP,
             duration_seconds = $1,
             ended_by = $2,
             disconnect_reason = $3
         WHERE id = $4`,
        [duration, endedBy, reason, sessionState.sessionId]
      );

      // Update booking
      await db.query(
        `UPDATE call_bookings
         SET status = 'completed'
         WHERE id = (SELECT booking_id FROM call_sessions WHERE id = $1)`,
        [sessionState.sessionId]
      );

      // Notify all participants
      this.io.to(roomId).emit('call-ended', {
        reason,
        duration,
        timestamp: new Date().toISOString()
      });

      // Cleanup
      this.activeSessions.delete(roomId);
      console.log('Session ended:', roomId, 'Reason:', reason);
    }
  }

  async checkAndCleanupSession(roomId, sessionId) {
    const sessionState = this.activeSessions.get(roomId);

    if (sessionState) {
      // Check if anyone reconnected
      const hasActiveConnections =
        (sessionState.coach && this.io.sockets.sockets.has(sessionState.coach.socketId)) ||
        (sessionState.student && this.io.sockets.sockets.has(sessionState.student.socketId));

      if (!hasActiveConnections) {
        // No one reconnected, end the session
        await this.endSession(roomId, null, 'disconnect_timeout');
      }
    }
  }
}

module.exports = WebRTCSignalingServer;
