const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateAccessToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = verifyToken(token);

    // Check if user is admin or professional coach
    const result = await db.query(
      'SELECT id, email, name, is_admin, role FROM users WHERE id = $1 AND (is_admin = true OR role = $2)',
      [decoded.userId, 'professional_coach']
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or coach privileges required.'
      });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin login
router.post('/login',
  [
    body('email').trim().notEmpty().withMessage('Username or email is required'),
    body('password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      console.log('🔐 Admin login attempt:', { email, passwordLength: password?.length });

      // Get admin user or professional coach by username or email
      const result = await db.query(
        'SELECT id, email, username, password_hash, name, is_admin, role FROM users WHERE (email = $1 OR username = $1) AND (is_admin = true OR role = $2)',
        [email, 'professional_coach']
      );

      console.log('👤 User query result:', { found: result.rows.length > 0, email });

      if (result.rows.length === 0) {
        console.log('❌ No admin or coach user found with email/username:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or insufficient permissions'
        });
      }

      const admin = result.rows[0];
      console.log('✅ Found admin:', { id: admin.id, email: admin.email, username: admin.username });

      // Verify password
      const validPassword = await bcrypt.compare(password, admin.password_hash);
      console.log('🔑 Password verification:', validPassword);

      if (!validPassword) {
        console.log('❌ Password mismatch for user:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate token with role
      const accessToken = generateAccessToken(admin.id, admin.role || (admin.is_admin ? 'admin' : 'user'));

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            username: admin.username,
            name: admin.name,
            role: admin.role || (admin.is_admin ? 'admin' : 'user')
          },
          accessToken
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in'
      });
    }
  }
);

// Get dashboard statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Get total users
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users WHERE is_admin = false OR is_admin IS NULL');

    // Get total courses
    const coursesResult = await db.query('SELECT COUNT(*) as total FROM courses');

    // Get total audio content
    const audioResult = await db.query('SELECT COUNT(*) as total FROM audio_content');

    // Get active enrollments (user_courses with is_active = true)
    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as total FROM user_courses WHERE is_active = true'
    );

    // Get recent mood check-ins (last 7 days)
    const moodResult = await db.query(
      `SELECT COUNT(*) as total FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '7 days'`
    );

    // Get user growth (last 30 days)
    const userGrowthResult = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= NOW() - INTERVAL '30 days' AND (is_admin = false OR is_admin IS NULL)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersResult.rows[0].total),
        totalCourses: parseInt(coursesResult.rows[0].total),
        totalAudioContent: parseInt(audioResult.rows[0].total),
        activeEnrollments: parseInt(enrollmentsResult.rows[0].total),
        weeklyMoodCheckins: parseInt(moodResult.rows[0].total),
        userGrowth: userGrowthResult.rows
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, name, created_at,
             subscription_status,
             subscription_started_at,
             subscription_expires_at,
             stripe_customer_id,
             stripe_subscription_id,
             (SELECT COUNT(*) FROM user_courses WHERE user_id = users.id) as enrolled_courses,
             (SELECT COUNT(*) FROM mood_checkins WHERE user_id = users.id) as mood_checkins
      FROM users
      WHERE (is_admin = false OR is_admin IS NULL) AND (is_deleted = false OR is_deleted IS NULL)
    `;
    const params = [];

    if (search) {
      query += ` AND (email ILIKE $1 OR name ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE (is_admin = false OR is_admin IS NULL) AND (is_deleted = false OR is_deleted IS NULL)';
    if (search) {
      countQuery += ` AND (email ILIKE $1 OR name ILIKE $1)`;
    }
    const countResult = await db.query(
      countQuery,
      search ? [`%${search}%`] : []
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get user details
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const userResult = await db.query(
      `SELECT id, email, name, created_at FROM users WHERE id = $1 AND (is_admin = false OR is_admin IS NULL)`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user enrollments
    const enrollmentsResult = await db.query(
      `SELECT uc.*, c.title, c.duration_days
       FROM user_courses uc
       JOIN courses c ON uc.course_id = c.id
       WHERE uc.user_id = $1
       ORDER BY uc.started_at DESC`,
      [id]
    );

    // Get mood check-ins
    const moodResult = await db.query(
      `SELECT * FROM mood_checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        enrollments: enrollmentsResult.rows,
        recentMoodCheckins: moodResult.rows
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete user (cascade will handle related records)
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 AND (is_admin = false OR is_admin IS NULL) RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get all courses
router.get('/courses', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM user_courses WHERE course_id = c.id) as enrolled_users
       FROM courses c
       ORDER BY c.created_at DESC`
    );

    // Map mode back to category for admin dashboard
    const modeToCategory = {
      'hyper-focus': 'Focus',
      'calm-down': 'Calm',
      'infinite-inspiration': 'Inspire'
    };

    const coursesWithCategory = result.rows.map(course => ({
      ...course,
      category: modeToCategory[course.mode] || 'Focus',
      difficulty_level: 'beginner' // Default for backward compatibility
    }));

    res.json({
      success: true,
      data: {
        courses: coursesWithCategory
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
});

// Create course
router.post('/courses', adminAuth,
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('duration_days').isInt({ min: 1 }),
    body('category').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, duration_days, category, image_url } = req.body;

    // Map category to mode
    const modeMapping = {
      'Focus': 'hyper-focus',
      'Calm': 'calm-down',
      'Inspire': 'infinite-inspiration',
      'Sleep': 'calm-down'
    };
    const mode = modeMapping[category] || 'hyper-focus';

    try {
      const result = await db.query(
        `INSERT INTO courses (title, description, duration_days, mode, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [title, description, duration_days, mode, image_url]
      );

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: {
          course: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating course'
      });
    }
  }
);

// Update course
router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration_days, category, image_url } = req.body;

    // Map category to mode
    const modeMapping = {
      'Focus': 'hyper-focus',
      'Calm': 'calm-down',
      'Inspire': 'infinite-inspiration',
      'Sleep': 'calm-down'
    };
    const mode = category ? modeMapping[category] || 'hyper-focus' : undefined;

    const result = await db.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           duration_days = COALESCE($3, duration_days),
           mode = COALESCE($4, mode),
           image_url = COALESCE($5, image_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, duration_days, mode, image_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
});

// Delete course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM courses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
});

// Get all audio content
router.get('/audio', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*,
              (SELECT COUNT(*) FROM listening_sessions WHERE audio_content_id = a.id) as total_sessions
       FROM audio_content a
       ORDER BY a.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        audioContent: result.rows
      }
    });
  } catch (error) {
    console.error('Get audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audio content'
    });
  }
});

// Create audio content
router.post('/audio', adminAuth,
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('type').isIn(['meditation', 'affirmation', 'music', 'course']),
    body('audio_url').notEmpty().trim(),
    body('duration_listened_seconds').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, type, audio_url, duration_listened_seconds, brainwave_type, course_session_id, thumbnail_url } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO audio_content (title, description, type, audio_url, duration_listened_seconds, brainwave_type, course_session_id, thumbnail_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, description, type, audio_url, duration_listened_seconds, brainwave_type, course_session_id, thumbnail_url]
      );

      res.status(201).json({
        success: true,
        message: 'Audio content created successfully',
        data: {
          audio: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Create audio error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating audio content'
      });
    }
  }
);

// Update audio content
router.put('/audio/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, audio_url, duration_listened_seconds, brainwave_type, thumbnail_url } = req.body;

    const result = await db.query(
      `UPDATE audio_content
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           audio_url = COALESCE($4, audio_url),
           duration_listened_seconds = COALESCE($5, duration_listened_seconds),
           brainwave_type = COALESCE($6, brainwave_type),
           thumbnail_url = COALESCE($7, thumbnail_url),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, type, audio_url, duration_listened_seconds, brainwave_type, thumbnail_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audio content not found'
      });
    }

    res.json({
      success: true,
      message: 'Audio content updated successfully',
      data: {
        audio: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating audio content'
    });
  }
});

// Delete audio content
router.delete('/audio/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM audio_content WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Audio content not found'
      });
    }

    res.json({
      success: true,
      message: 'Audio content deleted successfully'
    });
  } catch (error) {
    console.error('Delete audio error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting audio content'
    });
  }
});

// ===== MOOD ANALYTICS ENDPOINTS =====

// Get mood analytics
router.get('/mood-analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Validate and sanitize period parameter
    const validPeriod = parseInt(period);
    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be a number between 1 and 365.'
      });
    }

    // Mood distribution - using parameterized query
    const moodDistribution = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY mood
       ORDER BY count DESC`,
      [validPeriod]
    );

    // Focus level distribution - using parameterized query
    const focusDistribution = await db.query(
      `SELECT focus_level, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY focus_level
       ORDER BY count DESC`,
      [validPeriod]
    );

    // Mood trends over time - using parameterized query
    const moodTrends = await db.query(
      `SELECT DATE(created_at) as date, mood, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at), mood
       ORDER BY date ASC`,
      [validPeriod]
    );

    // Daily check-in rate - using parameterized query
    const dailyCheckins = await db.query(
      `SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_checkins
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [validPeriod]
    );

    // Most common daily goals - using parameterized query
    const topGoals = await db.query(
      `SELECT daily_goal, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       AND daily_goal IS NOT NULL
       GROUP BY daily_goal
       ORDER BY count DESC
       LIMIT 10`,
      [validPeriod]
    );

    // Users with highest check-in frequency - using parameterized query
    const topUsers = await db.query(
      `SELECT u.id, u.email, u.name, COUNT(mc.id) as checkin_count
       FROM users u
       JOIN mood_checkins mc ON u.id = mc.user_id
       WHERE mc.created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY u.id, u.email, u.name
       ORDER BY checkin_count DESC
       LIMIT 10`,
      [validPeriod]
    );

    res.json({
      success: true,
      data: {
        moodDistribution: moodDistribution.rows,
        focusDistribution: focusDistribution.rows,
        moodTrends: moodTrends.rows,
        dailyCheckins: dailyCheckins.rows,
        topGoals: topGoals.rows,
        topUsers: topUsers.rows
      }
    });
  } catch (error) {
    console.error('Mood analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mood analytics'
    });
  }
});

// ===== FOCUS SESSIONS ENDPOINTS =====

// Get focus sessions analytics
router.get('/focus-sessions', adminAuth, async (req, res) => {
  try {
    const { period = '30', page = 1, limit = 50 } = req.query;

    // Validate and sanitize parameters
    const validPeriod = parseInt(period);
    const validPage = parseInt(page);
    const validLimit = parseInt(limit);

    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be a number between 1 and 365.'
      });
    }

    if (isNaN(validPage) || validPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }

    const offset = (validPage - 1) * validLimit;

    // Total sessions stats - using parameterized query
    const totalStats = await db.query(
      `SELECT
        COUNT(*) as total_sessions,
        AVG(duration_listened_seconds) as avg_duration,
        SUM(duration_listened_seconds) as total_duration,
        COUNT(DISTINCT user_id) as unique_users
       FROM listening_sessions
       WHERE started_at >= NOW() - INTERVAL '1 day' * $1`,
      [validPeriod]
    );

    // Sessions by brainwave type - using parameterized query
    const brainwaveStats = await db.query(
      `SELECT
        ac.brainwave_type,
        COUNT(als.id) as session_count,
        AVG(als.duration_listened_seconds) as avg_duration,
        SUM(als.duration_listened_seconds) as total_duration
       FROM listening_sessions als
       JOIN audio_content ac ON als.audio_content_id = ac.id
       WHERE als.started_at >= NOW() - INTERVAL '1 day' * $1
       AND ac.brainwave_type IS NOT NULL
       GROUP BY ac.brainwave_type
       ORDER BY session_count DESC`,
      [validPeriod]
    );

    // Daily session trends - using parameterized query
    const dailyTrends = await db.query(
      `SELECT
        DATE(started_at) as date,
        COUNT(*) as session_count,
        AVG(duration_listened_seconds) as avg_duration,
        COUNT(DISTINCT user_id) as unique_users
       FROM listening_sessions
       WHERE started_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [validPeriod]
    );

    // Most popular audio content - using parameterized query
    const popularAudio = await db.query(
      `SELECT
        ac.id, ac.title, ac.type, ac.brainwave_type,
        COUNT(als.id) as play_count,
        AVG(als.duration_listened_seconds) as avg_listen_duration
       FROM audio_content ac
       LEFT JOIN listening_sessions als ON ac.id = als.audio_content_id
       WHERE als.started_at >= NOW() - INTERVAL '1 day' * $1 OR als.started_at IS NULL
       GROUP BY ac.id, ac.title, ac.type, ac.brainwave_type
       ORDER BY play_count DESC
       LIMIT 10`,
      [validPeriod]
    );

    // Recent sessions with user details - using parameterized query
    const recentSessions = await db.query(
      `SELECT
        als.id, als.duration_listened_seconds, als.started_at, als.completed_at,
        u.email, u.name as user_name,
        ac.title as audio_title, ac.type, ac.brainwave_type
       FROM listening_sessions als
       JOIN users u ON als.user_id = u.id
       JOIN audio_content ac ON als.audio_content_id = ac.id
       WHERE als.started_at >= NOW() - INTERVAL '1 day' * $1
       ORDER BY als.started_at DESC
       LIMIT $2 OFFSET $3`,
      [validPeriod, validLimit, offset]
    );

    // Get total count for pagination - using parameterized query
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM listening_sessions
       WHERE started_at >= NOW() - INTERVAL '1 day' * $1`,
      [validPeriod]
    );

    res.json({
      success: true,
      data: {
        totalStats: totalStats.rows[0],
        brainwaveStats: brainwaveStats.rows,
        dailyTrends: dailyTrends.rows,
        popularAudio: popularAudio.rows,
        recentSessions: recentSessions.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });
  } catch (error) {
    console.error('Focus sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching focus sessions'
    });
  }
});

// Get user engagement metrics
router.get('/engagement-metrics', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Validate and sanitize period parameter
    const validPeriod = parseInt(period);
    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be a number between 1 and 365.'
      });
    }

    // Daily active users - using parameterized query
    const dailyActiveUsers = await db.query(
      `SELECT DATE(started_at) as date, COUNT(DISTINCT user_id) as active_users
       FROM listening_sessions
       WHERE started_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [validPeriod]
    );

    // User retention (users who returned) - using parameterized query
    const retention = await db.query(
      `WITH first_session AS (
        SELECT user_id, MIN(DATE(started_at)) as first_date
        FROM listening_sessions
        GROUP BY user_id
      ),
      returning_users AS (
        SELECT als.user_id, DATE(als.started_at) as session_date
        FROM listening_sessions als
        JOIN first_session fs ON als.user_id = fs.user_id
        WHERE DATE(als.started_at) > fs.first_date
        AND als.started_at >= NOW() - INTERVAL '1 day' * $1
      )
      SELECT COUNT(DISTINCT user_id) as returning_users
      FROM returning_users`,
      [validPeriod]
    );

    // Average sessions per user - using parameterized query
    const avgSessionsPerUser = await db.query(
      `SELECT AVG(session_count) as avg_sessions
       FROM (
         SELECT user_id, COUNT(*) as session_count
         FROM listening_sessions
         WHERE started_at >= NOW() - INTERVAL '1 day' * $1
         GROUP BY user_id
       ) user_sessions`,
      [validPeriod]
    );

    // Completion rate - using parameterized query
    const completionRate = await db.query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_sessions,
        ROUND(
          (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          2
        ) as completion_rate
       FROM listening_sessions
       WHERE started_at >= NOW() - INTERVAL '1 day' * $1`,
      [validPeriod]
    );

    res.json({
      success: true,
      data: {
        dailyActiveUsers: dailyActiveUsers.rows,
        returningUsers: parseInt(retention.rows[0]?.returning_users || 0),
        avgSessionsPerUser: parseFloat(avgSessionsPerUser.rows[0]?.avg_sessions || 0),
        completionRate: completionRate.rows[0]
      }
    });
  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching engagement metrics'
    });
  }
});

// Get progress analytics
router.get('/progress/analytics', adminAuth, async (req, res) => {
  try {
    const { days = '7' } = req.query;

    // Validate and sanitize days parameter
    const validDays = parseInt(days);
    if (isNaN(validDays) || validDays < 1 || validDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid days parameter. Must be a number between 1 and 365.'
      });
    }

    // Total sessions and minutes - using parameterized query
    const totalStats = await db.query(
      `SELECT
        COUNT(*) as total_sessions,
        COALESCE(SUM(total_minutes), 0) as total_minutes,
        COUNT(DISTINCT user_id) as active_users
       FROM user_progress
       WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1`,
      [validDays]
    );

    // Average sessions per user - using parameterized query
    const avgPerUser = await db.query(
      `SELECT
        AVG(sessions) as avg_sessions,
        AVG(minutes) as avg_minutes
       FROM (
         SELECT user_id,
                SUM(sessions_completed) as sessions,
                SUM(total_minutes) as minutes
         FROM user_progress
         WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1
         GROUP BY user_id
       ) user_stats`,
      [validDays]
    );

    // Course completions and enrollment - using parameterized query
    const courseStats = await db.query(
      `SELECT
        COUNT(*) as total_enrollments,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as total_completions,
        ROUND(
          (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          2
        ) as completion_rate
       FROM user_courses
       WHERE started_at >= CURRENT_DATE - INTERVAL '1 day' * $1`,
      [validDays]
    );

    // Average streak - using parameterized query
    const avgStreak = await db.query(
      `SELECT AVG(streak_days) as avg_streak
       FROM (
         SELECT DISTINCT ON (user_id) user_id, streak_days
         FROM user_progress
         WHERE date >= CURRENT_DATE - INTERVAL '1 day' * $1
         ORDER BY user_id, date DESC
       ) latest_streaks`,
      [validDays]
    );

    // Engagement rate (users with at least 1 session)
    const totalUsersResult = await db.query('SELECT COUNT(*) as total FROM users WHERE is_admin = false');
    const totalUsers = parseInt(totalUsersResult.rows[0].total);
    const activeUsers = parseInt(totalStats.rows[0].active_users);
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    // User progress details - using parameterized query
    const userProgress = await db.query(
      `SELECT
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(SUM(up.sessions_completed), 0) as total_sessions,
        COALESCE(SUM(up.total_minutes), 0) as total_minutes,
        MAX(up.streak_days) as current_streak,
        ROUND(AVG(up.mood_rating), 1) as avg_mood,
        ROUND(AVG(up.focus_percentage), 0) as avg_focus,
        COUNT(DISTINCT uc.course_id) FILTER (WHERE uc.is_active = true) as courses_enrolled,
        COUNT(DISTINCT uc.course_id) FILTER (WHERE uc.completed_at IS NOT NULL) as courses_completed,
        MAX(up.date) as last_active
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id AND up.date >= CURRENT_DATE - INTERVAL '1 day' * $1
       LEFT JOIN user_courses uc ON u.id = uc.user_id
       WHERE u.is_admin = false
       GROUP BY u.id, u.name, u.email
       HAVING SUM(up.sessions_completed) > 0
       ORDER BY total_sessions DESC, total_minutes DESC`,
      [validDays]
    );

    // Top performers (by total minutes)
    const topPerformers = userProgress.rows.slice(0, 5);

    res.json({
      success: true,
      data: {
        analytics: {
          totalSessions: parseInt(totalStats.rows[0].total_sessions),
          totalMinutes: parseInt(totalStats.rows[0].total_minutes),
          activeUsers: parseInt(totalStats.rows[0].active_users),
          avgSessionsPerUser: parseFloat(avgPerUser.rows[0]?.avg_sessions || 0),
          avgMinutesPerUser: parseFloat(avgPerUser.rows[0]?.avg_minutes || 0),
          courseCompletions: parseInt(courseStats.rows[0]?.total_completions || 0),
          completionRate: parseFloat(courseStats.rows[0]?.completion_rate || 0),
          avgStreak: parseFloat(avgStreak.rows[0]?.avg_streak || 0),
          engagementRate,
          topPerformers
        },
        userProgress: userProgress.rows
      }
    });
  } catch (error) {
    console.error('Progress analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress analytics'
    });
  }
});

// ===== COMMUNITY MANAGEMENT ENDPOINTS =====

// Get all community posts (for admin moderation)
router.get('/community/posts', adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT
        cp.id,
        cp.user_id,
        cp.content,
        cp.mood,
        cp.session_minutes,
        cp.likes_count,
        cp.comments_count,
        cp.is_reported,
        cp.report_count,
        cp.created_at,
        u.name as user_name,
        u.email as user_email
       FROM community_posts cp
       JOIN users u ON cp.user_id = u.id
       ORDER BY cp.report_count DESC, cp.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get community posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community posts'
    });
  }
});

// Get report details for a specific post
router.get('/community/posts/:postId/reports', adminAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await db.query(
      `SELECT
        cpr.id,
        cpr.post_id,
        cpr.reason,
        cpr.created_at,
        u.id as reporter_id,
        u.name as reporter_name,
        u.email as reporter_email
       FROM community_post_reports cpr
       JOIN users u ON cpr.reported_by = u.id
       WHERE cpr.post_id = $1
       ORDER BY cpr.created_at DESC`,
      [postId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get post reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post reports'
    });
  }
});

// Get all community comments (for admin moderation)
router.get('/community/comments', adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT
        cc.id,
        cc.post_id,
        cc.user_id,
        cc.parent_comment_id,
        cc.content,
        cc.created_at,
        u.name as user_name,
        u.email as user_email,
        cp.content as post_content
       FROM community_comments cc
       JOIN users u ON cc.user_id = u.id
       JOIN community_posts cp ON cc.post_id = cp.id
       ORDER BY cc.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get community comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching community comments'
    });
  }
});

// Delete a community post (admin)
router.delete('/community/posts/:postId', adminAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await db.query(
      'DELETE FROM community_posts WHERE id = $1 RETURNING id',
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete community post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post'
    });
  }
});

// Delete a community comment (admin)
router.delete('/community/comments/:commentId', adminAuth, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Get the post_id before deleting
    const commentResult = await db.query(
      'SELECT post_id FROM community_comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const postId = commentResult.rows[0].post_id;

    // Delete the comment
    await db.query('DELETE FROM community_comments WHERE id = $1', [commentId]);

    // Update the comments count on the post
    await db.query(
      'UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1',
      [postId]
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete community comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
});

// ===== PROFESSIONAL COACHES MANAGEMENT =====

// Get all professional coaches
router.get('/professional-coaches', adminAuth, async (req, res) => {
  try {
    const { status, specialty, search } = req.query;

    let query = `
      SELECT
        pc.*,
        u.email as user_email,
        u.name as user_name,
        u.id as user_id,
        COUNT(DISTINCT pcr.user_id) FILTER (WHERE pcr.status = 'active') as active_students,
        COUNT(DISTINCT pcr.user_id) FILTER (WHERE pcr.status = 'pending') as pending_applications,
        AVG(reviews.rating)::NUMERIC(3,2) as average_rating,
        COUNT(DISTINCT reviews.id) as total_reviews
      FROM professional_coaches pc
      LEFT JOIN users u ON pc.user_id = u.id
      LEFT JOIN professional_coaching_relationships pcr ON pc.id = pcr.coach_id
      LEFT JOIN professional_coach_reviews reviews ON pc.id = reviews.coach_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND pc.is_active = $${paramCount}`;
      params.push(status === 'active');
      paramCount++;
    }

    if (specialty) {
      query += ` AND $${paramCount} = ANY(pc.specialties)`;
      params.push(specialty);
      paramCount++;
    }

    if (search) {
      query += ` AND (pc.full_name ILIKE $${paramCount} OR pc.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += `
      GROUP BY pc.id, u.email, u.name, u.id
      ORDER BY pc.created_at DESC
    `;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get professional coaches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching professional coaches'
    });
  }
});

// Get coach details
router.get('/professional-coaches/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const coachResult = await db.query(
      `SELECT
        pc.*,
        u.email as user_email,
        u.name as user_name,
        u.id as user_id,
        COUNT(DISTINCT pcr.user_id) FILTER (WHERE pcr.status = 'active') as active_students,
        COUNT(DISTINCT pcr.user_id) FILTER (WHERE pcr.status = 'pending') as pending_applications
       FROM professional_coaches pc
       LEFT JOIN users u ON pc.user_id = u.id
       LEFT JOIN professional_coaching_relationships pcr ON pc.id = pcr.coach_id
       WHERE pc.id = $1
       GROUP BY pc.id, u.email, u.name, u.id`,
      [id]
    );

    if (coachResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    // Get recent reviews
    const reviewsResult = await db.query(
      `SELECT
        pcr.*,
        u.name as user_name,
        u.email as user_email
       FROM professional_coach_reviews pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.coach_id = $1
       ORDER BY pcr.created_at DESC
       LIMIT 10`,
      [id]
    );

    // Get students
    const studentsResult = await db.query(
      `SELECT
        pcr.*,
        u.name as student_name,
        u.email as student_email
       FROM professional_coaching_relationships pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.coach_id = $1
       ORDER BY pcr.created_at DESC`,
      [id]
    );

    const coachData = {
      ...coachResult.rows[0],
      recent_reviews: reviewsResult.rows,
      students: studentsResult.rows
    };

    res.json({
      success: true,
      data: coachData
    });
  } catch (error) {
    console.error('Get coach details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coach details'
    });
  }
});

// Create professional coach
router.post('/professional-coaches', adminAuth, async (req, res) => {
  try {
    const {
      full_name, email, password, bio, avatar_url, specialties,
      certifications, years_experience, hourly_rate, languages,
      timezone, credentials, is_accepting_students, max_students
    } = req.body;

    // Validate required fields
    if (!full_name || !email || !bio || !specialties || specialties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: full_name, email, bio, and at least one specialty'
      });
    }

    // Check if user with email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create user account for the coach
    const defaultPassword = password || 'Coach2024!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const userResult = await db.query(
      `INSERT INTO users (email, name, password_hash, role, is_admin)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [email, full_name, passwordHash, 'professional_coach']
    );

    const userId = userResult.rows[0].id;

    // Create professional coach profile
    const coachResult = await db.query(
      `INSERT INTO professional_coaches (
        user_id, full_name, email, bio, avatar_url, specialties,
        certifications, years_experience, hourly_rate, languages,
        timezone, credentials, is_accepting_students, max_students,
        is_active, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 5.0)
      RETURNING *`,
      [
        userId, full_name, email, bio, avatar_url || null,
        Array.isArray(specialties) ? specialties : [specialties],
        certifications || null,
        years_experience || 0,
        hourly_rate || 0,
        Array.isArray(languages) ? languages : [languages || 'English'],
        timezone || 'America/New_York',
        credentials || null,
        is_accepting_students !== false,
        max_students || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Professional coach created successfully',
      data: {
        ...coachResult.rows[0],
        default_password: !password ? defaultPassword : undefined
      }
    });
  } catch (error) {
    console.error('Create professional coach error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating professional coach: ' + error.message
    });
  }
});

// Update professional coach
router.put('/professional-coaches/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name, bio, avatar_url, specialties, certifications,
      years_experience, credentials, is_accepting_students, max_students
    } = req.body;

    const result = await db.query(
      `UPDATE professional_coaches
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           specialties = COALESCE($4, specialties),
           certifications = COALESCE($5, certifications),
           years_experience = COALESCE($6, years_experience),
           credentials = COALESCE($7, credentials),
           is_accepting_students = COALESCE($8, is_accepting_students),
           max_students = COALESCE($9, max_students),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        full_name, bio, avatar_url,
        Array.isArray(specialties) ? specialties : null,
        certifications, years_experience, credentials,
        is_accepting_students, max_students, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.json({
      success: true,
      message: 'Coach updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update coach error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coach'
    });
  }
});

// Update coach status
router.put('/professional-coaches/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, is_accepting_students } = req.body;

    const result = await db.query(
      `UPDATE professional_coaches
       SET is_active = COALESCE($1, is_active),
           is_accepting_students = COALESCE($2, is_accepting_students),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [is_active, is_accepting_students, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.json({
      success: true,
      message: 'Coach status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update coach status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coach status'
    });
  }
});

// Delete (deactivate) professional coach
router.delete('/professional-coaches/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - just deactivate the coach
    const result = await db.query(
      `UPDATE professional_coaches
       SET is_active = false,
           is_accepting_students = false,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Coach not found'
      });
    }

    res.json({
      success: true,
      message: 'Coach deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete coach error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting coach'
    });
  }
});

// Get payment logs for subscription management
router.get('/payment-logs', adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
        pl.*,
        u.email as user_email,
        u.name as user_name
       FROM payment_logs pl
       LEFT JOIN users u ON pl.user_id = u.id
       ORDER BY pl.created_at DESC
       LIMIT 100`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get payment logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment logs'
    });
  }
});

// Account deletion analytics
router.get('/deletion-analytics', adminAuth, async (req, res) => {
  try {
    // Get deletion statistics
    const statsResult = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_deleted = TRUE) as total_deleted,
        COUNT(*) FILTER (WHERE is_deleted = TRUE AND deleted_at >= NOW() - INTERVAL '7 days') as deleted_last_7_days,
        COUNT(*) FILTER (WHERE is_deleted = TRUE AND deleted_at >= NOW() - INTERVAL '30 days') as deleted_last_30_days,
        COUNT(*) FILTER (WHERE previous_account_id IS NOT NULL) as total_returning_users,
        COUNT(*) FILTER (WHERE previous_account_id IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days') as returning_last_30_days
      FROM users
    `);

    // Get deletion reasons breakdown
    const reasonsResult = await db.query(`
      SELECT
        deletion_reason,
        COUNT(*) as count,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM users u2 WHERE u2.previous_account_id = users.id
        ) THEN 1 END) as came_back_count
      FROM users
      WHERE is_deleted = TRUE AND deletion_reason IS NOT NULL
      GROUP BY deletion_reason
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get recent deletions with details
    const recentDeletionsResult = await db.query(`
      SELECT
        id,
        original_email,
        name,
        deleted_at,
        deletion_reason,
        subscription_status,
        EXTRACT(DAY FROM (deleted_at - created_at)) as days_active,
        EXISTS(SELECT 1 FROM users u2 WHERE u2.previous_account_id = users.id) as has_returned
      FROM users
      WHERE is_deleted = TRUE
      ORDER BY deleted_at DESC
      LIMIT 50
    `);

    // Get returning users with timeline
    const returningUsersResult = await db.query(`
      SELECT
        new.id as new_account_id,
        new.email,
        new.name,
        new.created_at as rejoined_at,
        old.id as old_account_id,
        old.deleted_at,
        old.deletion_reason,
        EXTRACT(DAY FROM (new.created_at - old.deleted_at)) as days_away
      FROM users new
      JOIN users old ON new.previous_account_id = old.id
      WHERE old.is_deleted = TRUE
      ORDER BY new.created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        deletionReasons: reasonsResult.rows,
        recentDeletions: recentDeletionsResult.rows,
        returningUsers: returningUsersResult.rows
      }
    });
  } catch (error) {
    console.error('Get deletion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deletion analytics'
    });
  }
});

// Get deleted accounts list
router.get('/deleted-accounts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await db.query(`
      SELECT
        id,
        original_email,
        name,
        email as modified_email,
        subscription_status,
        deleted_at,
        deletion_reason,
        created_at,
        EXTRACT(DAY FROM (deleted_at - created_at)) as days_active,
        EXISTS(SELECT 1 FROM users u2 WHERE u2.previous_account_id = users.id) as has_returned
      FROM users
      WHERE is_deleted = TRUE
      ORDER BY deleted_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM users WHERE is_deleted = TRUE'
    );

    res.json({
      success: true,
      data: {
        accounts: result.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get deleted accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deleted accounts'
    });
  }
});

// Get all feedback
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const { status, type, priority, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        f.*,
        u.name as user_name,
        u.email as user_email
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filters
    if (status) {
      query += ` AND f.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type) {
      query += ` AND f.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (priority) {
      query += ` AND f.priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }

    query += ` ORDER BY
      CASE f.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      f.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message,
    });
  }
});

// Update feedback
router.put('/feedback/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, priority, admin_notes } = req.body;

  try {
    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;

      // Set resolved_at if status is resolved or closed
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
      }
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`);
      params.push(priority);
      paramCount++;
    }

    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramCount}`);
      params.push(admin_notes);
      paramCount++;
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE feedback
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message,
    });
  }
});

// Delete feedback
router.delete('/feedback/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM feedback WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message,
    });
  }
});

// Get feedback stats
router.get('/feedback/stats', adminAuth, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed,
        COUNT(*) FILTER (WHERE type = 'bug') as bugs,
        COUNT(*) FILTER (WHERE type = 'feature_request') as features,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical,
        COUNT(*) FILTER (WHERE priority = 'high') as high,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as this_month
      FROM feedback
    `);

    res.json({
      success: true,
      data: stats.rows[0],
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback stats',
      error: error.message,
    });
  }
});

// ===== USER ACTIVITY MONITORING ENDPOINTS =====

// Get user activity overview
router.get('/user-activity/overview', adminAuth, async (req, res) => {
  try {
    const { period = '7' } = req.query;

    // Validate period parameter
    const validPeriod = parseInt(period);
    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be a number between 1 and 365.'
      });
    }

    // Get currently active users (within last 5 minutes)
    const activeUsers = await db.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_activity_at >= NOW() - INTERVAL '5 minutes'
        AND (is_admin = false OR is_admin IS NULL)
    `);

    // Get total users
    const totalUsers = await db.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE is_admin = false OR is_admin IS NULL
    `);

    // Get users who logged in today
    const todayLogins = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_activity_logs
      WHERE activity_type = 'login'
        AND created_at >= CURRENT_DATE
    `);

    // Get device breakdown
    const deviceBreakdown = await db.query(`
      SELECT
        COALESCE(device_type, 'unknown') as device_type,
        COUNT(*) as count
      FROM user_activity_logs
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND activity_type = 'login'
      GROUP BY device_type
      ORDER BY count DESC
    `, [validPeriod]);

    // Get platform breakdown
    const platformBreakdown = await db.query(`
      SELECT
        COALESCE(platform, 'unknown') as platform,
        COUNT(*) as count
      FROM user_activity_logs
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND activity_type = 'login'
      GROUP BY platform
      ORDER BY count DESC
    `, [validPeriod]);

    // Get daily login trends
    const dailyLogins = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as unique_logins,
        COUNT(*) as total_logins
      FROM user_activity_logs
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND activity_type = 'login'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [validPeriod]);

    // Get average session duration
    const avgSessionDuration = await db.query(`
      SELECT
        AVG(session_duration_seconds) as avg_duration_seconds,
        MIN(session_duration_seconds) as min_duration_seconds,
        MAX(session_duration_seconds) as max_duration_seconds
      FROM user_activity_logs
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND activity_type = 'logout'
        AND session_duration_seconds IS NOT NULL
    `, [validPeriod]);

    res.json({
      success: true,
      data: {
        activeUsersNow: parseInt(activeUsers.rows[0]?.count || 0),
        totalUsers: parseInt(totalUsers.rows[0]?.count || 0),
        todayLogins: parseInt(todayLogins.rows[0]?.count || 0),
        deviceBreakdown: deviceBreakdown.rows,
        platformBreakdown: platformBreakdown.rows,
        dailyLogins: dailyLogins.rows,
        avgSessionDuration: {
          avg: parseFloat(avgSessionDuration.rows[0]?.avg_duration_seconds || 0),
          min: parseInt(avgSessionDuration.rows[0]?.min_duration_seconds || 0),
          max: parseInt(avgSessionDuration.rows[0]?.max_duration_seconds || 0)
        }
      }
    });
  } catch (error) {
    console.error('User activity overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity overview'
    });
  }
});

// Get detailed activity logs
router.get('/user-activity/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, activityType, deviceType } = req.query;

    // Validate parameters
    const validPage = parseInt(page);
    const validLimit = parseInt(limit);

    if (isNaN(validPage) || validPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }

    const offset = (validPage - 1) * validLimit;

    // Build WHERE clause based on filters
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    if (userId) {
      whereConditions.push(`ual.user_id = $${paramCounter}`);
      queryParams.push(parseInt(userId));
      paramCounter++;
    }

    if (activityType) {
      whereConditions.push(`ual.activity_type = $${paramCounter}`);
      queryParams.push(activityType);
      paramCounter++;
    }

    if (deviceType) {
      whereConditions.push(`ual.device_type = $${paramCounter}`);
      queryParams.push(deviceType);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get activity logs with user details
    const logs = await db.query(`
      SELECT
        ual.id,
        ual.user_id,
        ual.activity_type,
        ual.device_type,
        ual.device_info,
        ual.ip_address,
        ual.platform,
        ual.app_version,
        ual.session_duration_seconds,
        ual.created_at,
        u.email as user_email,
        u.name as user_name
      FROM user_activity_logs ual
      JOIN users u ON ual.user_id = u.id
      ${whereClause}
      ORDER BY ual.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `, [...queryParams, validLimit, offset]);

    // Get total count for pagination
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM user_activity_logs ual
      ${whereClause}
    `, queryParams);

    res.json({
      success: true,
      data: {
        logs: logs.rows,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: parseInt(countResult.rows[0]?.total || 0),
          totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / validLimit)
        }
      }
    });
  } catch (error) {
    console.error('User activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity logs'
    });
  }
});

// Get user-specific activity history
router.get('/user-activity/user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Validate parameters
    const validUserId = parseInt(userId);
    const validLimit = parseInt(limit);

    if (isNaN(validUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }

    // Get user details
    const userResult = await db.query(`
      SELECT id, email, name, created_at, last_login_at, last_activity_at
      FROM users
      WHERE id = $1
    `, [validUserId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get activity logs for this user
    const logs = await db.query(`
      SELECT
        id,
        activity_type,
        device_type,
        device_info,
        ip_address,
        platform,
        app_version,
        session_duration_seconds,
        created_at
      FROM user_activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [validUserId, validLimit]);

    // Get activity summary
    const summary = await db.query(`
      SELECT
        activity_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM user_activity_logs
      WHERE user_id = $1
      GROUP BY activity_type
    `, [validUserId]);

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        logs: logs.rows,
        summary: summary.rows
      }
    });
  } catch (error) {
    console.error('User activity history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity history'
    });
  }
});

// Get currently active users (real-time)
router.get('/user-activity/active-now', adminAuth, async (req, res) => {
  try {
    const activeUsers = await db.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.last_login_at,
        u.last_activity_at,
        EXTRACT(EPOCH FROM (NOW() - u.last_activity_at))/60 AS minutes_since_activity
      FROM users u
      WHERE u.last_activity_at >= NOW() - INTERVAL '5 minutes'
        AND (u.is_admin = false OR u.is_admin IS NULL)
      ORDER BY u.last_activity_at DESC
    `);

    res.json({
      success: true,
      data: {
        count: activeUsers.rows.length,
        users: activeUsers.rows
      }
    });
  } catch (error) {
    console.error('Active users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active users'
    });
  }
});

// ===== JOURNAL MANAGEMENT ENDPOINTS =====

// Get all journal entries with filters and pagination
router.get('/journals', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, mood, userId, startDate, endDate } = req.query;

    // Validate parameters
    const validPage = parseInt(page);
    const validLimit = parseInt(limit);

    if (isNaN(validPage) || validPage < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }

    const offset = (validPage - 1) * validLimit;

    // Build WHERE clause based on filters
    let whereConditions = [];
    let queryParams = [];
    let paramCounter = 1;

    if (search) {
      whereConditions.push(`(je.content ILIKE $${paramCounter} OR je.tags::text ILIKE $${paramCounter})`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    if (mood) {
      whereConditions.push(`je.mood = $${paramCounter}`);
      queryParams.push(mood);
      paramCounter++;
    }

    if (userId) {
      const validUserId = parseInt(userId);
      if (!isNaN(validUserId)) {
        whereConditions.push(`je.user_id = $${paramCounter}`);
        queryParams.push(validUserId);
        paramCounter++;
      }
    }

    if (startDate) {
      whereConditions.push(`je.created_at >= $${paramCounter}`);
      queryParams.push(startDate);
      paramCounter++;
    }

    if (endDate) {
      whereConditions.push(`je.created_at <= $${paramCounter}`);
      queryParams.push(endDate);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get journal entries with user details
    const journals = await db.query(`
      SELECT
        je.id,
        je.user_id,
        je.content,
        je.mood,
        CASE
          WHEN je.tags IS NOT NULL AND jsonb_array_length(je.tags) > 0
          THEN (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(je.tags))
          ELSE NULL
        END as tags,
        je.is_favorite,
        je.created_at,
        je.updated_at,
        u.email as user_email,
        u.name as user_name
      FROM journal_entries je
      JOIN users u ON je.user_id = u.id
      ${whereClause}
      ORDER BY je.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `, [...queryParams, validLimit, offset]);

    // Get total count for pagination
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM journal_entries je
      ${whereClause}
    `, queryParams);

    // Get mood distribution
    const moodStats = await db.query(`
      SELECT
        mood,
        COUNT(*) as count
      FROM journal_entries
      ${whereClause}
      GROUP BY mood
      ORDER BY count DESC
    `, queryParams);

    res.json({
      success: true,
      data: {
        journals: journals.rows,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: parseInt(countResult.rows[0]?.total || 0),
          totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / validLimit)
        },
        moodStats: moodStats.rows
      }
    });
  } catch (error) {
    console.error('Journal management error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journals'
    });
  }
});

// Get single journal entry details
router.get('/journals/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validId = parseInt(id);

    if (isNaN(validId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID parameter.'
      });
    }

    const result = await db.query(`
      SELECT
        je.id,
        je.user_id,
        je.content,
        je.mood,
        CASE
          WHEN je.tags IS NOT NULL AND jsonb_array_length(je.tags) > 0
          THEN (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(je.tags))
          ELSE NULL
        END as tags,
        je.is_favorite,
        je.created_at,
        je.updated_at,
        u.email as user_email,
        u.name as user_name,
        u.created_at as user_joined_at
      FROM journal_entries je
      JOIN users u ON je.user_id = u.id
      WHERE je.id = $1
    `, [validId]);

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
    console.error('Journal detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal entry'
    });
  }
});

// Get user's journal entries
router.get('/journals/user/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const validUserId = parseInt(userId);
    const validLimit = parseInt(limit);

    if (isNaN(validUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }

    // Get user details
    const userResult = await db.query(`
      SELECT id, email, name, created_at
      FROM users
      WHERE id = $1
    `, [validUserId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get journal entries
    const journals = await db.query(`
      SELECT
        id,
        content,
        mood,
        CASE
          WHEN tags IS NOT NULL AND jsonb_array_length(tags) > 0
          THEN (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(tags))
          ELSE NULL
        END as tags,
        is_favorite,
        created_at,
        updated_at
      FROM journal_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [validUserId, validLimit]);

    // Get journal statistics
    const stats = await db.query(`
      SELECT
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE is_favorite = true) as favorite_count,
        COUNT(DISTINCT mood) as unique_moods,
        MAX(created_at) as last_entry_date
      FROM journal_entries
      WHERE user_id = $1
    `, [validUserId]);

    // Get mood distribution for this user
    const moodDistribution = await db.query(`
      SELECT
        mood,
        COUNT(*) as count
      FROM journal_entries
      WHERE user_id = $1
      GROUP BY mood
      ORDER BY count DESC
    `, [validUserId]);

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        journals: journals.rows,
        stats: stats.rows[0],
        moodDistribution: moodDistribution.rows
      }
    });
  } catch (error) {
    console.error('User journals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user journals'
    });
  }
});

// Delete journal entry (admin moderation)
router.delete('/journals/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validId = parseInt(id);

    if (isNaN(validId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid journal ID parameter.'
      });
    }

    const result = await db.query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING id',
      [validId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting journal entry'
    });
  }
});

// Get journal analytics
router.get('/journals/analytics/overview', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Validate period parameter
    const validPeriod = parseInt(period);
    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter. Must be a number between 1 and 365.'
      });
    }

    // Total entries
    const totalEntries = await db.query(`
      SELECT COUNT(*) as count
      FROM journal_entries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    `, [validPeriod]);

    // Active journalers (users who wrote at least 1 entry)
    const activeUsers = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM journal_entries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    `, [validPeriod]);

    // Avg entries per user
    const avgPerUser = await db.query(`
      SELECT AVG(entry_count) as avg_entries
      FROM (
        SELECT user_id, COUNT(*) as entry_count
        FROM journal_entries
        WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        GROUP BY user_id
      ) user_entries
    `, [validPeriod]);

    // Daily journal trend
    const dailyTrend = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as entry_count,
        COUNT(DISTINCT user_id) as unique_users
      FROM journal_entries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [validPeriod]);

    // Most common moods
    const topMoods = await db.query(`
      SELECT
        mood,
        COUNT(*) as count
      FROM journal_entries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND mood IS NOT NULL
      GROUP BY mood
      ORDER BY count DESC
      LIMIT 10
    `, [validPeriod]);

    // Most common tags
    const topTags = await db.query(`
      SELECT
        jsonb_array_elements_text(tags) as tag,
        COUNT(*) as count
      FROM journal_entries
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
        AND tags IS NOT NULL
        AND jsonb_array_length(tags) > 0
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 10
    `, [validPeriod]);

    res.json({
      success: true,
      data: {
        totalEntries: parseInt(totalEntries.rows[0]?.count || 0),
        activeUsers: parseInt(activeUsers.rows[0]?.count || 0),
        avgEntriesPerUser: parseFloat(avgPerUser.rows[0]?.avg_entries || 0).toFixed(1),
        dailyTrend: dailyTrend.rows,
        topMoods: topMoods.rows,
        topTags: topTags.rows
      }
    });
  } catch (error) {
    console.error('Journal analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching journal analytics'
    });
  }
});

// ===== EXPORT ENDPOINTS =====

const {
  convertToCSV,
  createExcelWorkbook,
  formatMoodAnalyticsForExport,
  formatUserActivityForExport,
  formatJournalsForExport,
  formatProgressAnalyticsForExport
} = require('../utils/exportHelpers');

// Export mood analytics
router.get('/export/mood-analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30', format = 'csv' } = req.query;

    // Validate period parameter
    const validPeriod = parseInt(period);
    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter.'
      });
    }

    // Fetch mood data (reuse existing query)
    const moodDistribution = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY mood
       ORDER BY count DESC`,
      [validPeriod]
    );

    const focusDistribution = await db.query(
      `SELECT focus_level, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY focus_level
       ORDER BY count DESC`,
      [validPeriod]
    );

    const data = formatMoodAnalyticsForExport({
      moodDistribution: moodDistribution.rows,
      focusDistribution: focusDistribution.rows
    });

    if (format === 'excel') {
      const workbook = await createExcelWorkbook(data, 'Mood Analytics');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=mood-analytics-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=mood-analytics-${Date.now()}.csv`);
      res.send(csv);
    }
  } catch (error) {
    console.error('Export mood analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting mood analytics'
    });
  }
});

// Export user activity logs
router.get('/export/user-activity', adminAuth, async (req, res) => {
  try {
    const { period = '7', format = 'csv', limit = 1000 } = req.query;

    // Validate parameters
    const validPeriod = parseInt(period);
    const validLimit = parseInt(limit);

    if (isNaN(validPeriod) || validPeriod < 1 || validPeriod > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period parameter.'
      });
    }

    if (isNaN(validLimit) || validLimit < 1 || validLimit > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 10000.'
      });
    }

    // Fetch activity logs
    const logs = await db.query(`
      SELECT
        ual.activity_type,
        ual.device_type,
        ual.platform,
        ual.ip_address,
        ual.session_duration_seconds,
        ual.created_at,
        u.email as user_email,
        u.name as user_name
      FROM user_activity_logs ual
      JOIN users u ON ual.user_id = u.id
      WHERE ual.created_at >= NOW() - INTERVAL '1 day' * $1
      ORDER BY ual.created_at DESC
      LIMIT $2
    `, [validPeriod, validLimit]);

    const data = formatUserActivityForExport(logs.rows);

    if (format === 'excel') {
      const workbook = await createExcelWorkbook(data, 'User Activity');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=user-activity-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-activity-${Date.now()}.csv`);
      res.send(csv);
    }
  } catch (error) {
    console.error('Export user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting user activity'
    });
  }
});

// Export journals
router.get('/export/journals', adminAuth, async (req, res) => {
  try {
    const { format = 'csv', limit = 1000, mood } = req.query;

    // Validate limit
    const validLimit = parseInt(limit);
    if (isNaN(validLimit) || validLimit < 1 || validLimit > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 10000.'
      });
    }

    // Build WHERE clause
    let whereClause = '';
    let queryParams = [validLimit];

    if (mood) {
      whereClause = 'WHERE je.mood = $2';
      queryParams.push(mood);
    }

    // Fetch journals
    const journals = await db.query(`
      SELECT
        je.content,
        je.mood,
        je.tags,
        je.is_favorite,
        je.created_at,
        u.email as user_email,
        u.name as user_name
      FROM journal_entries je
      JOIN users u ON je.user_id = u.id
      ${whereClause}
      ORDER BY je.created_at DESC
      LIMIT $1
    `, queryParams);

    const data = formatJournalsForExport(journals.rows);

    if (format === 'excel') {
      const workbook = await createExcelWorkbook(data, 'Journals');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=journals-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=journals-${Date.now()}.csv`);
      res.send(csv);
    }
  } catch (error) {
    console.error('Export journals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting journals'
    });
  }
});

// Export progress analytics
router.get('/export/progress-analytics', adminAuth, async (req, res) => {
  try {
    const { days = '7', format = 'csv' } = req.query;

    // Validate days parameter
    const validDays = parseInt(days);
    if (isNaN(validDays) || validDays < 1 || validDays > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid days parameter.'
      });
    }

    // Fetch user progress data
    const userProgress = await db.query(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(SUM(up.sessions_completed), 0) as total_sessions,
        COALESCE(SUM(up.total_minutes), 0) as total_minutes,
        MAX(up.streak_days) as current_streak,
        ROUND(AVG(up.mood_rating), 1) as avg_mood,
        ROUND(AVG(up.focus_percentage), 0) as avg_focus,
        COUNT(DISTINCT uc.course_id) FILTER (WHERE uc.is_active = true) as courses_enrolled,
        COUNT(DISTINCT uc.course_id) FILTER (WHERE uc.completed_at IS NOT NULL) as courses_completed,
        MAX(up.date) as last_active
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id AND up.date >= CURRENT_DATE - INTERVAL '1 day' * $1
      LEFT JOIN user_courses uc ON u.id = uc.user_id
      WHERE u.is_admin = false
      GROUP BY u.id, u.name, u.email
      HAVING SUM(up.sessions_completed) > 0
      ORDER BY total_sessions DESC, total_minutes DESC
    `, [validDays]);

    const data = formatProgressAnalyticsForExport(userProgress.rows);

    if (format === 'excel') {
      const workbook = await createExcelWorkbook(data, 'Progress Analytics');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=progress-analytics-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=progress-analytics-${Date.now()}.csv`);
      res.send(csv);
    }
  } catch (error) {
    console.error('Export progress analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting progress analytics'
    });
  }
});

module.exports = router;
