const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all available courses
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.id, c.title, c.description, c.mode, c.duration_days, c.image_url,
              COUNT(cs.id) as session_count
       FROM courses c
       LEFT JOIN course_sessions cs ON c.id = cs.course_id
       GROUP BY c.id
       ORDER BY c.is_default DESC, c.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// Get course by ID with all sessions
router.get('/:id', async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.userId;

  try {
    const courseResult = await db.query(
      'SELECT * FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get sessions with completion status
    const sessionsResult = await db.query(
      `SELECT cs.*,
              EXISTS(
                SELECT 1 FROM listening_sessions ls
                WHERE ls.course_session_id = cs.id
                AND ls.user_id = $2
                AND ls.completed = true
              ) as completed
       FROM course_sessions cs
       WHERE cs.course_id = $1
       ORDER BY cs.day_number, cs.order_index`,
      [courseId, userId]
    );

    // Get user's enrollment to check current_day
    const enrollmentResult = await db.query(
      `SELECT current_day FROM user_courses
       WHERE user_id = $1 AND course_id = $2 AND is_active = true`,
      [userId, courseId]
    );

    const currentDay = enrollmentResult.rows.length > 0 ? enrollmentResult.rows[0].current_day : 1;

    // Add locked status to sessions (only current day and previous days are unlocked)
    const sessionsWithLockStatus = sessionsResult.rows.map(session => ({
      ...session,
      locked: session.day_number > currentDay
    }));

    res.json({
      success: true,
      data: {
        ...courseResult.rows[0],
        sessions: sessionsWithLockStatus,
        current_day: currentDay
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course'
    });
  }
});

// Enroll in a course
router.post('/:id/enroll', async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.userId;

  try {
    // Check if course exists
    const courseCheck = await db.query(
      'SELECT id FROM courses WHERE id = $1',
      [courseId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Deactivate any existing active enrollments in this course
    await db.query(
      'UPDATE user_courses SET is_active = false WHERE user_id = $1 AND course_id = $2',
      [userId, courseId]
    );

    // Create new enrollment
    const result = await db.query(
      `INSERT INTO user_courses (user_id, course_id, current_day, is_active)
       VALUES ($1, $2, 1, true)
       RETURNING id, course_id, started_at, current_day`,
      [userId, courseId]
    );

    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling in course'
    });
  }
});

// Get user's enrolled courses
router.get('/user/enrolled', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT uc.id as enrollment_id, uc.started_at, uc.completed_at, uc.current_day,
              c.id, c.title, c.description, c.mode, c.duration_days, c.image_url
       FROM user_courses uc
       JOIN courses c ON uc.course_id = c.id
       WHERE uc.user_id = $1 AND uc.is_active = true
       ORDER BY uc.started_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses'
    });
  }
});

// Update course progress
router.put('/enrollment/:enrollmentId/progress',
  [
    body('current_day').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const enrollmentId = req.params.enrollmentId;
    const userId = req.user.userId;
    const { current_day } = req.body;

    try {
      const result = await db.query(
        `UPDATE user_courses
         SET current_day = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [current_day, enrollmentId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      res.json({
        success: true,
        message: 'Progress updated',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating progress'
      });
    }
  }
);

// Complete a course
router.post('/enrollment/:enrollmentId/complete', async (req, res) => {
  const enrollmentId = req.params.enrollmentId;
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `UPDATE user_courses
       SET completed_at = CURRENT_TIMESTAMP, is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [enrollmentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Course completed!',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing course'
    });
  }
});

module.exports = router;
