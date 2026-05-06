const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // For development, use Ethereal (fake SMTP)
  // For production, use a real email service (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development - use console logging instead of real emails
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'test@ethereal.email',
        pass: process.env.EMAIL_PASSWORD || 'test',
      },
    });
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  const appUrl = process.env.APP_URL || 'http://localhost:19006';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Digital Coffee'}" <${process.env.EMAIL_FROM || 'noreply@digitalcoffee.cafe'}>`,
    to: email,
    subject: 'Reset Your Password - Digital Coffee',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #0a0e27 0%, #1a1448 50%, #0f172a 100%);
            border-radius: 12px;
            padding: 40px;
            color: #ffffff;
          }
          .logo {
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 30px;
          }
          .logo .accent {
            background: linear-gradient(90deg, #4c1d95, #5b21b6, #7c3aed, #0d9488, #14b8a6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(90deg, #4c1d95, #5b21b6, #7c3aed, #0d9488, #14b8a6);
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 20px 0;
          }
          .button-container {
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            text-align: center;
          }
          .warning {
            background: rgba(220, 38, 38, 0.1);
            border-left: 4px solid #dc2626;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            Digital <span class="accent">Coffee</span>
          </div>

          <div class="content">
            <h2 style="margin-top: 0;">Reset Your Password</h2>
            <p>We received a request to reset your password for your Digital Coffee account.</p>
            <p>Click the button below to create a new password:</p>
          </div>

          <div class="button-container">
            <a href="${resetUrl}" class="button">RESET PASSWORD</a>
          </div>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </div>

          <p style="font-size: 14px; color: rgba(255, 255, 255, 0.7);">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #14b8a6; word-break: break-all;">${resetUrl}</a>
          </p>

          <div class="footer">
            <p>Take Control of Your Mind</p>
            <p>&copy; ${new Date().getFullYear()} Digital Coffee. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Reset Your Password - Digital Coffee

We received a request to reset your password for your Digital Coffee account.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

---
Take Control of Your Mind
© ${new Date().getFullYear()} Digital Coffee. All rights reserved.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Password reset email sent (DEV MODE)');
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      console.log('Reset URL: %s', resetUrl);
    }

    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail,
};
