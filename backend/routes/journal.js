const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create journal entry
router.post('/',
  [
    body('content').trim().isLength({ min: 1 }),
    body('mood').optional().isIn(['clear', 'tired', 'anxious', 'foggy', 'inspired']),
    body('tags').optional().isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { content, mood, tags } = req.body;
    const userId = req.user.userId;

    try {
      const result = await db.query(
        `INSERT INTO journal_entries (user_id, content, mood, tags)
         VALUES ($1, $2, $3, $4)
         RETURNING id, content, mood, tags, is_favorite, created_at`,
        [userId, content, mood || null, JSON.stringify(tags || [])]
      );

      res.status(201).json({
        success: true,
        message: 'Journal entry created',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating journal entry'
      });
    }
  }
);

// Get all journal entries
router.get('/', async (req, res) => {
  const userId = req.user.userId;
  const limit = parseInt(req.query.limit) || 50;
  const { mood, favorites_only } = req.query;

  try {
    let query = 'SELECT * FROM journal_entries WHERE user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (mood) {
      query += ` AND mood = $${paramCount}`;
      params.push(mood);
      paramCount++;
    }

    if (favorites_only === 'true') {
      query += ' AND is_favorite = true';
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entries'
    });
  }
});

// Get single journal entry
router.get('/:id', async (req, res) => {
  const entryId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      'SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2',
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entry'
    });
  }
});

// Update journal entry
router.put('/:id',
  [
    body('content').optional().trim().isLength({ min: 1 }),
    body('mood').optional().isIn(['clear', 'tired', 'anxious', 'foggy', 'inspired']),
    body('tags').optional().isArray(),
    body('is_favorite').optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const entryId = req.params.id;
    const userId = req.user.userId;
    const updates = req.body;

    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(key === 'tags' ? JSON.stringify(updates[key]) : updates[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(entryId, userId);

      const result = await db.query(
        `UPDATE journal_entries
         SET ${fields.join(', ')}
         WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Journal entry not found'
        });
      }

      res.json({
        success: true,
        message: 'Journal entry updated',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update journal entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating journal entry'
      });
    }
  }
);

// Delete journal entry
router.delete('/:id', async (req, res) => {
  const entryId = req.params.id;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [entryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Journal entry deleted'
    });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting journal entry'
    });
  }
});

module.exports = router;
