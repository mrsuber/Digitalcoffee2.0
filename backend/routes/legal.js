const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public endpoints - Get legal documents
router.get('/documents/:type', async (req, res) => {
  try {
    const { type } = req.params;

    // Validate document type
    if (!['terms_of_service', 'privacy_policy'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type. Must be terms_of_service or privacy_policy'
      });
    }

    const result = await db.query(
      `SELECT id, document_type, title, content, version, last_updated
       FROM legal_documents
       WHERE document_type = $1 AND is_active = TRUE
       ORDER BY last_updated DESC
       LIMIT 1`,
      [type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get legal document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document'
    });
  }
});

// Public endpoint - Get all active legal documents
router.get('/documents', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, document_type, title, content, version, last_updated
       FROM legal_documents
       WHERE is_active = TRUE
       ORDER BY document_type`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get legal documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

// Admin endpoints - Require authentication and admin role
router.use(authenticateToken);

// Get document for editing (admin only)
router.get('/admin/documents/:type', isAdmin, async (req, res) => {
  try {
    const { type } = req.params;

    const result = await db.query(
      `SELECT ld.*, u.name as updated_by_name
       FROM legal_documents ld
       LEFT JOIN users u ON ld.updated_by = u.id
       WHERE ld.document_type = $1 AND ld.is_active = TRUE
       LIMIT 1`,
      [type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get legal document for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document'
    });
  }
});

// Update legal document (admin only)
router.put('/admin/documents/:type', isAdmin, async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { type } = req.params;
    const { title, content, version } = req.body;
    const userId = req.user.userId;

    // Validate inputs
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Get current document
    const currentDoc = await client.query(
      'SELECT * FROM legal_documents WHERE document_type = $1 AND is_active = TRUE',
      [type]
    );

    if (currentDoc.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const oldDoc = currentDoc.rows[0];

    // Save current version to history
    await client.query(
      `INSERT INTO legal_documents_history (document_id, document_type, title, content, version, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [oldDoc.id, oldDoc.document_type, oldDoc.title, oldDoc.content, oldDoc.version, oldDoc.updated_by]
    );

    // Update document
    const result = await client.query(
      `UPDATE legal_documents
       SET title = $1,
           content = $2,
           version = $3,
           updated_by = $4,
           last_updated = CURRENT_TIMESTAMP
       WHERE document_type = $5 AND is_active = TRUE
       RETURNING *`,
      [title, content, version || oldDoc.version, userId, type]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update legal document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get document history (admin only)
router.get('/admin/documents/:type/history', isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const result = await db.query(
      `SELECT ldh.*, u.name as updated_by_name
       FROM legal_documents_history ldh
       LEFT JOIN users u ON ldh.updated_by = u.id
       WHERE ldh.document_type = $1
       ORDER BY ldh.created_at DESC
       LIMIT $2`,
      [type, limit]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get document history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching document history'
    });
  }
});

// Get all documents (admin only)
router.get('/admin/documents', isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT ld.*, u.name as updated_by_name
       FROM legal_documents ld
       LEFT JOIN users u ON ld.updated_by = u.id
       WHERE ld.is_active = TRUE
       ORDER BY ld.document_type`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get all legal documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

module.exports = router;
