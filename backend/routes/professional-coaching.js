const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const pool = db.pool;

// =====================================================
// PUBLIC ENDPOINTS (No auth required)
// =====================================================

// Get all professional coaches (with pagination)
router.get('/coaches', async (req, res) => {
  try {
    const { specialty, limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        pc.*,
        COUNT(DISTINCT pcr.user_id) as total_reviews,
        COALESCE(AVG(pcr.rating), 0) as average_rating
      FROM professional_coaches pc
      LEFT JOIN professional_coach_reviews pcr ON pc.id = pcr.coach_id
      WHERE pc.is_active = true AND pc.is_accepting_students = true
    `;

    const params = [];
    let paramCount = 1;

    if (specialty) {
      query += ` AND $${paramCount} = ANY(pc.specialties)`;
      params.push(specialty);
      paramCount++;
    }

    query += `
      GROUP BY pc.id
      ORDER BY average_rating DESC, pc.total_students DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching professional coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional coaches'
    });
  }
});

// Get specific professional coach by ID
router.get('/coaches/:coachId', async (req, res) => {
  try {
    const { coachId } = req.params;

    const coachQuery = `
      SELECT
        pc.*,
        COUNT(DISTINCT pcr.id) as total_reviews,
        COALESCE(AVG(pcr.rating), 0) as average_rating,
        COUNT(DISTINCT pcrel.id) FILTER (WHERE pcrel.status = 'active') as current_students
      FROM professional_coaches pc
      LEFT JOIN professional_coach_reviews pcr ON pc.id = pcr.coach_id
      LEFT JOIN professional_coaching_relationships pcrel ON pc.id = pcrel.coach_id
      WHERE pc.id = $1 AND pc.is_active = true
      GROUP BY pc.id
    `;

    const coachResult = await pool.query(coachQuery, [coachId]);

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Professional coach not found'
      });
    }

    // Get recent reviews
    const reviewsQuery = `
      SELECT
        pcr.rating,
        pcr.review,
        pcr.created_at,
        u.name as user_name
      FROM professional_coach_reviews pcr
      JOIN users u ON pcr.user_id = u.id
      WHERE pcr.coach_id = $1 AND pcr.is_verified = true
      ORDER BY pcr.created_at DESC
      LIMIT 10
    `;

    const reviewsResult = await pool.query(reviewsQuery, [coachId]);

    res.json({
      success: true,
      data: {
        ...coachResult.rows[0],
        reviews: reviewsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching professional coach:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional coach details'
    });
  }
});

// =====================================================
// PROTECTED ENDPOINTS (Require authentication)
// =====================================================
router.use(authenticateToken);

// Check if user has premium access
const requirePremium = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT user_has_premium($1) as has_premium',
      [userId]
    );

    if (!result.rows[0].has_premium) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required',
        upgrade_required: true
      });
    }

    next();
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying subscription'
    });
  }
};

// Request a professional coach (requires premium)
router.post('/request-coach', requirePremium, async (req, res) => {
  const client = await pool.connect();

  try {
    const { coach_id, goals } = req.body;
    const user_id = req.user.userId;

    if (!coach_id) {
      return res.status(400).json({
        success: false,
        message: 'Coach ID is required'
      });
    }

    await client.query('BEGIN');

    // Check if coach exists and is accepting students
    const coachCheck = await client.query(
      `SELECT id, is_accepting_students, max_students, total_students
       FROM professional_coaches
       WHERE id = $1 AND is_active = true`,
      [coach_id]
    );

    if (coachCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Professional coach not found or not available'
      });
    }

    const coach = coachCheck.rows[0];

    if (!coach.is_accepting_students) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This coach is not currently accepting new students'
      });
    }

    if (coach.max_students && coach.total_students >= coach.max_students) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This coach has reached maximum capacity'
      });
    }

    // Check if already has active or pending relationship
    const existingRelationship = await client.query(
      'SELECT id, status FROM professional_coaching_relationships WHERE user_id = $1 AND coach_id = $2 AND status IN ($3, $4)',
      [user_id, coach_id, 'active', 'pending']
    );

    if (existingRelationship.rows.length > 0) {
      await client.query('ROLLBACK');
      const status = existingRelationship.rows[0].status;
      return res.status(400).json({
        success: false,
        message: status === 'active'
          ? 'You already have an active coaching relationship with this coach'
          : 'You already have a pending application with this coach'
      });
    }

    // Create coaching relationship with PENDING status
    const relationshipResult = await client.query(
      `INSERT INTO professional_coaching_relationships (user_id, coach_id, status, goals)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [user_id, coach_id, goals || null]
    );

    // Note: We don't update total_students count until the coach accepts
    // The count will be updated when the coach approves the application

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: relationshipResult.rows[0],
      message: 'Application sent successfully! The coach will review your request.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error requesting professional coach:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({
      success: false,
      message: 'Error connecting with professional coach',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  } finally {
    client.release();
  }
});

// Get user's professional coaches
router.get('/my-coaches', requirePremium, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const query = `
      SELECT
        pcrel.*,
        pc.full_name,
        pc.email,
        pc.avatar_url,
        pc.specialties,
        pc.bio,
        pc.rating as coach_rating
      FROM professional_coaching_relationships pcrel
      JOIN professional_coaches pc ON pcrel.coach_id = pc.id
      WHERE pcrel.user_id = $1 AND pcrel.status = 'active'
      ORDER BY pcrel.created_at DESC
    `;

    const result = await pool.query(query, [user_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching my professional coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your coaches'
    });
  }
});

// Get available programs from user's coaches
router.get('/my-programs', requirePremium, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const query = `
      SELECT
        cp.*,
        pc.full_name as coach_name,
        pc.avatar_url as coach_avatar,
        pe.id as enrollment_id,
        pe.status as enrollment_status,
        pe.current_day,
        pe.progress_percentage
      FROM coaching_programs cp
      JOIN professional_coaches pc ON cp.coach_id = pc.id
      LEFT JOIN program_enrollments pe ON cp.id = pe.program_id AND pe.user_id = $1
      WHERE cp.is_published = true
        AND cp.coach_id IN (
          SELECT coach_id FROM professional_coaching_relationships
          WHERE user_id = $1 AND status = 'active'
        )
      ORDER BY cp.created_at DESC
    `;

    const result = await pool.query(query, [user_id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching programs'
    });
  }
});

// Enroll in a program
router.post('/programs/:programId/enroll', requirePremium, async (req, res) => {
  const client = await pool.connect();

  try {
    const { programId } = req.params;
    const user_id = req.user.userId;

    await client.query('BEGIN');

    // Get program details
    const programResult = await client.query(
      'SELECT * FROM coaching_programs WHERE id = $1 AND is_published = true',
      [programId]
    );

    if (programResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }

    const program = programResult.rows[0];

    // Check if already enrolled
    const existingEnrollment = await client.query(
      'SELECT id FROM program_enrollments WHERE user_id = $1 AND program_id = $2',
      [user_id, programId]
    );

    if (existingEnrollment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this program'
      });
    }

    // Create enrollment
    const enrollmentResult = await client.query(
      `INSERT INTO program_enrollments (user_id, program_id, coach_id, status, current_day)
       VALUES ($1, $2, $3, 'active', 1)
       RETURNING *`,
      [user_id, programId, program.coach_id]
    );

    // Update program enrollment count
    await client.query(
      'UPDATE coaching_programs SET total_enrollments = total_enrollments + 1 WHERE id = $1',
      [programId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: enrollmentResult.rows[0],
      message: 'Successfully enrolled in program!'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error enrolling in program:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in program'
    });
  } finally {
    client.release();
  }
});

// Submit review for professional coach
router.post('/coaches/:coachId/review', requirePremium, async (req, res) => {
  try {
    const { coachId } = req.params;
    const { rating, review } = req.body;
    const user_id = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user has/had a relationship with this coach
    const relationshipCheck = await pool.query(
      'SELECT id FROM professional_coaching_relationships WHERE user_id = $1 AND coach_id = $2',
      [user_id, coachId]
    );

    const is_verified = relationshipCheck.rows.length > 0;

    // Insert or update review
    const result = await pool.query(
      `INSERT INTO professional_coach_reviews (user_id, coach_id, rating, review, is_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, coach_id)
       DO UPDATE SET rating = $3, review = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, coachId, rating, review || null, is_verified]
    );

    // Update coach's average rating
    await pool.query(
      `UPDATE professional_coaches
       SET rating = (SELECT AVG(rating) FROM professional_coach_reviews WHERE coach_id = $1)
       WHERE id = $1`,
      [coachId]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review'
    });
  }
});

// Get subscription plans
router.get('/subscription/plans', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans'
    });
  }
});

// Get user's current subscription
router.get('/subscription/status', async (req, res) => {
  try {
    const user_id = req.user.userId;

    const result = await pool.query(
      `SELECT
        us.*,
        sp.name as plan_name,
        sp.display_name,
        sp.features
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND us.status = 'active'
       ORDER BY us.created_at DESC
       LIMIT 1`,
      [user_id]
    );

    res.json({
      success: true,
      data: result.rows[0] || null,
      has_premium: result.rows.length > 0
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
});

// =====================================================
// MESSAGING ENDPOINTS
// =====================================================

// Get messages for a professional coaching relationship
router.get('/messages/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify user is part of relationship (either user or coach)
    const relationship = await pool.query(
      'SELECT * FROM professional_coaching_relationships WHERE id = $1 AND (user_id = $2 OR coach_id IN (SELECT id FROM professional_coaches WHERE user_id = $2))',
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
        pcm.*,
        sender.name as sender_name,
        receiver.name as receiver_name
       FROM professional_coaching_messages pcm
       JOIN users sender ON pcm.sender_id = sender.id
       JOIN users receiver ON pcm.receiver_id = receiver.id
       WHERE pcm.relationship_id = $1
       ORDER BY pcm.created_at ASC`,
      [relationshipId]
    );

    // Mark received messages as read
    await pool.query(
      `UPDATE professional_coaching_messages
       SET is_read = true, read_at = NOW()
       WHERE relationship_id = $1 AND receiver_id = $2 AND is_read = false`,
      [relationshipId, userId]
    );

    res.json({
      success: true,
      data: messages.rows
    });
  } catch (error) {
    console.error('Error fetching professional coaching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// Send a message in professional coaching relationship
router.post('/messages/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { message } = req.body;
    const senderId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Get relationship and determine receiver
    const relationship = await pool.query(
      `SELECT
        pcr.*,
        pc.user_id as coach_user_id
       FROM professional_coaching_relationships pcr
       JOIN professional_coaches pc ON pcr.coach_id = pc.id
       WHERE pcr.id = $1 AND (pcr.user_id = $2 OR pc.user_id = $2)`,
      [relationshipId, senderId]
    );

    if (relationship.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const rel = relationship.rows[0];
    // If sender is the student, receiver is the coach; if sender is the coach, receiver is the student
    const receiverId = senderId === rel.user_id ? rel.coach_user_id : rel.user_id;

    // Insert message
    const result = await pool.query(
      `INSERT INTO professional_coaching_messages (relationship_id, sender_id, receiver_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [relationshipId, senderId, receiverId, message.trim()]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error sending professional coaching message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

module.exports = router;
