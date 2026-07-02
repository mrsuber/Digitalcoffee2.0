const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create mood check-in
router.post('/checkin',
  [
    body('mood').isIn(['clear', 'calm', 'tired', 'anxious', 'foggy']),
    body('focus_level').isIn(['low', 'medium', 'high']),
    body('daily_goal').optional({ nullable: true }).trim(),
    body('emoji_rating').optional({ nullable: true }).custom((value) => {
      if (value === null || value === undefined) return true;
      if (Number.isInteger(value) && value >= 1 && value <= 5) return true;
      throw new Error('emoji_rating must be an integer between 1 and 5');
    })
  ],
  async (req, res) => {
    // Debug logging
    console.log('📝 Mood check-in request body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { mood, focus_level, daily_goal, emoji_rating } = req.body;
    const userId = req.user.userId;

    console.log('✅ Validated mood data:', { userId, mood, focus_level, daily_goal, emoji_rating });

    try {
      const result = await db.query(
        `INSERT INTO mood_checkins (user_id, mood, focus_level, daily_goal, emoji_rating)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, mood, focus_level, daily_goal, emoji_rating, created_at`,
        [userId, mood, focus_level, daily_goal || null, emoji_rating || null]
      );

      res.status(201).json({
        success: true,
        message: 'Mood check-in recorded',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Mood check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording mood check-in'
      });
    }
  }
);

// Get recent mood check-ins
router.get('/checkins', async (req, res) => {
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 30;

  try {
    const result = await db.query(
      `SELECT id, mood, focus_level, daily_goal, emoji_rating, created_at
       FROM mood_checkins
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get mood check-ins error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mood check-ins'
    });
  }
});

// Get today's mood check-in
router.get('/today', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT id, mood, focus_level, daily_goal, emoji_rating, created_at
       FROM mood_checkins
       WHERE user_id = $1
       AND created_at::date = CURRENT_DATE
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Get today mood error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s mood'
    });
  }
});

module.exports = router;
