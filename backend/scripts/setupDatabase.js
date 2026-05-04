const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('📦 Setting up Digital Coffee database...\n');

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schema);

    console.log('✅ Database schema created successfully!\n');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - user_profiles');
    console.log('  - mood_checkins');
    console.log('  - courses');
    console.log('  - course_sessions');
    console.log('  - user_courses');
    console.log('  - audio_content');
    console.log('  - listening_sessions');
    console.log('  - user_progress');
    console.log('  - journal_entries\n');

    console.log('✅ Default courses and audio content seeded!\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
