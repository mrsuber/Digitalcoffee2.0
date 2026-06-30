const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function resetAdminPassword() {
  try {
    console.log('🔄 Resetting admin password...');

    // Default credentials
    const adminEmail = 'admin@digitalcoffee.cafe';
    const adminPassword = 'admin123';

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    console.log('🔐 Generated password hash');

    // Check if admin exists
    const checkResult = await db.query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkResult.rows.length === 0) {
      // Create admin user
      console.log('👤 Creating new admin user...');
      const createResult = await db.query(
        `INSERT INTO users (email, username, password_hash, name, is_admin)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username`,
        [adminEmail, 'admin', passwordHash, 'Admin User', true]
      );

      console.log('✅ Admin user created:', createResult.rows[0]);
    } else {
      // Update existing admin
      console.log('👤 Updating existing admin user...');
      const updateResult = await db.query(
        `UPDATE users
         SET password_hash = $1,
             is_admin = true,
             username = COALESCE(username, $2)
         WHERE email = $3
         RETURNING id, email, username`,
        [passwordHash, 'admin', adminEmail]
      );

      console.log('✅ Admin password updated:', updateResult.rows[0]);
    }

    console.log('\n📝 Admin Credentials:');
    console.log('   Email/Username: admin@digitalcoffee.cafe OR admin');
    console.log('   Password: admin123');
    console.log('\n✅ Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
