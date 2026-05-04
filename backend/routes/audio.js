const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all audio content
router.get('/', async (req, res) => {
  const { type, brainwave_type } = req.query;

  try {
    let query = 'SELECT * FROM audio_content WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (brainwave_type) {
      query += ` AND brainwave_type = $${paramCount}`;
      params.push(brainwave_type);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get audio content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audio content'
    });
  }
});

// Get audio by ID
router.get('/:id', async (req, res) => {
  const audioId = req.params.id;

  try {
    const result = await db.query(
      'SELECT * FROM audio_content WHERE id = $1',
      [audioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audio content not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audio content'
    });
  }
});

// Start listening session
router.post('/:id/start', async (req, res) => {
  const audioId = req.params.id;
  const userId = req.user.userId;
  const { course_session_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO listening_sessions (user_id, audio_content_id, course_session_id)
       VALUES ($1, $2, $3)
       RETURNING id, started_at`,
      [userId, audioId, course_session_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Listening session started',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting listening session'
    });
  }
});

// Update listening session progress
router.put('/session/:sessionId/progress', async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user.userId;
  const { duration_listened_seconds } = req.body;

  try {
    const result = await db.query(
      `UPDATE listening_sessions
       SET duration_listened_seconds = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [duration_listened_seconds, sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating session'
    });
  }
});

// Complete listening session
router.post('/session/:sessionId/complete', async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user.userId;
  const { duration_listened_seconds } = req.body;

  try {
    const result = await db.query(
      `UPDATE listening_sessions
       SET completed_at = CURRENT_TIMESTAMP,
           duration_listened_seconds = $1,
           completed = true
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [duration_listened_seconds, sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session completed',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing session'
    });
  }
});

// Get user listening history
router.get('/user/history', async (req, res) => {
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const result = await db.query(
      `SELECT ls.*, ac.title, ac.type, ac.brainwave_type, ac.thumbnail_url
       FROM listening_sessions ls
       JOIN audio_content ac ON ls.audio_content_id = ac.id
       WHERE ls.user_id = $1
       ORDER BY ls.started_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listening history'
    });
  }
});

module.exports = router;
