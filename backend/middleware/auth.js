const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

// Generate short-lived access token (15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
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

module.exports = {
  authenticateToken,
  generateToken,
  generateAccessToken,
  generateRefreshToken,
};
