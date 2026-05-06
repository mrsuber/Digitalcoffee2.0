const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}`);

    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await db.query(sql);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name');
  console.log('Usage: node scripts/runMigration.js <migration-file.sql>');
  process.exit(1);
}

runMigration(migrationFile);
