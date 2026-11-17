// Simple database test
const pg = require('pg');

const config = {
  connectionString: 'postgresql://postgres:postgres@localhost:5432/trolyao',
};

const pool = new pg.Pool(config);

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to database!');
  
  client.query('SELECT 1 AS test', (err, result) => {
    if (err) {
      console.error('Error executing query:', err.message);
      release();
      process.exit(1);
    }
    
    console.log('Query result:', result.rows);
    
    // Check if users table exists
    client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'",
      (err, result) => {
        if (err) {
          console.error('Error checking users table:', err.message);
          release();
          process.exit(1);
        }
        
        console.log('Users table exists:', result.rows.length > 0);
        
        // Check for ban columns
        client.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name LIKE 'ban_%'",
          (err, result) => {
            if (err) {
              console.error('Error checking ban columns:', err.message);
              release();
              process.exit(1);
            }
            
            console.log('Ban columns:', result.rows.map(r => r.column_name));
            
            // Check schema_migrations
            client.query('SELECT * FROM schema_migrations ORDER BY migration_id', (err, result) => {
              if (err) {
                console.error('Error checking schema_migrations:', err.message);
                release();
                process.exit(1);
              }
              
              console.log('Schema migrations:', result.rows.map(r => r.migration_id));
              release();
              process.exit(0);
            });
          }
        );
      }
    );
  });
});