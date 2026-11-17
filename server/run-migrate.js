// Run database migration
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/trolyao';

const { pool, closeDatabase } = require('./database');

async function main() {
  if (!pool) {
    console.error('DATABASE_URL is not configured; no migration was run.');
    process.exit(1);
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(580121501)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    const MIGRATION_IDS = [
      '001_initial_schema',
      '002_garden_rewards_legacy_import',
      '003_ban_columns'
    ];
    
    for (const migrationId of MIGRATION_IDS) {
      const { rows } = await client.query(
        'SELECT migration_id FROM schema_migrations WHERE migration_id = $1',
        [migrationId]
      );
      if (rows.length === 0) {
        const fs = require('node:fs/promises');
        const path = require('node:path');
        const sql = await fs.readFile(
          path.join(__dirname, '..', 'migrations', `${migrationId}.sql`),
          'utf8'
        );
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (migration_id) VALUES ($1)',
          [migrationId]
        );
        console.log(`Applied migration ${migrationId}.`);
      } else {
        console.log(`Migration ${migrationId} is already applied.`);
      }
    }
    await client.query('COMMIT');
    console.log('All migrations applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
  closeDatabase();
}

main().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});