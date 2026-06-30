const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireProfessionalCoach } = require('../middleware/auth');

// All routes require authentication and professional_coach role
router.use(authenticateToken, requireProfessionalCoach);

// Get coach profile
router.get('/profile', async (req, res) => {
  try {
    const coachResult = await db.query(
      `SELECT
        pc.*,
        u.email,
        u.name as user_name,
        COUNT(DISTINCT cs.user_id) as total_students,
        AVG(cr.rating)::NUMERIC(3,2) as average_rating,
        COUNT(DISTINCT cr.id) as total_reviews
      FROM professional_coaches pc
      JOIN users u ON pc.user_id = u.id
      LEFT JOIN professional_coaching_sessions cs ON pc.id = cs.coach_id AND cs.status != 'cancelled'
      LEFT JOIN professional_coach_reviews cr ON pc.id = cr.coach_id
      WHERE pc.user_id = $1
      GROUP BY pc.id, u.email, u.name`,
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    res.json({
      success: true,
      coach: coachResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching coach profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coach profile'
    });
  }
});

// Get coach's students
router.get('/students', async (req, res) => {
  try {
    // First get the coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    console.log('🔍 Coach lookup for user_id:', req.user.userId, 'Result:', coachResult.rows);

    if (coachResult.rows.length === 0) {
      console.log('⚠️ No professional_coaches record found for user_id:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;
    console.log('✅ Coach ID:', coachId);

    // Get all students from active relationships
    const studentsResult = await db.query(
      `SELECT
        u.id as user_id,
        u.name,
        u.email,
        u.created_at as joined_date,
        pcr.started_at as relationship_started,
        pcr.id as relationship_id,
        COUNT(DISTINCT cs.id) as total_sessions,
        MAX(cs.scheduled_at) as last_session_date,
        COUNT(DISTINCT CASE WHEN cs.status = 'completed' THEN cs.id END) as completed_sessions,
        COUNT(DISTINCT CASE WHEN cs.status = 'scheduled' THEN cs.id END) as upcoming_sessions,
        AVG(CASE WHEN cs.status = 'completed' THEN cs.student_rating END)::NUMERIC(3,2) as avg_session_rating
      FROM professional_coaching_relationships pcr
      JOIN users u ON pcr.user_id = u.id
      LEFT JOIN professional_coaching_sessions cs ON cs.coach_id = $1 AND cs.user_id = u.id
      WHERE pcr.coach_id = $1 AND pcr.status = 'active'
      GROUP BY u.id, u.name, u.email, u.created_at, pcr.started_at, pcr.id
      ORDER BY pcr.started_at DESC`,
      [coachId]
    );

    console.log(`📊 Found ${studentsResult.rows.length} students for coach ID ${coachId}`);

    res.json({
      success: true,
      students: studentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get student details with session history
router.get('/students/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Get student details
    const studentResult = await db.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.created_at as joined_date
      FROM users u
      WHERE u.id = $1`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get session history for this student with this coach
    const sessionsResult = await db.query(
      `SELECT
        cs.*,
        u.name as student_name
      FROM professional_coaching_sessions cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.coach_id = $1 AND cs.user_id = $2
      ORDER BY cs.scheduled_at DESC`,
      [coachId, studentId]
    );

    // Get student's progress metrics
    const progressResult = await db.query(
      `SELECT
        COUNT(DISTINCT DATE(created_at)) as total_check_ins,
        AVG(CASE
          WHEN mood = 'inspired' THEN 5
          WHEN mood = 'clear' THEN 4
          WHEN mood = 'tired' THEN 3
          WHEN mood = 'anxious' THEN 2
          WHEN mood = 'foggy' THEN 1
          ELSE 3
        END)::NUMERIC(3,2) as avg_mood,
        AVG(CASE
          WHEN focus_level = 'high' THEN 3
          WHEN focus_level = 'medium' THEN 2
          WHEN focus_level = 'low' THEN 1
          ELSE 2
        END)::NUMERIC(3,2) as avg_focus
      FROM mood_checkins
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'`,
      [studentId]
    );

    res.json({
      success: true,
      student: studentResult.rows[0],
      sessions: sessionsResult.rows,
      progress: progressResult.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details'
    });
  }
});

// Get coach's sessions
router.get('/sessions', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    let query = `
      SELECT
        cs.*,
        u.name as student_name,
        u.email as student_email
      FROM professional_coaching_sessions cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.coach_id = $1
    `;

    const params = [coachId];

    if (status) {
      query += ` AND cs.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY cs.scheduled_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const sessionsResult = await db.query(query, params);

    res.json({
      success: true,
      sessions: sessionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Update session notes
router.put('/sessions/:sessionId/notes', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Verify the session belongs to this coach
    const sessionCheck = await db.query(
      'SELECT id FROM professional_coaching_sessions WHERE id = $1 AND coach_id = $2',
      [sessionId, coachId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Session does not belong to this coach'
      });
    }

    // Update notes
    const result = await db.query(
      `UPDATE professional_coaching_sessions
       SET notes = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, sessionId]
    );

    res.json({
      success: true,
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating session notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session notes'
    });
  }
});

// Complete a session
router.post('/sessions/:sessionId/complete', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Verify the session belongs to this coach
    const sessionCheck = await db.query(
      'SELECT id FROM professional_coaching_sessions WHERE id = $1 AND coach_id = $2',
      [sessionId, coachId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Session does not belong to this coach'
      });
    }

    // Update session status to completed
    const result = await db.query(
      `UPDATE professional_coaching_sessions
       SET status = 'completed',
           notes = COALESCE($1, notes),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, sessionId]
    );

    res.json({
      success: true,
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete session'
    });
  }
});

// Get coach analytics/statistics
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Get session statistics
    const statsResult = await db.query(
      `SELECT
        COUNT(DISTINCT user_id) as total_students,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as upcoming_sessions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
        AVG(CASE WHEN student_rating IS NOT NULL THEN student_rating END)::NUMERIC(3,2) as avg_rating
      FROM professional_coaching_sessions
      WHERE coach_id = $1
        AND scheduled_at >= NOW() - INTERVAL '${days} days'`,
      [coachId]
    );

    // Get recent reviews
    const reviewsResult = await db.query(
      `SELECT
        cr.*,
        u.name as user_name
      FROM professional_coach_reviews cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.coach_id = $1
      ORDER BY cr.created_at DESC
      LIMIT 5`,
      [coachId]
    );

    // Get session trend data
    const trendResult = await db.query(
      `SELECT
        DATE(scheduled_at) as date,
        COUNT(*) as session_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM professional_coaching_sessions
      WHERE coach_id = $1
        AND scheduled_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(scheduled_at)
      ORDER BY date`,
      [coachId]
    );

    res.json({
      success: true,
      stats: statsResult.rows[0] || {},
      recentReviews: reviewsResult.rows,
      trend: trendResult.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Get coach reviews
router.get('/reviews', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    const reviewsResult = await db.query(
      `SELECT
        cr.*,
        u.name as user_name
      FROM professional_coach_reviews cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.coach_id = $1
      ORDER BY cr.created_at DESC
      LIMIT $2`,
      [coachId, limit]
    );

    res.json({
      success: true,
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
});

// Get pending applications for this coach
router.get('/applications/pending', async (req, res) => {
  try {
    // Get coach ID
    const coachResult = await db.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Get all pending applications
    const applicationsResult = await db.query(
      `SELECT
        pcr.id as relationship_id,
        pcr.user_id,
        pcr.goals,
        pcr.created_at as applied_at,
        u.name,
        u.email,
        u.created_at as user_joined_at,
        COUNT(DISTINCT mc.id) as total_check_ins,
        AVG(CASE
          WHEN mc.mood = 'inspired' THEN 5
          WHEN mc.mood = 'clear' THEN 4
          WHEN mc.mood = 'tired' THEN 3
          WHEN mc.mood = 'anxious' THEN 2
          WHEN mc.mood = 'foggy' THEN 1
          ELSE 3
        END)::NUMERIC(3,2) as avg_mood
      FROM professional_coaching_relationships pcr
      JOIN users u ON pcr.user_id = u.id
      LEFT JOIN mood_checkins mc ON u.id = mc.user_id
      WHERE pcr.coach_id = $1 AND pcr.status = 'pending'
      GROUP BY pcr.id, pcr.user_id, pcr.goals, pcr.created_at, u.name, u.email, u.created_at
      ORDER BY pcr.created_at DESC`,
      [coachId]
    );

    res.json({
      success: true,
      applications: applicationsResult.rows
    });
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending applications'
    });
  }
});

// Accept a student application
router.post('/applications/:relationshipId/accept', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Get coach ID
    const coachResult = await client.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;
    const { relationshipId } = req.params;

    // Verify this application belongs to this coach and is pending
    const relationshipCheck = await client.query(
      'SELECT * FROM professional_coaching_relationships WHERE id = $1 AND coach_id = $2 AND status = $3',
      [relationshipId, coachId, 'pending']
    );

    if (relationshipCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Application not found or already processed'
      });
    }

    // Update relationship status to active
    const updateResult = await client.query(
      `UPDATE professional_coaching_relationships
       SET status = 'active', started_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [relationshipId]
    );

    // Increment coach's total students count
    await client.query(
      'UPDATE professional_coaches SET total_students = total_students + 1, updated_at = NOW() WHERE id = $1',
      [coachId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      relationship: updateResult.rows[0],
      message: 'Student application accepted successfully!'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept application'
    });
  } finally {
    client.release();
  }
});

// Reject a student application
router.post('/applications/:relationshipId/reject', async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { relationshipId } = req.params;
    const { reason } = req.body; // Optional rejection reason

    // Get coach ID
    const coachResult = await client.query(
      'SELECT id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coachId = coachResult.rows[0].id;

    // Verify this application belongs to this coach and is pending
    const relationshipCheck = await client.query(
      'SELECT * FROM professional_coaching_relationships WHERE id = $1 AND coach_id = $2 AND status = $3',
      [relationshipId, coachId, 'pending']
    );

    if (relationshipCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Application not found or already processed'
      });
    }

    // Update relationship status to cancelled with optional reason
    const updateResult = await client.query(
      `UPDATE professional_coaching_relationships
       SET status = 'cancelled',
           ended_at = NOW(),
           notes = COALESCE($2, 'Application declined by coach'),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [relationshipId, reason]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      relationship: updateResult.rows[0],
      message: 'Student application rejected'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject application'
    });
  } finally {
    client.release();
  }
});

// Get messages for a specific student
router.get('/messages/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50 } = req.query;

    console.log('💬 Fetching messages - User ID:', req.user.userId, 'Student ID:', studentId);

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id, user_id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      console.log('⚠️ No professional_coaches record found for user_id:', req.user.userId);
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coach = coachResult.rows[0];
    console.log('✅ Coach found - ID:', coach.id, 'User ID:', coach.user_id);

    // Get the coaching relationship
    const relationshipResult = await db.query(
      `SELECT cr.id
       FROM coaching_relationships cr
       WHERE cr.coach_id = $1 AND cr.student_id = $2 AND cr.is_active = true

       UNION

       SELECT pcr.id
       FROM professional_coaching_relationships pcr
       WHERE pcr.coach_id = $1 AND pcr.user_id = $2 AND pcr.status = 'active'`,
      [coach.id, studentId]
    );

    console.log('🔗 Relationship lookup - Coach ID:', coach.id, 'Student ID:', studentId, 'Found:', relationshipResult.rows.length);

    if (relationshipResult.rows.length === 0) {
      console.log('⚠️ No active relationship found');
      return res.status(403).json({
        success: false,
        message: 'No active coaching relationship with this student'
      });
    }

    const relationshipId = relationshipResult.rows[0].id;
    console.log('✅ Relationship ID:', relationshipId);

    // Get messages from both tables (peer coaching and professional coaching)
    const messagesResult = await db.query(
      `SELECT
        cm.id,
        cm.relationship_id,
        cm.sender_id,
        cm.receiver_id,
        cm.message,
        cm.is_read,
        cm.created_at,
        cm.read_at,
        sender.name as sender_name,
        sender.email as sender_email,
        receiver.name as receiver_name,
        receiver.email as receiver_email
       FROM coaching_messages cm
       JOIN users sender ON cm.sender_id = sender.id
       JOIN users receiver ON cm.receiver_id = receiver.id
       WHERE cm.relationship_id = $1

       UNION ALL

       SELECT
        pcm.id,
        pcm.relationship_id,
        pcm.sender_id,
        pcm.receiver_id,
        pcm.message,
        pcm.is_read,
        pcm.created_at,
        pcm.read_at,
        sender.name as sender_name,
        sender.email as sender_email,
        receiver.name as receiver_name,
        receiver.email as receiver_email
       FROM professional_coaching_messages pcm
       JOIN users sender ON pcm.sender_id = sender.id
       JOIN users receiver ON pcm.receiver_id = receiver.id
       WHERE pcm.relationship_id = $1

       ORDER BY created_at DESC
       LIMIT $2`,
      [relationshipId, limit]
    );

    // Mark messages from student as read in both tables
    await db.query(
      `UPDATE coaching_messages
       SET is_read = true, read_at = NOW()
       WHERE relationship_id = $1 AND receiver_id = $2 AND is_read = false`,
      [relationshipId, coach.user_id]
    );

    await db.query(
      `UPDATE professional_coaching_messages
       SET is_read = true, read_at = NOW()
       WHERE relationship_id = $1 AND receiver_id = $2 AND is_read = false`,
      [relationshipId, coach.user_id]
    );

    res.json({
      success: true,
      messages: messagesResult.rows.reverse(), // Reverse to show oldest first
      relationship_id: relationshipId
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send a message to a student
router.post('/messages/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get coach ID
    const coachResult = await db.query(
      'SELECT id, user_id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coach = coachResult.rows[0];

    // Get the coaching relationship
    const relationshipResult = await db.query(
      `SELECT cr.id
       FROM coaching_relationships cr
       WHERE cr.coach_id = $1 AND cr.student_id = $2 AND cr.is_active = true

       UNION

       SELECT pcr.id
       FROM professional_coaching_relationships pcr
       WHERE pcr.coach_id = $1 AND pcr.user_id = $2 AND pcr.status = 'active'`,
      [coach.id, studentId]
    );

    if (relationshipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No active coaching relationship with this student'
      });
    }

    const relationshipId = relationshipResult.rows[0].id;

    // Determine if this is a professional coaching relationship
    const isProfessional = await db.query(
      'SELECT id FROM professional_coaching_relationships WHERE id = $1',
      [relationshipId]
    );

    // Insert message into the appropriate table
    let messageResult;
    if (isProfessional.rows.length > 0) {
      messageResult = await db.query(
        `INSERT INTO professional_coaching_messages (relationship_id, sender_id, receiver_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [relationshipId, coach.user_id, studentId, message.trim()]
      );
    } else {
      messageResult = await db.query(
        `INSERT INTO coaching_messages (relationship_id, sender_id, receiver_id, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [relationshipId, coach.user_id, studentId, message.trim()]
      );
    }

    // Get coach details for notification
    const coachDetailsResult = await db.query(
      'SELECT pc.full_name FROM professional_coaches pc WHERE pc.user_id = $1',
      [coach.user_id]
    );

    const coachName = coachDetailsResult.rows[0]?.full_name || 'Your Coach';

    // Create notification for the student
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        studentId,
        'new_message',
        'New message from your coach',
        `${coachName}: ${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}`,
        JSON.stringify({
          sender_id: coach.user_id,
          sender_name: coachName,
          message_id: messageResult.rows[0].id,
          relationship_id: relationshipId,
          is_professional_coach: isProfessional.rows.length > 0
        })
      ]
    );

    res.json({
      success: true,
      message: messageResult.rows[0]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Get all conversations with unread counts
router.get('/conversations', async (req, res) => {
  try {
    // Get coach ID
    const coachResult = await db.query(
      'SELECT id, user_id FROM professional_coaches WHERE user_id = $1',
      [req.user.userId]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach profile not found'
      });
    }

    const coach = coachResult.rows[0];

    // Get all conversations from both coaching tables
    const conversationsResult = await db.query(
      `SELECT DISTINCT ON (u.id)
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.avatar_url,
        latest_msg.message as last_message,
        latest_msg.created_at as last_message_at,
        latest_msg.sender_id as last_sender_id,
        (SELECT COUNT(*)
         FROM coaching_messages cm2
         WHERE cm2.receiver_id = $1
         AND cm2.sender_id = u.id
         AND cm2.is_read = false) as unread_count
       FROM (
         SELECT cr.student_id as user_id
         FROM coaching_relationships cr
         WHERE cr.coach_id = $2 AND cr.status = 'active'

         UNION

         SELECT pcr.user_id
         FROM professional_coaching_relationships pcr
         WHERE pcr.coach_id = $2 AND pcr.status = 'active'
       ) active_students
       JOIN users u ON active_students.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT cm.message, cm.created_at, cm.sender_id
         FROM coaching_messages cm
         WHERE (cm.sender_id = u.id AND cm.receiver_id = $1)
            OR (cm.sender_id = $1 AND cm.receiver_id = u.id)
         ORDER BY cm.created_at DESC
         LIMIT 1
       ) latest_msg ON true
       ORDER BY u.id, latest_msg.created_at DESC NULLS LAST`,
      [coach.user_id, coach.id]
    );

    res.json({
      success: true,
      conversations: conversationsResult.rows
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

module.exports = router;
