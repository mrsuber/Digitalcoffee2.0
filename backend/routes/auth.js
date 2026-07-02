const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { generateAccessToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim().isLength({ min: 1 }),
    body('subscriptionType').optional().isIn(['free', 'premium']).withMessage('Invalid subscription type')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, name, subscriptionType = 'free' } = req.body;

    try {
      // Check if user already exists with this email (active account)
      const existingUser = await db.query(
        'SELECT id, is_deleted FROM users WHERE email = $1 AND is_deleted = FALSE',
        [email]
      );

      if (existingUser.rows.length > 0) {
        // Active account exists with this email
        return res.status(409).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      // Check if there's a previous deleted account with this email (stored in original_email)
      const previousDeletedAccount = await db.query(
        'SELECT id, deleted_at FROM users WHERE original_email = $1 AND is_deleted = TRUE ORDER BY deleted_at DESC LIMIT 1',
        [email]
      );

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new fresh account
      const result = await db.query(
        `INSERT INTO users (email, password_hash, name, subscription_status, previous_account_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, subscription_status, created_at`,
        [
          email,
          passwordHash,
          name || null,
          subscriptionType,
          previousDeletedAccount.rows.length > 0 ? previousDeletedAccount.rows[0].id : null
        ]
      );

      const user = result.rows[0];

      // Log analytics info if this is a returning user
      if (previousDeletedAccount.rows.length > 0) {
        const previousAccount = previousDeletedAccount.rows[0];
        const daysSinceDeletion = Math.floor((Date.now() - new Date(previousAccount.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`🔄 Returning user! New account ${user.id} created for ${email}. Previous account ${previousAccount.id} was deleted ${daysSinceDeletion} days ago.`);
      }

      // Log subscription history
      await db.query(
        'INSERT INTO subscription_history (user_id, previous_status, new_status, reason) VALUES ($1, $2, $3, $4)',
        [user.id, null, subscriptionType, 'Initial registration']
      );

      // Create user profile with coaching defaults
      await db.query(
        'INSERT INTO user_profiles (user_id, preferences, students_coached, courses_helped_complete, is_available_as_coach) VALUES ($1, $2, $3, $4, $5)',
        [user.id, JSON.stringify({}), 0, 0, true]
      );

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken();

      // Store refresh token in database (expires in 30 days)
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, refreshTokenExpiry]
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription_status: user.subscription_status,
            created_at: user.created_at
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering user'
      });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
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
      // Get user with subscription info
      const result = await db.query(
        'SELECT id, email, password_hash, name, is_deleted, deleted_at, subscription_status FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Check if account is deleted
      if (user.is_deleted) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deleted. Please contact support if you believe this is an error.',
          deleted_at: user.deleted_at
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate access and refresh tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken();

      // Store refresh token in database (expires in 30 days)
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, refreshTokenExpiry]
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription_status: user.subscription_status,
            subscription_type: user.subscription_status // For backward compatibility
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging in'
      });
    }
  }
);

// Forgot password - Request reset
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    try {
      // Check if user exists
      const userResult = await db.query(
        'SELECT id, email, name FROM users WHERE email = $1',
        [email]
      );

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        return res.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        });
      }

      const user = userResult.rows[0];

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Delete any existing tokens for this user
      await db.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [user.id]
      );

      // Store hashed token in database
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, hashedToken, expiresAt]
      );

      // Send reset email with original token (not hashed)
      await sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing password reset request'
      });
    }
  }
);

// Reset password - Set new password
router.post('/reset-password',
  [
    body('token').notEmpty().trim(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    try {
      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid token
      const tokenResult = await db.query(
        `SELECT prt.id, prt.user_id, prt.expires_at, u.email, u.name
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
        [hashedToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      const resetRecord = tokenResult.rows[0];

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update user password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [passwordHash, resetRecord.user_id]
      );

      // Mark token as used
      await db.query(
        'UPDATE password_reset_tokens SET used = true WHERE id = $1',
        [resetRecord.id]
      );

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting password'
      });
    }
  }
);

// Verify reset token (optional - for checking if token is valid before showing form)
router.get('/verify-reset-token/:token',
  async (req, res) => {
    const { token } = req.params;

    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const tokenResult = await db.query(
        `SELECT id FROM password_reset_tokens
         WHERE token = $1 AND used = false AND expires_at > NOW()`,
        [hashedToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid'
      });
    } catch (error) {
      console.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying token'
      });
    }
  }
);

// Refresh access token using refresh token
router.post('/refresh',
  [
    body('refreshToken').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    try {
      // Find valid refresh token
      const tokenResult = await db.query(
        `SELECT rt.id, rt.user_id, rt.expires_at, u.email, u.name
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token = $1 AND rt.revoked = false AND rt.expires_at > NOW()`,
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token'
        });
      }

      const tokenData = tokenResult.rows[0];

      // Generate new access token
      const accessToken = generateAccessToken(tokenData.user_id);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          user: {
            id: tokenData.user_id,
            email: tokenData.email,
            name: tokenData.name
          }
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: 'Error refreshing token'
      });
    }
  }
);

// Logout - Revoke refresh token
router.post('/logout',
  [
    body('refreshToken').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    try {
      // Revoke refresh token
      await db.query(
        'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE token = $1',
        [refreshToken]
      );

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
  }
);

// Switch subscription type (free <-> premium, both $0 for testing)
router.post('/switch-subscription',
  authenticateToken,
  [
    body('subscriptionType').isIn(['free', 'premium']).withMessage('Invalid subscription type')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { subscriptionType } = req.body;
    const userId = req.user.userId;

    try {
      // Get current subscription status
      const userResult = await db.query(
        'SELECT subscription_status FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const currentStatus = userResult.rows[0].subscription_status;

      if (currentStatus === subscriptionType) {
        return res.status(400).json({
          success: false,
          message: `Already on ${subscriptionType} plan`
        });
      }

      // Update subscription status
      await db.query(
        'UPDATE users SET subscription_status = $1, updated_at = NOW() WHERE id = $2',
        [subscriptionType, userId]
      );

      // Log the change (trigger will handle this automatically, but we can add reason)
      await db.query(
        'UPDATE subscription_history SET reason = $1 WHERE user_id = $2 AND new_status = $3 AND changed_at = (SELECT MAX(changed_at) FROM subscription_history WHERE user_id = $2)',
        [`User switched from ${currentStatus} to ${subscriptionType}`, userId, subscriptionType]
      );

      res.json({
        success: true,
        message: `Successfully switched to ${subscriptionType} plan`,
        data: {
          previousStatus: currentStatus,
          newStatus: subscriptionType
        }
      });
    } catch (error) {
      console.error('Subscription switch error:', error);
      res.status(500).json({
        success: false,
        message: 'Error switching subscription'
      });
    }
  }
);

// Soft delete account
router.post('/delete-account',
  authenticateToken,
  [
    body('reason').optional().trim(),
    body('password').notEmpty().withMessage('Password is required for account deletion')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.userId;
    const { reason, password } = req.body;

    try {
      // Get user's current data
      const userResult = await db.query(
        'SELECT email, password_hash, is_deleted FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      // Check if account is already deleted
      if (user.is_deleted) {
        return res.status(400).json({
          success: false,
          message: 'Account is already deleted'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Create unique signature for the deleted email
      const timestamp = Date.now();
      const deletedEmail = `${user.email}__deleted_${timestamp}_${userId}`;

      // Soft delete the account and modify email to allow re-registration
      await db.query(
        `UPDATE users
         SET is_deleted = TRUE,
             deleted_at = CURRENT_TIMESTAMP,
             deletion_reason = $1,
             original_email = $2,
             email = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [reason || 'User requested account deletion', user.email, deletedEmail, userId]
      );

      // Invalidate all refresh tokens for this user
      await db.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [userId]
      );

      console.log(`Account soft deleted for user ${userId} (${user.email} -> ${deletedEmail})`);

      res.json({
        success: true,
        message: 'Your account has been deleted successfully. We\'re sorry to see you go.'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting account. Please try again.'
      });
    }
  }
);

// Save FCM token for push notifications
router.post('/fcm-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.userId;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    // Update user's FCM token
    await db.query(
      'UPDATE users SET fcm_token = $1, updated_at = NOW() WHERE id = $2',
      [fcmToken, userId]
    );

    console.log(`✅ FCM token saved for user ${userId}`);

    res.json({
      success: true,
      message: 'FCM token saved successfully'
    });
  } catch (error) {
    console.error('Save FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving FCM token'
    });
  }
});

module.exports = router;
