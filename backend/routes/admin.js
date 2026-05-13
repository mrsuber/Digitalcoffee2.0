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

    // Check if user is admin
    const result = await db.query(
      'SELECT id, email, name, is_admin FROM users WHERE id = $1 AND is_admin = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
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

      // Get admin user by username or email
      const result = await db.query(
        'SELECT id, email, username, password_hash, name, is_admin FROM users WHERE (email = $1 OR username = $1) AND is_admin = true',
        [email]
      );

      console.log('👤 User query result:', { found: result.rows.length > 0, email });

      if (result.rows.length === 0) {
        console.log('❌ No admin user found with email/username:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials or not an admin'
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

      // Generate token
      const accessToken = generateAccessToken(admin.id);

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          admin: {
            id: admin.id,
            email: admin.email,
            username: admin.username,
            name: admin.name
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
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users WHERE is_admin = false');

    // Get total courses
    const coursesResult = await db.query('SELECT COUNT(*) as total FROM courses');

    // Get total audio content
    const audioResult = await db.query('SELECT COUNT(*) as total FROM audio_content');

    // Get active enrollments
    const enrollmentsResult = await db.query(
      'SELECT COUNT(*) as total FROM course_enrollments WHERE status = $1',
      ['active']
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
       WHERE created_at >= NOW() - INTERVAL '30 days' AND is_admin = false
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
             (SELECT COUNT(*) FROM course_enrollments WHERE user_id = users.id) as enrolled_courses,
             (SELECT COUNT(*) FROM mood_checkins WHERE user_id = users.id) as mood_checkins
      FROM users
      WHERE is_admin = false
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
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_admin = false';
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
      `SELECT id, email, name, created_at FROM users WHERE id = $1 AND is_admin = false`,
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
      `SELECT ce.*, c.title, c.duration_days
       FROM course_enrollments ce
       JOIN courses c ON ce.course_id = c.id
       WHERE ce.user_id = $1
       ORDER BY ce.enrolled_at DESC`,
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
      'DELETE FROM users WHERE id = $1 AND is_admin = false RETURNING id',
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
              (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrolled_users
       FROM courses c
       ORDER BY c.created_at DESC`
    );

    res.json({
      success: true,
      data: {
        courses: result.rows
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

    const { title, description, duration_days, category, difficulty_level, image_url, content } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO courses (title, description, duration_days, category, difficulty_level, image_url, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, description, duration_days, category, difficulty_level || 'beginner', image_url, JSON.stringify(content || {})]
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
    const { title, description, duration_days, category, difficulty_level, image_url, content } = req.body;

    const result = await db.query(
      `UPDATE courses
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           duration_days = COALESCE($3, duration_days),
           category = COALESCE($4, category),
           difficulty_level = COALESCE($5, difficulty_level),
           image_url = COALESCE($6, image_url),
           content = COALESCE($7, content),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, description, duration_days, category, difficulty_level, image_url, content ? JSON.stringify(content) : null, id]
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

    // Mood distribution
    const moodDistribution = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY mood
       ORDER BY count DESC`
    );

    // Focus level distribution
    const focusDistribution = await db.query(
      `SELECT focus_level, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY focus_level
       ORDER BY count DESC`
    );

    // Mood trends over time
    const moodTrends = await db.query(
      `SELECT DATE(created_at) as date, mood, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY DATE(created_at), mood
       ORDER BY date ASC`
    );

    // Daily check-in rate
    const dailyCheckins = await db.query(
      `SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_checkins
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Most common daily goals
    const topGoals = await db.query(
      `SELECT daily_goal, COUNT(*) as count
       FROM mood_checkins
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       AND daily_goal IS NOT NULL
       GROUP BY daily_goal
       ORDER BY count DESC
       LIMIT 10`
    );

    // Users with highest check-in frequency
    const topUsers = await db.query(
      `SELECT u.id, u.email, u.name, COUNT(mc.id) as checkin_count
       FROM users u
       JOIN mood_checkins mc ON u.id = mc.user_id
       WHERE mc.created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY u.id, u.email, u.name
       ORDER BY checkin_count DESC
       LIMIT 10`
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
    const offset = (page - 1) * limit;

    // Total sessions stats
    const totalStats = await db.query(
      `SELECT
        COUNT(*) as total_sessions,
        AVG(duration_listened_seconds) as avg_duration,
        SUM(duration_listened_seconds) as total_duration,
        COUNT(DISTINCT user_id) as unique_users
       FROM listening_sessions
       WHERE created_at >= NOW() - INTERVAL '${period} days'`
    );

    // Sessions by brainwave type
    const brainwaveStats = await db.query(
      `SELECT
        ac.brainwave_type,
        COUNT(als.id) as session_count,
        AVG(als.duration_listened_seconds) as avg_duration,
        SUM(als.duration_listened_seconds) as total_duration
       FROM listening_sessions als
       JOIN audio_content ac ON als.audio_content_id = ac.id
       WHERE als.started_at >= NOW() - INTERVAL '${period} days'
       AND ac.brainwave_type IS NOT NULL
       GROUP BY ac.brainwave_type
       ORDER BY session_count DESC`
    );

    // Daily session trends
    const dailyTrends = await db.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as session_count,
        AVG(duration_listened_seconds) as avg_duration,
        COUNT(DISTINCT user_id) as unique_users
       FROM listening_sessions
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Most popular audio content
    const popularAudio = await db.query(
      `SELECT
        ac.id, ac.title, ac.type, ac.brainwave_type,
        COUNT(als.id) as play_count,
        AVG(als.duration_listened_seconds) as avg_listen_duration
       FROM audio_content ac
       LEFT JOIN listening_sessions als ON ac.id = als.audio_content_id
       WHERE als.started_at >= NOW() - INTERVAL '${period} days' OR als.started_at IS NULL
       GROUP BY ac.id, ac.title, ac.type, ac.brainwave_type
       ORDER BY play_count DESC
       LIMIT 10`
    );

    // Recent sessions with user details
    const recentSessions = await db.query(
      `SELECT
        als.id, als.duration_listened_seconds, als.created_at as started_at, als.completed_at,
        u.email, u.name as user_name,
        ac.title as audio_title, ac.type, ac.brainwave_type
       FROM listening_sessions als
       JOIN users u ON als.user_id = u.id
       JOIN audio_content ac ON als.audio_content_id = ac.id
       WHERE als.created_at >= NOW() - INTERVAL '${period} days'
       ORDER BY als.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) as total
       FROM listening_sessions
       WHERE created_at >= NOW() - INTERVAL '${period} days'`
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

    // Daily active users
    const dailyActiveUsers = await db.query(
      `SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as active_users
       FROM listening_sessions
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // User retention (users who returned)
    const retention = await db.query(
      `WITH first_session AS (
        SELECT user_id, MIN(DATE(created_at)) as first_date
        FROM listening_sessions
        GROUP BY user_id
      ),
      returning_users AS (
        SELECT als.user_id, DATE(als.started_at) as session_date
        FROM listening_sessions als
        JOIN first_session fs ON als.user_id = fs.user_id
        WHERE DATE(als.started_at) > fs.first_date
        AND als.started_at >= NOW() - INTERVAL '${period} days'
      )
      SELECT COUNT(DISTINCT user_id) as returning_users
      FROM returning_users`
    );

    // Average sessions per user
    const avgSessionsPerUser = await db.query(
      `SELECT AVG(session_count) as avg_sessions
       FROM (
         SELECT user_id, COUNT(*) as session_count
         FROM listening_sessions
         WHERE created_at >= NOW() - INTERVAL '${period} days'
         GROUP BY user_id
       ) user_sessions`
    );

    // Completion rate
    const completionRate = await db.query(
      `SELECT
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_sessions,
        ROUND(
          (COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::DECIMAL / COUNT(*)) * 100,
          2
        ) as completion_rate
       FROM listening_sessions
       WHERE created_at >= NOW() - INTERVAL '${period} days'`
    );

    res.json({
      success: true,
      data: {
        dailyActiveUsers: dailyActiveUsers.rows,
        returningUsers: parseInt(retention.rows[0].returning_users),
        avgSessionsPerUser: parseFloat(avgSessionsPerUser.rows[0].avg_sessions || 0),
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

module.exports = router;
