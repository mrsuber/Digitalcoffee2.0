const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all professional coaches (public - but premium feature)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { specialty, rating, limit = 20 } = req.query;

    let query = `
      SELECT
        id, full_name, bio, avatar_url, specialties,
        years_experience, rating, total_students, total_sessions_completed,
        hourly_rate, languages, timezone, credentials,
        is_accepting_students
      FROM professional_coaches
      WHERE is_active = true
    `;

    const params = [];
    let paramCount = 1;

    if (specialty) {
      query += ` AND $${paramCount} = ANY(specialties)`;
      params.push(specialty);
      paramCount++;
    }

    if (rating) {
      query += ` AND rating >= $${paramCount}`;
      params.push(parseFloat(rating));
      paramCount++;
    }

    query += ` ORDER BY rating DESC, total_students DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching professional coaches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional coaches'
    });
  }
});

// Get single coach details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        id, full_name, email, bio, avatar_url, specialties, certifications,
        years_experience, rating, total_students, total_sessions_completed,
        hourly_rate, languages, timezone, availability, credentials,
        is_accepting_students, max_students
      FROM professional_coaches
      WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Get recent reviews
    const reviewsResult = await db.query(
      `SELECT
        pcr.rating, pcr.review, pcr.created_at,
        u.name as user_name
      FROM professional_coach_reviews pcr
      JOIN users u ON u.id = pcr.user_id
      WHERE pcr.coach_id = $1
      ORDER BY pcr.created_at DESC
      LIMIT 5`,
      [id]
    );

    const coach = result.rows[0];
    coach.recent_reviews = reviewsResult.rows;

    res.json({
      success: true,
      data: coach
    });
  } catch (error) {
    console.error('Error fetching coach details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coach details'
    });
  }
});

// Request coaching session with a professional coach
router.post('/:id/request', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { message, preferred_times } = req.body;

    // Check if user has premium subscription
    const userResult = await db.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userResult.rows[0].subscription_status !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Professional coaching is only available for premium members. Please upgrade your subscription.'
      });
    }

    // Check if coach exists and is accepting students
    const coachResult = await db.query(
      'SELECT is_accepting_students FROM professional_coaches WHERE id = $1 AND is_active = true',
      [id]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    if (!coachResult.rows[0].is_accepting_students) {
      return res.status(400).json({
        success: false,
        message: 'This coach is not currently accepting new students'
      });
    }

    // Check if already has active relationship
    const existingResult = await db.query(
      `SELECT id FROM professional_coaching_relationships
       WHERE user_id = $1 AND coach_id = $2 AND status IN ('active', 'pending')`,
      [userId, id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending request with this coach'
      });
    }

    // Create coaching relationship request
    const result = await db.query(
      `INSERT INTO professional_coaching_relationships
       (user_id, coach_id, status, start_date, message, preferred_times)
       VALUES ($1, $2, 'pending', NOW(), $3, $4)
       RETURNING id, status, start_date`,
      [userId, id, message || null, preferred_times ? JSON.stringify(preferred_times) : null]
    );

    // TODO: Send notification to coach about new request

    res.status(201).json({
      success: true,
      message: 'Coaching request sent successfully! The coach will review your request and respond soon.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error requesting coach:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting coach'
    });
  }
});

// Get user's professional coaching relationships
router.get('/my/relationships', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT
        pcr.id, pcr.status, pcr.start_date, pcr.end_date,
        pc.id as coach_id, pc.full_name as coach_name,
        pc.avatar_url as coach_avatar, pc.specialties,
        COUNT(pcs.id) as total_sessions
      FROM professional_coaching_relationships pcr
      JOIN professional_coaches pc ON pc.id = pcr.coach_id
      LEFT JOIN professional_coaching_sessions pcs ON pcs.relationship_id = pcr.id
      WHERE pcr.user_id = $1
      GROUP BY pcr.id, pc.id
      ORDER BY pcr.start_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching coaching relationships:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coaching relationships'
    });
  }
});

// Get messages for a specific relationship
router.get('/messages/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const userId = req.user.userId;

    // Verify user is part of this relationship (either as student or coach)
    const relationshipCheck = await pool.query(
      `SELECT pcr.id, pcr.user_id, pcr.coach_id, pc.user_id as coach_user_id
       FROM professional_coaching_relationships pcr
       JOIN professional_coaches pc ON pcr.coach_id = pc.id
       WHERE pcr.id = $1 AND (pcr.user_id = $2 OR pc.user_id = $2) AND pcr.status = 'active'`,
      [relationshipId, userId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get messages for this relationship
    const messagesResult = await pool.query(
      `SELECT
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
       ORDER BY pcm.created_at ASC`,
      [relationshipId]
    );

    // Mark messages from the other person as read
    await pool.query(
      `UPDATE professional_coaching_messages
       SET is_read = true, read_at = NOW()
       WHERE relationship_id = $1 AND receiver_id = $2 AND is_read = false`,
      [relationshipId, userId]
    );

    res.json({
      success: true,
      data: messagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

// Send a message in a professional coaching relationship
router.post('/messages/:relationshipId', authenticateToken, async (req, res) => {
  try {
    const { relationshipId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    // Verify user is part of this relationship and get receiver ID
    const relationshipCheck = await pool.query(
      `SELECT pcr.id, pcr.user_id, pcr.coach_id, pc.user_id as coach_user_id
       FROM professional_coaching_relationships pcr
       JOIN professional_coaches pc ON pcr.coach_id = pc.id
       WHERE pcr.id = $1 AND (pcr.user_id = $2 OR pc.user_id = $2) AND pcr.status = 'active'`,
      [relationshipId, userId]
    );

    if (relationshipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const relationship = relationshipCheck.rows[0];
    // Determine receiver: if sender is student, receiver is coach; if sender is coach, receiver is student
    const receiverId = userId === relationship.user_id ? relationship.coach_user_id : relationship.user_id;

    // Insert the message
    const messageResult = await pool.query(
      `INSERT INTO professional_coaching_messages (relationship_id, sender_id, receiver_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [relationshipId, userId, receiverId, message.trim()]
    );

    // Create notification for receiver
    const senderResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const senderName = senderResult.rows[0]?.name || 'Someone';

    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiverId,
        'new_message',
        'New message',
        `${senderName}: ${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}`,
        JSON.stringify({
          sender_id: userId,
          sender_name: senderName,
          message_id: messageResult.rows[0].id,
          relationship_id: relationshipId,
          is_professional_coach: true
        })
      ]
    );

    res.json({
      success: true,
      data: messageResult.rows[0]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
});

module.exports = router;
