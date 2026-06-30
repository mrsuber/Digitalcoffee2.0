const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const pool = db.pool;

// Send a coaching request
router.post('/request', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { coach_id, message } = req.body;
    const student_id = req.user.userId;

    console.log('Coaching request received:', { coach_id, student_id, has_message: !!message });

    if (!coach_id) {
      console.log('Validation failed: No coach_id');
      return res.status(400).json({
        success: false,
        message: 'Coach ID is required'
      });
    }

    if (coach_id === student_id) {
      console.log('Validation failed: Student requesting themselves');
      return res.status(400).json({
        success: false,
        message: 'You cannot request yourself as a coach'
      });
    }

    await client.query('BEGIN');

    // Check if coach user exists
    const coachCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [coach_id]
    );

    if (coachCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Check if there's already an active relationship
    const existingRelationship = await client.query(
      'SELECT id FROM coaching_relationships WHERE student_id = $1 AND coach_id = $2 AND is_active = true',
      [student_id, coach_id]
    );

    if (existingRelationship.rows.length > 0) {
      await client.query('ROLLBACK');
      console.log('Validation failed: Active relationship exists');
      return res.status(400).json({
        success: false,
        message: 'You already have an active coaching relationship with this user'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await client.query(
      'SELECT id FROM coaching_requests WHERE student_id = $1 AND coach_id = $2 AND status = $3',
      [student_id, coach_id, 'pending']
    );

    console.log('Existing request check:', { count: existingRequest.rows.length });

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      console.log('Validation failed: Pending request already exists');
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request to this coach'
      });
    }

    // Create the coaching request
    const insertQuery = `
      INSERT INTO coaching_requests (student_id, coach_id, message, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `;

    const result = await client.query(insertQuery, [student_id, coach_id, message || null]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Coaching request sent successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating coaching request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send coaching request'
    });
  } finally {
    client.release();
  }
});

// Get coaching requests (for coaches - incoming requests)
router.get('/requests/incoming', authenticateToken, async (req, res) => {
  try {
    const coach_id = req.user.userId;

    const query = `
      SELECT
        cr.id,
        cr.message,
        cr.status,
        cr.created_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        up.avatar_url as student_avatar
      FROM coaching_requests cr
      JOIN users u ON cr.student_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cr.coach_id = $1 AND cr.status = 'pending'
      ORDER BY cr.created_at DESC
    `;

    const result = await pool.query(query, [coach_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching requests'
    });
  }
});

// Get coaching requests (for students - outgoing requests)
router.get('/requests/outgoing', authenticateToken, async (req, res) => {
  try {
    const student_id = req.user.userId;

    const query = `
      SELECT
        cr.id,
        cr.message,
        cr.status,
        cr.created_at,
        u.id as coach_id,
        u.name as coach_name,
        u.email as coach_email,
        up.avatar_url as coach_avatar,
        up.students_coached,
        up.courses_helped_complete
      FROM coaching_requests cr
      JOIN users u ON cr.coach_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cr.student_id = $1
      ORDER BY cr.created_at DESC
    `;

    const result = await pool.query(query, [student_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching outgoing requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching requests'
    });
  }
});

// Accept a coaching request
router.post('/requests/:requestId/accept', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { requestId } = req.params;
    const coach_id = req.user.userId;

    await client.query('BEGIN');

    // Get the request
    const requestQuery = await client.query(
      'SELECT * FROM coaching_requests WHERE id = $1 AND coach_id = $2 AND status = $3',
      [requestId, coach_id, 'pending']
    );

    if (requestQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    const request = requestQuery.rows[0];

    // Update request status
    await client.query(
      'UPDATE coaching_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', requestId]
    );

    // Create coaching relationship
    // Use ON CONFLICT to handle race conditions where the relationship might already exist
    const relationshipQuery = `
      INSERT INTO coaching_relationships (student_id, coach_id, is_active)
      VALUES ($1, $2, true)
      ON CONFLICT (student_id, coach_id, is_active)
      DO UPDATE SET started_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const relationship = await client.query(relationshipQuery, [
      request.student_id,
      coach_id
    ]);

    // Update coach stats
    await client.query(
      `UPDATE user_profiles
       SET students_coached = students_coached + 1
       WHERE user_id = $1`,
      [coach_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: relationship.rows[0],
      message: 'Coaching request accepted'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting coaching request:', error);

    // Provide more specific error messages
    let errorMessage = 'Failed to accept coaching request';
    if (error.code === '23505') { // Unique violation
      errorMessage = 'This coaching relationship already exists';
    } else if (error.code === '23503') { // Foreign key violation
      errorMessage = 'User not found';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
});

// Reject a coaching request
router.post('/requests/:requestId/reject', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const coach_id = req.user.userId;

    const result = await pool.query(
      'UPDATE coaching_requests SET status = $1, updated_at = NOW() WHERE id = $2 AND coach_id = $3 AND status = $4 RETURNING *',
      ['rejected', requestId, coach_id, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Coaching request rejected'
    });
  } catch (error) {
    console.error('Error rejecting coaching request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject coaching request'
    });
  }
});

// Get my students (for coaches)
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const coach_id = req.user.userId;

    const query = `
      SELECT
        cr.id as relationship_id,
        cr.started_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        up.avatar_url as student_avatar,
        (SELECT COUNT(*) FROM coaching_milestones cm WHERE cm.relationship_id = cr.id) as total_milestones,
        (SELECT COUNT(*) FROM coaching_milestones cm WHERE cm.relationship_id = cr.id AND cm.milestone_type = 'course_completed') as courses_completed,
        (SELECT jsonb_agg(jsonb_build_object(
          'type', cm.milestone_type,
          'data', cm.milestone_data,
          'achieved_at', cm.achieved_at
        ) ORDER BY cm.achieved_at DESC)
        FROM coaching_milestones cm WHERE cm.relationship_id = cr.id LIMIT 5) as recent_milestones
      FROM coaching_relationships cr
      JOIN users u ON cr.student_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cr.coach_id = $1 AND cr.is_active = true
      ORDER BY cr.started_at DESC
    `;

    const result = await pool.query(query, [coach_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
});

// Get my coach (for students)
router.get('/my-coach', authenticateToken, async (req, res) => {
  try {
    const student_id = req.user.userId;

    const query = `
      SELECT
        cr.id as relationship_id,
        cr.started_at,
        u.id as coach_id,
        u.name as coach_name,
        u.email as coach_email,
        up.avatar_url as coach_avatar,
        up.students_coached,
        up.courses_helped_complete,
        up.coaching_bio,
        COALESCE(AVG(ratings.rating), 0) as average_rating,
        COUNT(ratings.id) as total_ratings
      FROM coaching_relationships cr
      JOIN users u ON cr.coach_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN coach_ratings ratings ON ratings.coach_id = u.id
      WHERE cr.student_id = $1 AND cr.is_active = true
      GROUP BY cr.id, cr.started_at, u.id, u.name, u.email, up.avatar_url, up.students_coached, up.courses_helped_complete, up.coaching_bio
      LIMIT 1
    `;

    const result = await pool.query(query, [student_id]);

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching coach:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coach information'
    });
  }
});

// Get student progress details (for coaches)
router.get('/students/:studentId/progress', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const coach_id = req.user.userId;

    // Verify coaching relationship
    const relationshipCheck = await pool.query(
      'SELECT id FROM coaching_relationships WHERE coach_id = $1 AND student_id = $2 AND is_active = true',
      [coach_id, studentId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an active coaching relationship with this student'
      });
    }

    // Get student progress data
    const progressQuery = `
      SELECT
        up.date,
        up.sessions_completed,
        up.total_minutes,
        up.streak_days,
        up.mood_rating
      FROM user_progress up
      WHERE up.user_id = $1
      ORDER BY up.date DESC
      LIMIT 30
    `;

    const coursesQuery = `
      SELECT
        c.id,
        c.title,
        c.mode,
        c.duration_days,
        uc.current_day,
        uc.started_at,
        uc.completed_at
      FROM user_courses uc
      JOIN courses c ON uc.course_id = c.id
      WHERE uc.user_id = $1
      ORDER BY uc.started_at DESC
    `;

    const milestonesQuery = `
      SELECT
        cm.milestone_type,
        cm.milestone_data,
        cm.achieved_at
      FROM coaching_milestones cm
      JOIN coaching_relationships cr ON cm.relationship_id = cr.id
      WHERE cr.student_id = $1 AND cr.coach_id = $2
      ORDER BY cm.achieved_at DESC
    `;

    const [progressResult, coursesResult, milestonesResult] = await Promise.all([
      pool.query(progressQuery, [studentId]),
      pool.query(coursesQuery, [studentId]),
      pool.query(milestonesQuery, [studentId, coach_id])
    ]);

    res.json({
      success: true,
      data: {
        progress: progressResult.rows,
        courses: coursesResult.rows,
        milestones: milestonesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student progress'
    });
  }
});

// End coaching relationship
router.post('/relationships/:relationshipId/end', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    await client.query('BEGIN');

    // Get the relationship
    const relationshipQuery = await client.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND (student_id = $2 OR coach_id = $2) AND is_active = true',
      [relationshipId, userId]
    );

    if (relationshipQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Active coaching relationship not found'
      });
    }

    // End the relationship
    await client.query(
      'UPDATE coaching_relationships SET is_active = false, ended_at = NOW() WHERE id = $1',
      [relationshipId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Coaching relationship ended'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending coaching relationship:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end coaching relationship'
    });
  } finally {
    client.release();
  }
});

// Get user coaching profile (public)
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT
        u.id,
        u.name,
        u.email,
        up.avatar_url,
        up.students_coached,
        up.courses_helped_complete,
        up.is_available_as_coach,
        up.coaching_bio,
        (SELECT COUNT(*) FROM coaching_relationships WHERE coach_id = u.id AND is_active = true) as active_students
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching coaching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching profile'
    });
  }
});

// ============================================
// COACHING MESSAGES ENDPOINTS
// ============================================

// Send message to coach or student
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { relationship_id, message } = req.body;
    const sender_id = req.user.userId;

    if (!relationship_id || !message) {
      return res.status(400).json({
        success: false,
        message: 'Relationship ID and message are required'
      });
    }

    // Verify relationship exists and user is part of it
    const relationship = await pool.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND (student_id = $2 OR coach_id = $2) AND is_active = true',
      [relationship_id, sender_id]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this coaching relationship'
      });
    }

    const rel = relationship.rows[0];
    const receiver_id = sender_id === rel.coach_id ? rel.student_id : rel.coach_id;

    // Insert message
    const result = await pool.query(
      `INSERT INTO coaching_messages (relationship_id, sender_id, receiver_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [relationship_id, sender_id, receiver_id, message]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Get messages for a relationship
router.get('/messages/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify user is part of relationship
    const relationship = await pool.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND (student_id = $2 OR coach_id = $2)',
      [relationshipId, userId]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages
    const messages = await pool.query(
      `SELECT
        cm.*,
        sender.name as sender_name,
        receiver.name as receiver_name
       FROM coaching_messages cm
       JOIN users sender ON cm.sender_id = sender.id
       JOIN users receiver ON cm.receiver_id = receiver.id
       WHERE cm.relationship_id = $1
       ORDER BY cm.created_at ASC`,
      [relationshipId]
    );

    // Mark received messages as read
    await pool.query(
      `UPDATE coaching_messages
       SET is_read = true, read_at = NOW()
       WHERE relationship_id = $1 AND receiver_id = $2 AND is_read = false`,
      [relationshipId, userId]
    );

    res.json({
      success: true,
      data: messages.rows
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Get unread message count
router.get('/messages/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT COUNT(*) as count FROM coaching_messages WHERE receiver_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      success: true,
      data: { count: parseInt(result.rows[0].count) }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

// ============================================
// COACH CHECK-INS ENDPOINTS
// ============================================

// Create check-in (coach checks on student)
router.post('/checkins', authenticateToken, async (req, res) => {
  try {
    const { relationship_id, notes } = req.body;
    const coach_id = req.user.userId;

    // Verify coach owns this relationship
    const relationship = await pool.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND coach_id = $2 AND is_active = true',
      [relationship_id, coach_id]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or relationship not found'
      });
    }

    const student_id = relationship.rows[0].student_id;

    // Create check-in
    const result = await pool.query(
      `INSERT INTO coach_checkins (relationship_id, coach_id, student_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [relationship_id, coach_id, student_id, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create check-in'
    });
  }
});

// Get check-in history for a relationship
router.get('/checkins/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify access
    const relationship = await pool.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND (student_id = $2 OR coach_id = $2)',
      [relationshipId, userId]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const checkins = await pool.query(
      `SELECT
        cc.*,
        u.name as coach_name
       FROM coach_checkins cc
       JOIN users u ON cc.coach_id = u.id
       WHERE cc.relationship_id = $1
       ORDER BY cc.checked_at DESC`,
      [relationshipId]
    );

    res.json({
      success: true,
      data: checkins.rows
    });
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch check-ins'
    });
  }
});

// ============================================
// COACH RATINGS ENDPOINTS
// ============================================

// Submit rating for coach (student only)
router.post('/ratings', authenticateToken, async (req, res) => {
  try {
    const { relationship_id, rating, feedback } = req.body;
    const student_id = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Verify student owns this relationship
    const relationship = await pool.query(
      'SELECT * FROM coaching_relationships WHERE id = $1 AND student_id = $2',
      [relationship_id, student_id]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied or relationship not found'
      });
    }

    const coach_id = relationship.rows[0].coach_id;

    // Insert or update rating
    const result = await pool.query(
      `INSERT INTO coach_ratings (relationship_id, student_id, coach_id, rating, feedback)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (relationship_id)
       DO UPDATE SET rating = $4, feedback = $5, created_at = NOW()
       RETURNING *`,
      [relationship_id, student_id, coach_id, rating, feedback]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating'
    });
  }
});

// Get my ratings as a coach
router.get('/my-ratings', authenticateToken, async (req, res) => {
  try {
    const coach_id = req.user.userId;

    const result = await pool.query(
      `SELECT
        cr.*,
        u.name as student_name,
        u.email as student_email
       FROM coach_ratings cr
       JOIN users u ON cr.student_id = u.id
       WHERE cr.coach_id = $1
       ORDER BY cr.created_at DESC`,
      [coach_id]
    );

    // Calculate average rating
    const avgRating = result.rows.length > 0
      ? result.rows.reduce((sum, r) => sum + r.rating, 0) / result.rows.length
      : 0;

    res.json({
      success: true,
      reviews: result.rows,
      stats: {
        total_reviews: result.rows.length,
        avg_rating: avgRating.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching my ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// Get coach ratings
router.get('/ratings/:coachId', authenticateToken, async (req, res) => {
  try {
    const { coachId } = req.params;

    const result = await pool.query(
      `SELECT
        cr.*,
        u.name as student_name
       FROM coach_ratings cr
       JOIN users u ON cr.student_id = u.id
       WHERE cr.coach_id = $1
       ORDER BY cr.created_at DESC`,
      [coachId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// ============================================
// ENHANCED COACHING DASHBOARD ENDPOINTS
// ============================================

// Get coach dashboard with all stats
router.get('/dashboard/coach', authenticateToken, async (req, res) => {
  try {
    const coach_id = req.user.userId;

    const stats = await pool.query(
      'SELECT * FROM coach_dashboard_stats WHERE coach_id = $1',
      [coach_id]
    );

    res.json({
      success: true,
      data: stats.rows[0] || {
        coach_id,
        active_students: 0,
        total_students_ever: 0,
        average_rating: null,
        total_checkins: 0,
        total_messages_sent: 0
      }
    });
  } catch (error) {
    console.error('Error fetching coach dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coach dashboard'
    });
  }
});

// Get admin coaching analytics
router.get('/admin/analytics', authenticateToken, async (req, res) => {
  try {
    // TODO: Add admin role check
    const analytics = await pool.query('SELECT * FROM admin_coaching_analytics');

    // Get top coaches
    const topCoaches = await pool.query(
      `SELECT * FROM coach_dashboard_stats
       ORDER BY active_students DESC, average_rating DESC
       LIMIT 10`
    );

    // Get recent activity
    const recentActivity = await pool.query(
      `SELECT
        'checkin' as type,
        cc.checked_at as timestamp,
        coach.name as coach_name,
        student.name as student_name
       FROM coach_checkins cc
       JOIN users coach ON cc.coach_id = coach.id
       JOIN users student ON cc.student_id = student.id
       WHERE cc.checked_at > NOW() - INTERVAL '7 days'
       ORDER BY cc.checked_at DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        overview: analytics.rows[0],
        topCoaches: topCoaches.rows,
        recentActivity: recentActivity.rows
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

module.exports = router;
