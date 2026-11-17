// Database setup script for Tro Ly Ao
// This script sets up PostgreSQL connection and runs migrations

const { spawn } = require('child_process');
const path = require('path');

// Set DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  // Try common local PostgreSQL configurations
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/trolyao';
  console.log('DATABASE_URL set to default value');
}

// Check if pg (node-postgres) is available
try {
  require('pg');
  console.log('pg module available');
} catch (e) {
  console.log('pg module not available, installing...');
  const npmInstall = spawn('npm', ['install', 'pg'], { cwd: __dirname, stdio: 'pipe' });
  npmInstall.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to install pg module');
      process.exit(1);
    }
  });
}

// Check if PostgreSQL is running and accessible
async function checkDatabase() {
  const { Pool } = require('pg');
  const databaseUrl = process.env.DATABASE_URL?.trim();
  
  if (!databaseUrl) {
    console.error('DATABASE_URL not configured');
    process.exit(1);
  }
  
  console.log('Connecting to database with URL:', databaseUrl.replace(/\/[^\/]+$/, '/*masked*/'));
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
  
  try {
    const client = await pool.connect();
    try {
      // Test basic connection
      const result = await client.query('SELECT 1 AS test');
      console.log('Database connection test:', result.rows[0].test);
      
      // Check if users table exists
      const tablesResult = await client.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
      );
      console.log('Users table exists:', tablesResult.rows.length > 0);
      
      // Check for ban columns
      const columnsResult = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name LIKE 'ban_%'"
      );
      console.log('Ban columns found:', columnsResult.rows.map(r => r.column_name));
      
      // Check schema_migrations
      const migrationsResult = await client.query('SELECT * FROM schema_migrations ORDER BY migration_id');
      console.log('Schema migrations:', migrationsResult.rows.map(r => r.migration_id));
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch((e) => {
  console.error('Failed to check database:', e);
  process.exit(1);
});