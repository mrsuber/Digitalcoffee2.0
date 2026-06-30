const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { sendIncomingCallNotification, sendCallEndedNotification } = require('../services/firebase');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Middleware to check premium subscription or professional coach status
const checkPremiumAccess = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT u.subscription_status, u.role,
              CASE WHEN pc.id IS NOT NULL THEN true ELSE false END as is_professional_coach
       FROM users u
       LEFT JOIN professional_coaches pc ON pc.user_id = u.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Allow access if user has premium subscription OR is a professional coach
    if (user.subscription_status !== 'premium' && !user.is_professional_coach && user.role !== 'professional_coach') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription or professional coach status required for video calling'
      });
    }

    next();
  } catch (error) {
    console.error('Premium check error:', error);
    res.status(500).json({ success: false, message: 'Error checking subscription' });
  }
};

// ==================== COACH AVAILABILITY ====================

// Get coach availability (for students booking)
router.get('/coaches/:coachId/availability', checkPremiumAccess, async (req, res) => {
  try {
    const { coachId } = req.params;
    const { date } = req.query; // Optional: specific date

    // Get regular weekly availability
    const availability = await db.query(
      `SELECT day_of_week, start_time, end_time
       FROM coach_availability
       WHERE coach_id = $1 AND is_active = true
       ORDER BY day_of_week, start_time`,
      [coachId]
    );

    // Get blocked slots
    const blocked = await db.query(
      `SELECT blocked_date, start_time, end_time, reason
       FROM coach_blocked_slots
       WHERE coach_id = $1 AND blocked_date >= CURRENT_DATE
       ORDER BY blocked_date, start_time`,
      [coachId]
    );

    // Get existing bookings
    const bookings = await db.query(
      `SELECT scheduled_at, duration_minutes
       FROM call_bookings
       WHERE coach_id = $1
       AND status IN ('scheduled', 'confirmed', 'in_progress')
       AND scheduled_at >= CURRENT_TIMESTAMP
       ORDER BY scheduled_at`,
      [coachId]
    );

    res.json({
      success: true,
      data: {
        availability: availability.rows,
        blockedSlots: blocked.rows,
        bookedSlots: bookings.rows
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, message: 'Error fetching availability' });
  }
});

// Set coach availability (coaches only)
router.post('/coach/availability', checkPremiumAccess, [
  body('dayOfWeek').isInt({ min: 0, max: 6 }),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if user is a professional coach
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only professional coaches can set availability'
      });
    }

    const coachId = coachCheck.rows[0].id;
    const { dayOfWeek, startTime, endTime } = req.body;

    const result = await db.query(
      `INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (coach_id, day_of_week, start_time)
       DO UPDATE SET end_time = $4, is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [coachId, dayOfWeek, startTime, endTime]
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(500).json({ success: false, message: 'Error setting availability' });
  }
});

// Get my availability (for coaches)
router.get('/coach/availability', checkPremiumAccess, async (req, res) => {
  try {
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a professional coach' });
    }

    const coachId = coachCheck.rows[0].id;

    // Get weekly availability
    const availability = await db.query(
      `SELECT * FROM coach_availability
       WHERE coach_id = $1
       ORDER BY day_of_week, start_time`,
      [coachId]
    );

    // Get blocked slots
    const blocked = await db.query(
      `SELECT * FROM coach_blocked_slots
       WHERE coach_id = $1 AND blocked_date >= CURRENT_DATE
       ORDER BY blocked_date, start_time`,
      [coachId]
    );

    res.json({
      success: true,
      data: {
        weeklyAvailability: availability.rows,
        blockedSlots: blocked.rows
      }
    });
  } catch (error) {
    console.error('Get my availability error:', error);
    res.status(500).json({ success: false, message: 'Error fetching availability' });
  }
});

// Delete availability slot
router.delete('/coach/availability/:id', checkPremiumAccess, async (req, res) => {
  try {
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a professional coach' });
    }

    const result = await db.query(
      `DELETE FROM coach_availability
       WHERE id = $1 AND coach_id = $2
       RETURNING *`,
      [req.params.id, coachCheck.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Availability slot not found' });
    }

    res.json({ success: true, message: 'Availability slot deleted' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ success: false, message: 'Error deleting availability' });
  }
});

// Block date/time
router.post('/coach/block-slot', checkPremiumAccess, [
  body('blockedDate').isDate(),
  body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a professional coach' });
    }

    const { blockedDate, startTime, endTime, reason } = req.body;

    const result = await db.query(
      `INSERT INTO coach_blocked_slots (coach_id, blocked_date, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [coachCheck.rows[0].id, blockedDate, startTime || null, endTime || null, reason || null]
    );

    res.json({
      success: true,
      message: 'Time slot blocked successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Block slot error:', error);
    res.status(500).json({ success: false, message: 'Error blocking slot' });
  }
});

// Unblock date/time
router.delete('/coach/block-slot/:id', checkPremiumAccess, async (req, res) => {
  try {
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a professional coach' });
    }

    const result = await db.query(
      `DELETE FROM coach_blocked_slots
       WHERE id = $1 AND coach_id = $2
       RETURNING *`,
      [req.params.id, coachCheck.rows[0].id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blocked slot not found' });
    }

    res.json({ success: true, message: 'Slot unblocked successfully' });
  } catch (error) {
    console.error('Unblock slot error:', error);
    res.status(500).json({ success: false, message: 'Error unblocking slot' });
  }
});

// ==================== BOOKINGS ====================

// Create a booking
router.post('/bookings', checkPremiumAccess, [
  body('coachId').isInt(),
  body('scheduledAt').isISO8601(),
  body('bookingNotes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { coachId, scheduledAt, bookingNotes } = req.body;
    const studentId = req.user.userId;

    // Check if scheduled time is at least 24 hours in advance
    const scheduledTime = new Date(scheduledAt);
    const now = new Date();
    const hoursDifference = (scheduledTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return res.status(400).json({
        success: false,
        message: 'Bookings must be made at least 24 hours in advance'
      });
    }

    // Check if slot is available
    const conflictCheck = await db.query(
      `SELECT id FROM call_bookings
       WHERE coach_id = $1
       AND status IN ('scheduled', 'confirmed', 'in_progress')
       AND scheduled_at = $2`,
      [coachId, scheduledAt]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create booking
    const result = await db.query(
      `INSERT INTO call_bookings (coach_id, student_id, scheduled_at, booking_notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [coachId, studentId, scheduledAt, bookingNotes || null]
    );

    const booking = result.rows[0];

    // Create notification for coach
    await db.query(
      `INSERT INTO call_notifications (user_id, booking_id, notification_type, title, message)
       VALUES ($1, $2, 'booking_confirmed', 'New Booking Request',
       'You have a new session booking request')`,
      [coachId, booking.id]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
});

// Get my bookings (student or coach)
router.get('/bookings', checkPremiumAccess, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, upcoming } = req.query;

    // Check if user is a coach
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [userId]
    );

    let query;
    let params;

    if (coachCheck.rows.length > 0) {
      // User is a coach
      query = `
        SELECT b.*, u.name as student_name, u.email as student_email
        FROM call_bookings b
        JOIN users u ON b.student_id = u.id
        WHERE b.coach_id = $1
      `;
      params = [coachCheck.rows[0].id];
    } else {
      // User is a student
      query = `
        SELECT b.*, pc.full_name as coach_name, u.email as coach_email
        FROM call_bookings b
        JOIN professional_coaches pc ON b.coach_id = pc.id
        JOIN users u ON pc.user_id = u.id
        WHERE b.student_id = $1
      `;
      params = [userId];
    }

    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }

    if (upcoming === 'true') {
      query += ` AND b.scheduled_at >= CURRENT_TIMESTAMP`;
    }

    query += ` ORDER BY b.scheduled_at DESC`;

    const result = await db.query(query, params);

    res.json({ success: true, data: { bookings: result.rows } });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Cancel booking
router.delete('/bookings/:id', checkPremiumAccess, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.userId;

    // Get booking details
    const booking = await db.query(
      `SELECT b.*, pc.user_id as coach_user_id
       FROM call_bookings b
       JOIN professional_coaches pc ON b.coach_id = pc.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bookingData = booking.rows[0];

    // Check if user has permission to cancel
    if (bookingData.student_id !== userId && bookingData.coach_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update booking status
    const result = await db.query(
      `UPDATE call_bookings
       SET status = 'cancelled',
           cancelled_by = $1,
           cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [userId, bookingId]
    );

    // Notify the other party
    const notifyUserId = userId === bookingData.student_id
      ? bookingData.coach_user_id
      : bookingData.student_id;

    await db.query(
      `INSERT INTO call_notifications (user_id, booking_id, notification_type, title, message)
       VALUES ($1, $2, 'booking_cancelled', 'Session Cancelled', 'A session has been cancelled')`,
      [notifyUserId, bookingId]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling booking' });
  }
});

// ==================== SESSIONS ====================

// Create/Join session
router.post('/sessions/join', checkPremiumAccess, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.userId;

    // Get booking details
    const booking = await db.query(
      `SELECT b.*, pc.user_id as coach_user_id
       FROM call_bookings b
       JOIN professional_coaches pc ON b.coach_id = pc.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bookingData = booking.rows[0];

    // Verify user is part of this booking
    if (bookingData.student_id !== userId && bookingData.coach_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Check if session already exists
    let session = await db.query(
      `SELECT * FROM call_sessions WHERE booking_id = $1 AND status != 'completed'`,
      [bookingId]
    );

    if (session.rows.length === 0) {
      // Create new session
      const sessionToken = uuidv4();
      const roomId = `room_${uuidv4()}`;

      session = await db.query(
        `INSERT INTO call_sessions (booking_id, coach_id, student_id, session_token, room_id, status)
         VALUES ($1, $2, $3, $4, $5, 'waiting')
         RETURNING *`,
        [bookingId, bookingData.coach_id, bookingData.student_id, sessionToken, roomId]
      );
    }

    res.json({
      success: true,
      data: {
        session: session.rows[0],
        userType: userId === bookingData.coach_user_id ? 'coach' : 'student'
      }
    });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({ success: false, message: 'Error joining session' });
  }
});

// Get session history
router.get('/sessions/history', checkPremiumAccess, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    // Check if user is a coach
    const coachCheck = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [userId]
    );

    let query;
    let params;

    if (coachCheck.rows.length > 0) {
      query = `
        SELECT s.*, u.name as student_name
        FROM call_sessions s
        JOIN users u ON s.student_id = u.id
        WHERE s.coach_id = $1 AND s.status = 'completed'
        ORDER BY s.created_at DESC
        LIMIT $2
      `;
      params = [coachCheck.rows[0].id, limit];
    } else {
      query = `
        SELECT s.*, pc.full_name as coach_name
        FROM call_sessions s
        JOIN professional_coaches pc ON s.coach_id = pc.id
        WHERE s.student_id = $1 AND s.status = 'completed'
        ORDER BY s.created_at DESC
        LIMIT $2
      `;
      params = [userId, limit];
    }

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching session history' });
  }
});

// ==================== RECORDINGS (Admin Only) ====================

// Get all recordings (admin only)
router.get('/recordings', async (req, res) => {
  try {
    // Check if user is admin
    const userCheck = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { limit = 50, status } = req.query;

    let query = `
      SELECT r.*, s.room_id,
             u_student.name as student_name,
             pc.full_name as coach_name
      FROM call_recordings r
      JOIN call_sessions s ON r.session_id = s.id
      JOIN users u_student ON s.student_id = u_student.id
      JOIN professional_coaches pc ON s.coach_id = pc.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY r.created_at DESC LIMIT $${params.length}`;

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ success: false, message: 'Error fetching recordings' });
  }
});

// Delete recording (admin only)
router.delete('/recordings/:id', async (req, res) => {
  try {
    // Check if user is admin
    const userCheck = await db.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (!userCheck.rows[0] || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const result = await db.query(
      `UPDATE call_recordings
       SET status = 'deleted'
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recording not found' });
    }

    res.json({ success: true, message: 'Recording marked as deleted' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ success: false, message: 'Error deleting recording' });
  }
});

// ==================== INSTANT CALLING ====================

// Initiate instant call (coach calls student directly)
router.post('/instant-call/initiate', checkPremiumAccess, async (req, res) => {
  try {
    const { studentId } = req.body;
    const coachUserId = req.user.userId;

    // Verify user is a professional coach
    const coachCheck = await db.query(
      'SELECT id, full_name FROM professional_coaches WHERE user_id = $1',
      [coachUserId]
    );

    if (coachCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only professional coaches can initiate calls'
      });
    }

    const coach = coachCheck.rows[0];

    // Verify student exists and has relationship with coach
    const studentCheck = await db.query(
      `SELECT u.id, u.name, u.email, u.fcm_token
       FROM users u
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [studentId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = studentCheck.rows[0];

    // Create an instant call session
    const sessionToken = uuidv4();
    const roomId = `instant_${uuidv4()}`;

    const session = await db.query(
      `INSERT INTO call_sessions (
        coach_id, student_id, session_token, room_id,
        status, call_type
      )
      VALUES ($1, $2, $3, $4, 'waiting', 'instant')
      RETURNING *`,
      [coach.id, studentId, sessionToken, roomId]
    );

    // Create notification for student
    await db.query(
      `INSERT INTO call_notifications (
        user_id, session_id, notification_type, title, message
      )
      VALUES ($1, $2, 'incoming_call', $3, $4)`,
      [
        studentId,
        session.rows[0].id,
        'Incoming Call',
        `${coach.full_name} is calling you`
      ]
    );

    // Get WebRTC server instance and emit socket event
    const webrtcServer = req.app.get('webrtcServer');
    if (webrtcServer) {
      const socketSent = webrtcServer.emitInstantCallNotification(studentId, {
        sessionId: session.rows[0].id,
        coachName: coach.full_name,
        coachId: coach.id,
        roomId: roomId,
        timestamp: new Date().toISOString()
      });

      if (socketSent) {
        console.log('📡 Real-time socket notification sent to student');
      }
    }

    // Send push notification to student's device via FCM
    if (student.fcm_token) {
      try {
        await sendIncomingCallNotification(student.fcm_token, {
          coachName: coach.full_name,
          sessionId: session.rows[0].id,
          roomId: roomId
        });
        console.log(`📱 Push notification sent to ${student.name}`);
      } catch (fcmError) {
        console.error('FCM notification error:', fcmError);
        // Continue even if FCM fails - notification is saved in database
      }
    } else {
      console.log(`ℹ️  Student ${student.name} has no FCM token registered`);
    }

    res.json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        session: session.rows[0],
        studentName: student.name
      }
    });
  } catch (error) {
    console.error('Initiate instant call error:', error);
    res.status(500).json({ success: false, message: 'Error initiating call' });
  }
});

// Get pending instant calls (for students)
router.get('/instant-call/pending', checkPremiumAccess, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT s.*, pc.full_name as coach_name, u.email as coach_email
       FROM call_sessions s
       JOIN professional_coaches pc ON s.coach_id = pc.id
       JOIN users u ON pc.user_id = u.id
       WHERE s.student_id = $1
       AND s.call_type = 'instant'
       AND s.status = 'waiting'
       AND s.created_at > NOW() - INTERVAL '5 minutes'
       ORDER BY s.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get pending calls error:', error);
    res.status(500).json({ success: false, message: 'Error fetching pending calls' });
  }
});

// Answer instant call (student accepts)
router.post('/instant-call/:sessionId/answer', checkPremiumAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    console.log(`📞 Student ${userId} answering call session ${sessionId}`);

    // Update session status
    const result = await db.query(
      `UPDATE call_sessions
       SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND student_id = $2 AND status = 'waiting'
       RETURNING *`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Call session ${sessionId} not found or already answered`);
      return res.status(404).json({
        success: false,
        message: 'Call session not found or already answered'
      });
    }

    const session = result.rows[0];
    console.log(`✅ Session updated:`, session);

    // Get coach details to send socket notification
    const coachData = await db.query(
      `SELECT pc.id as coach_id, pc.user_id as coach_user_id, pc.full_name, u.name as student_name
       FROM professional_coaches pc
       JOIN call_sessions cs ON cs.coach_id = pc.id
       JOIN users u ON cs.student_id = u.id
       WHERE cs.id = $1`,
      [sessionId]
    );

    if (coachData.rows.length > 0) {
      const webrtcServer = req.app.get('webrtcServer');
      if (webrtcServer) {
        console.log(`📡 Notifying coach ${coachData.rows[0].coach_user_id} that call was answered`);
        webrtcServer.emitCallAnswered(coachData.rows[0].coach_user_id, {
          sessionId: session.id,
          roomId: session.room_id,
          studentName: coachData.rows[0].student_name,
          sessionToken: session.session_token,
          coachId: coachData.rows[0].coach_id,
          coachUserId: coachData.rows[0].coach_user_id,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`✅ Sending response with session data`);
    res.json({
      success: true,
      message: 'Call answered',
      data: {
        ...session,
        coach_user_id: coachData.rows[0]?.coach_user_id // Include coach's user_id for role detection
      }
    });
  } catch (error) {
    console.error('Answer call error:', error);
    res.status(500).json({ success: false, message: 'Error answering call' });
  }
});

// Cancel instant call (coach cancels before student joins)
router.post('/instant-call/:sessionId/cancel', checkPremiumAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;
    const coachUserId = req.user.userId;

    // Verify user is the coach for this session
    const sessionCheck = await db.query(
      `SELECT cs.*, pc.user_id as coach_user_id, u.name as student_name
       FROM call_sessions cs
       JOIN professional_coaches pc ON cs.coach_id = pc.id
       JOIN users u ON cs.student_id = u.id
       WHERE cs.id = $1 AND pc.user_id = $2 AND cs.status = 'waiting'`,
      [sessionId, coachUserId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found or already completed'
      });
    }

    const session = sessionCheck.rows[0];

    // Update session status
    const result = await db.query(
      `UPDATE call_sessions
       SET status = 'cancelled', ended_at = CURRENT_TIMESTAMP, disconnect_reason = $1
       WHERE id = $2
       RETURNING *`,
      [reason || 'coach_cancelled', sessionId]
    );

    // Emit socket event to student
    const webrtcServer = req.app.get('webrtcServer');
    if (webrtcServer) {
      webrtcServer.emitCallCancelled(session.student_id, {
        sessionId: session.id,
        reason: reason || 'coach_cancelled',
        timestamp: new Date().toISOString(),
        startedAt: session.created_at,
        cancelledAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Call cancelled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel call error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling call' });
  }
});

// Reject instant call
router.post('/instant-call/:sessionId/reject', checkPremiumAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await db.query(
      `UPDATE call_sessions
       SET status = 'cancelled', ended_at = CURRENT_TIMESTAMP, disconnect_reason = 'student_rejected'
       WHERE id = $1 AND student_id = $2 AND status = 'waiting'
       RETURNING *`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Call session not found'
      });
    }

    const session = result.rows[0];

    // Get coach user ID to send socket notification
    const coachData = await db.query(
      `SELECT pc.user_id, u.name as student_name
       FROM professional_coaches pc
       JOIN call_sessions cs ON cs.coach_id = pc.id
       JOIN users u ON cs.student_id = u.id
       WHERE cs.id = $1`,
      [sessionId]
    );

    if (coachData.rows.length > 0) {
      const webrtcServer = req.app.get('webrtcServer');
      if (webrtcServer) {
        webrtcServer.emitCallRejected(coachData.rows[0].user_id, {
          sessionId: session.id,
          studentName: coachData.rows[0].student_name,
          reason: 'student_rejected',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      message: 'Call rejected'
    });
  } catch (error) {
    console.error('Reject call error:', error);
    res.status(500).json({ success: false, message: 'Error rejecting call' });
  }
});

module.exports = router;
