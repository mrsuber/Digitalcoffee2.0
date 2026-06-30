const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user progress overview
router.get('/overview', async (req, res) => {
  const userId = req.user.userId;
  const days = parseInt(req.query.days) || 30;

  try {
    const result = await db.query(
      `SELECT date, sessions_completed, total_minutes, average_brainwave_hz,
              mood_rating, focus_percentage, streak_days
       FROM user_progress
       WHERE user_id = $1
       AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
      [userId]
    );

    // Calculate total stats
    const totalSessions = result.rows.reduce((sum, row) => sum + row.sessions_completed, 0);
    const totalMinutes = result.rows.reduce((sum, row) => sum + row.total_minutes, 0);
    const currentStreak = result.rows.length > 0 ? result.rows[0].streak_days : 0;

    res.json({
      success: true,
      data: {
        daily_progress: result.rows,
        summary: {
          total_sessions: totalSessions,
          total_minutes: totalMinutes,
          current_streak: currentStreak,
          days_tracked: result.rows.length
        }
      }
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress overview'
    });
  }
});

// Get today's progress
router.get('/today', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT * FROM user_progress
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Get today progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s progress'
    });
  }
});

// Update or create today's progress
router.post('/update', async (req, res) => {
  const userId = req.user.userId;
  const {
    sessions_completed,
    total_minutes,
    average_brainwave_hz,
    mood_rating,
    focus_percentage
  } = req.body;

  try {
    // Calculate streak
    const streakResult = await db.query(
      `SELECT date FROM user_progress
       WHERE user_id = $1
       ORDER BY date DESC
       LIMIT 1`,
      [userId]
    );

    let streak_days = 1;
    if (streakResult.rows.length > 0) {
      const lastDate = new Date(streakResult.rows[0].date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate.toDateString() === yesterday.toDateString()) {
        const lastStreakResult = await db.query(
          `SELECT streak_days FROM user_progress
           WHERE user_id = $1 AND date = $2`,
          [userId, lastDate.toISOString().split('T')[0]]
        );
        streak_days = (lastStreakResult.rows[0]?.streak_days || 0) + 1;
      }
    }

    const result = await db.query(
      `INSERT INTO user_progress (user_id, date, sessions_completed, total_minutes,
                                  average_brainwave_hz, mood_rating, focus_percentage, streak_days)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, date)
       DO UPDATE SET
         sessions_completed = user_progress.sessions_completed + EXCLUDED.sessions_completed,
         total_minutes = user_progress.total_minutes + EXCLUDED.total_minutes,
         average_brainwave_hz = EXCLUDED.average_brainwave_hz,
         mood_rating = EXCLUDED.mood_rating,
         focus_percentage = EXCLUDED.focus_percentage,
         streak_days = EXCLUDED.streak_days,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, sessions_completed, total_minutes, average_brainwave_hz, mood_rating, focus_percentage, streak_days]
    );

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
});

// Get insights and statistics
router.get('/insights', async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get best time of day
    const bestTimeResult = await db.query(
      `SELECT EXTRACT(HOUR FROM ls.started_at) as hour, COUNT(*) as session_count
       FROM listening_sessions ls
       WHERE ls.user_id = $1 AND ls.completed = true
       GROUP BY hour
       ORDER BY session_count DESC
       LIMIT 1`,
      [userId]
    );

    // Get most used brainwave
    const brainwaveResult = await db.query(
      `SELECT ac.brainwave_type, COUNT(*) as usage_count
       FROM listening_sessions ls
       JOIN audio_content ac ON ls.audio_content_id = ac.id
       WHERE ls.user_id = $1 AND ac.brainwave_type IS NOT NULL
       GROUP BY ac.brainwave_type
       ORDER BY usage_count DESC
       LIMIT 1`,
      [userId]
    );

    // Get focus time percentage (last 7 days)
    const focusResult = await db.query(
      `SELECT AVG(focus_percentage) as avg_focus
       FROM user_progress
       WHERE user_id = $1
       AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        best_time: bestTimeResult.rows[0] || null,
        favorite_brainwave: brainwaveResult.rows[0] || null,
        weekly_focus_avg: focusResult.rows[0]?.avg_focus || null
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching insights'
    });
  }
});

// Get comprehensive stats for progress screen
router.get('/stats', async (req, res) => {
  const userId = req.user.userId;
  const days = parseInt(req.query.days) || 7; // default to week

  try {
    // Get total sessions and minutes
    const totalsResult = await db.query(
      `SELECT
        COALESCE(SUM(sessions_completed), 0) as total_sessions,
        COALESCE(SUM(total_minutes), 0) as total_minutes,
        COALESCE(AVG(mood_rating), 0) as average_mood,
        COALESCE(AVG(focus_percentage), 0) as focus_score
       FROM user_progress
       WHERE user_id = $1
       AND date >= CURRENT_DATE - INTERVAL '${days} days'`,
      [userId]
    );

    // Get current and longest streak
    const streakResult = await db.query(
      `SELECT MAX(streak_days) as longest_streak
       FROM user_progress
       WHERE user_id = $1`,
      [userId]
    );

    const currentStreakResult = await db.query(
      `SELECT streak_days as current_streak
       FROM user_progress
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    // Get courses stats
    const coursesResult = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as courses_completed,
        COUNT(*) FILTER (WHERE is_active = true AND completed_at IS NULL) as courses_in_progress
       FROM user_courses
       WHERE user_id = $1`,
      [userId]
    );

    // Get weekly activity (last 7 days)
    const weeklyResult = await db.query(
      `SELECT
        TO_CHAR(d.date, 'Dy') as day,
        d.date,
        COALESCE(up.sessions_completed, 0) as sessions,
        COALESCE(up.total_minutes, 0) as minutes
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) AS d(date)
       LEFT JOIN user_progress up ON up.date = d.date::date AND up.user_id = $1
       ORDER BY d.date`,
      [userId]
    );

    // Get mood trends (last 7 days)
    const moodResult = await db.query(
      `SELECT
        TO_CHAR(d.date, 'MM/DD') as date,
        COALESCE(up.mood_rating, 0) as mood
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) AS d(date)
       LEFT JOIN user_progress up ON up.date = d.date::date AND up.user_id = $1
       ORDER BY d.date`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        totals: {
          total_sessions: parseInt(totalsResult.rows[0].total_sessions) || 0,
          total_minutes: parseInt(totalsResult.rows[0].total_minutes) || 0,
          average_mood: parseFloat(totalsResult.rows[0].average_mood) || 0,
          focus_score: Math.round(parseFloat(totalsResult.rows[0].focus_score)) || 0,
        },
        streaks: {
          current_streak: parseInt(currentStreakResult.rows[0]?.current_streak) || 0,
          longest_streak: parseInt(streakResult.rows[0]?.longest_streak) || 0,
        },
        courses: {
          courses_completed: parseInt(coursesResult.rows[0]?.courses_completed) || 0,
          courses_in_progress: parseInt(coursesResult.rows[0]?.courses_in_progress) || 0,
        },
        weekly_activity: weeklyResult.rows,
        mood_trends: moodResult.rows,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

module.exports = router;
