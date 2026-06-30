const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Generate access token (7 days)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate long-lived refresh token (30 days)
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Legacy function for backward compatibility
const generateToken = (userId) => {
  return generateAccessToken(userId);
};

// Verify token function (synchronous)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Middleware to require admin role
const isAdmin = async (req, res, next) => {
  try {
    // Check if user has admin role
    const result = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying role'
    });
  }
};

// Middleware to require professional coach role
const requireProfessionalCoach = async (req, res, next) => {
  try {
    // Check if user has professional_coach role
    const result = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    if (user.role !== 'professional_coach') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Professional coach role required.'
      });
    }

    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying role'
    });
  }
};

module.exports = {
  authenticateToken,
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  isAdmin,
  requireProfessionalCoach,
};
