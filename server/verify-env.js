// Verify DATABASE_URL environment variable
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_URL from process:', !!process.env.DATABASE_URL);

// Try to create a Pool
const { Pool } = require('pg');
const url = process.env.DATABASE_URL?.trim();
console.log('URL trimmed:', url ? url.substring(0, 30) + '...' : 'null');

if (url) {
  try {
    const pool = new Pool({ connectionString: url });
    pool.connect().then(() => {
      console.log('Pool connected successfully!');
      pool.end();
    }).catch(err => {
      console.log('Pool connect error:', err.message);
    });
  } catch (e) {
    console.log('Pool creation error:', e.message);
  }
} else {
  console.log('No DATABASE_URL set');
}