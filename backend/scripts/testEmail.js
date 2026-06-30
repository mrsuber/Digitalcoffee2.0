require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n📧 Email Configuration Test\n');
console.log('Environment:', process.env.NODE_ENV);
console.log('Email Host:', process.env.EMAIL_HOST);
console.log('Email Port:', process.env.EMAIL_PORT);
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email From:', process.env.EMAIL_FROM);
console.log('Email Secure:', process.env.EMAIL_SECURE);
console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***SET***' : '***NOT SET***');

async function testEmail() {
  console.log('\n🔄 Creating transporter...\n');

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true  // Enable logging
  });

  console.log('\n✅ Transporter created\n');
  console.log('\n🔄 Verifying SMTP connection...\n');

  try {
    await transporter.verify();
    console.log('\n✅ SMTP connection verified successfully!\n');
  } catch (error) {
    console.error('\n❌ SMTP connection verification failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }

  console.log('\n🔄 Sending test email...\n');

  const mailOptions = {
    from: `"Digital Coffee Test" <${process.env.EMAIL_FROM}>`,
    to: process.env.EMAIL_USER, // Send to ourselves for testing
    subject: 'Test Email - Digital Coffee',
    html: `
      <h2>Test Email</h2>
      <p>This is a test email from Digital Coffee backend.</p>
      <p>If you received this, your email configuration is working correctly!</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `,
    text: `
Test Email - Digital Coffee

This is a test email from Digital Coffee backend.
If you received this, your email configuration is working correctly!

Sent at: ${new Date().toISOString()}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('\n✅ Test email sent successfully!\n');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n📬 Check your inbox at:', process.env.EMAIL_USER);
  } catch (error) {
    console.error('\n❌ Failed to send test email:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEmail();
