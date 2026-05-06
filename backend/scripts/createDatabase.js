const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database to create our app database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME || 'digitalcoffee']
    );

    if (result.rows.length > 0) {
      console.log(`ℹ️  Database "${process.env.DB_NAME}" already exists`);
    } else {
      // Create database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'digitalcoffee'}`);
      console.log(`✅ Database "${process.env.DB_NAME}" created successfully!`);
    }

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createDatabase();
