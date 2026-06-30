const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// Submit feedback (user endpoint)
router.post("/submit", authenticateToken, async (req, res) => {
  const { type, subject, description } = req.body;
  const userId = req.user.id;

  try {
    // Validation
    if (!type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Type, subject, and description are required",
      });
    }

    if (!["bug", "feature_request", "general", "support"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type",
      });
    }

    if (subject.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Subject must be 255 characters or less",
      });
    }

    // Get user email
    const userResult = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );
    const userEmail = userResult.rows[0]?.email;

    // Auto-set priority based on type
    let priority = "medium";
    if (type === "bug") {
      priority = "high";
    } else if (type === "feature_request") {
      priority = "medium";
    }

    // Insert feedback
    const result = await pool.query(
      `INSERT INTO feedback
       (user_id, type, subject, description, email, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, type, subject, description, userEmail, priority, "pending"]
    );

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
});

// Get user's own feedback
router.get("/my-feedback", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
});

// ADMIN ENDPOINTS

// Get all feedback (admin only)
router.get("/admin/all", authenticateToken, isAdmin, async (req, res) => {
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

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
});

// Update feedback (admin only)
router.put("/admin/:id", authenticateToken, isAdmin, async (req, res) => {
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
      if (status === "resolved" || status === "closed") {
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
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      message: "Feedback updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update feedback",
      error: error.message,
    });
  }
});

// Delete feedback (admin only)
router.delete("/admin/:id", authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM feedback WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete feedback",
      error: error.message,
    });
  }
});

// Get feedback stats (admin only)
router.get("/admin/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
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
    console.error("Error fetching feedback stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback stats",
      error: error.message,
    });
  }
});

module.exports = router;
