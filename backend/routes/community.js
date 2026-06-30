const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const pool = db.pool;

// Get all community posts (feed)
router.get('/posts', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const postsQuery = `
      SELECT
        cp.id,
        cp.content,
        cp.mood,
        cp.session_minutes,
        cp.likes_count,
        cp.comments_count,
        cp.created_at,
        cp.user_id,
        u.name as user_name,
        u.email as user_email,
        up.avatar_url as user_avatar,
        EXISTS(
          SELECT 1 FROM community_post_likes
          WHERE post_id = cp.id AND user_id = $1
        ) as user_has_liked
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      ORDER BY cp.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(postsQuery, [req.user.userId, limit, offset]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community posts'
    });
  }
});

// Create a new community post
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const { content, mood, session_minutes } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Post content must be 500 characters or less'
      });
    }

    const insertQuery = `
      INSERT INTO community_posts (user_id, content, mood, session_minutes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      req.user.userId,
      content.trim(),
      mood || null,
      session_minutes || null
    ]);

    // Fetch the complete post with user info
    const postQuery = `
      SELECT
        cp.id,
        cp.content,
        cp.mood,
        cp.session_minutes,
        cp.likes_count,
        cp.created_at,
        u.name as user_name,
        u.email as user_email,
        up.avatar_url as user_avatar,
        false as user_has_liked
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cp.id = $1
    `;

    const postResult = await pool.query(postQuery, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      data: postResult.rows[0],
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

// Like a post
router.post('/posts/:postId/like', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { postId } = req.params;

    await client.query('BEGIN');

    // Check if post exists
    const postCheck = await client.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked
    const likeCheck = await client.query(
      'SELECT id FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.userId]
    );

    if (likeCheck.rows.length > 0) {
      // Unlike - remove like
      await client.query(
        'DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.userId]
      );

      // Decrement likes count
      await client.query(
        'UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: { liked: false },
        message: 'Post unliked'
      });
    } else {
      // Like - add like
      await client.query(
        'INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, req.user.userId]
      );

      // Increment likes count
      await client.query(
        'UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      );

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: { liked: true },
        message: 'Post liked'
      });
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error liking/unliking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like/unlike post'
    });
  } finally {
    client.release();
  }
});

// Delete a post (only by post author)
router.delete('/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists and belongs to user
    const postCheck = await pool.query(
      'SELECT id, user_id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (postCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete post (likes will cascade delete)
    await pool.query('DELETE FROM community_posts WHERE id = $1', [postId]);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// Get user's own posts
router.get('/posts/me', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const postsQuery = `
      SELECT
        cp.id,
        cp.content,
        cp.mood,
        cp.session_minutes,
        cp.likes_count,
        cp.comments_count,
        cp.created_at,
        cp.user_id,
        u.name as user_name,
        u.email as user_email,
        up.avatar_url as user_avatar
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cp.user_id = $1
      ORDER BY cp.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(postsQuery, [req.user.userId, limit, offset]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user posts'
    });
  }
});

// Get comments for a post
router.get('/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Get all comments for the post (both top-level and replies)
    const commentsQuery = `
      SELECT
        cc.id,
        cc.post_id,
        cc.parent_comment_id,
        cc.content,
        cc.created_at,
        u.name as user_name,
        u.email as user_email,
        up.avatar_url as user_avatar,
        cc.user_id
      FROM community_comments cc
      JOIN users u ON cc.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cc.post_id = $1
      ORDER BY cc.created_at ASC
    `;

    const result = await pool.query(commentsQuery, [postId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// Create a comment or reply
router.post('/posts/:postId/comments', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { postId } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be 500 characters or less'
      });
    }

    await client.query('BEGIN');

    // Check if post exists
    const postCheck = await client.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // If replying to a comment, check if parent comment exists
    if (parent_comment_id) {
      const commentCheck = await client.query(
        'SELECT id FROM community_comments WHERE id = $1 AND post_id = $2',
        [parent_comment_id, postId]
      );

      if (commentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Insert comment
    const insertQuery = `
      INSERT INTO community_comments (post_id, user_id, parent_comment_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      postId,
      req.user.userId,
      parent_comment_id || null,
      content.trim()
    ]);

    // Increment comments count on the post
    await client.query(
      'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    // Fetch the complete comment with user info
    const commentQuery = `
      SELECT
        cc.id,
        cc.post_id,
        cc.parent_comment_id,
        cc.content,
        cc.created_at,
        u.name as user_name,
        u.email as user_email,
        up.avatar_url as user_avatar,
        cc.user_id
      FROM community_comments cc
      JOIN users u ON cc.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE cc.id = $1
    `;

    const commentResult = await pool.query(commentQuery, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      data: commentResult.rows[0],
      message: 'Comment created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment'
    });
  } finally {
    client.release();
  }
});

// Delete a comment (only by comment author)
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { commentId } = req.params;

    await client.query('BEGIN');

    // Check if comment exists and belongs to user
    const commentCheck = await client.query(
      'SELECT id, user_id, post_id FROM community_comments WHERE id = $1',
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    if (commentCheck.rows[0].user_id !== req.user.userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    const postId = commentCheck.rows[0].post_id;

    // Count how many comments will be deleted (including nested replies)
    const countQuery = `
      WITH RECURSIVE comment_tree AS (
        SELECT id FROM community_comments WHERE id = $1
        UNION ALL
        SELECT cc.id FROM community_comments cc
        INNER JOIN comment_tree ct ON cc.parent_comment_id = ct.id
      )
      SELECT COUNT(*) as total FROM comment_tree
    `;
    const countResult = await client.query(countQuery, [commentId]);
    const deleteCount = parseInt(countResult.rows[0].total);

    // Delete comment (replies will cascade delete)
    await client.query('DELETE FROM community_comments WHERE id = $1', [commentId]);

    // Decrement comments count on the post
    await client.query(
      'UPDATE community_posts SET comments_count = GREATEST(comments_count - $1, 0) WHERE id = $2',
      [deleteCount, postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  } finally {
    client.release();
  }
});

// Report a post
router.post('/posts/:postId/report', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const { postId } = req.params;
    const { reason } = req.body;

    await client.query('BEGIN');

    // Check if post exists
    const postCheck = await client.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already reported this post
    const existingReport = await client.query(
      'SELECT id FROM community_post_reports WHERE post_id = $1 AND reported_by = $2',
      [postId, req.user.userId]
    );

    if (existingReport.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    // Create report record
    await client.query(
      'INSERT INTO community_post_reports (post_id, reported_by, reason) VALUES ($1, $2, $3)',
      [postId, req.user.userId, reason || null]
    );

    // Increment report count and mark as reported
    await client.query(
      'UPDATE community_posts SET report_count = report_count + 1, is_reported = true WHERE id = $1',
      [postId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Post reported successfully. Our team will review it.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reporting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report post'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
