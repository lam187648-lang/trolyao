const fs = require("node:fs/promises");
const path = require("node:path");
const { pool, closeDatabase } = require("../database");

async function main() {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured; no migration was run.");
  }

  const migrationId = "001_initial_schema";
  const sql = await fs.readFile(
    path.join(__dirname, "..", "migrations", `${migrationId}.sql`),
    "utf8"
  );
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(580121501)");
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         migration_id TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`
    );
    const { rows } = await client.query(
      "SELECT migration_id FROM schema_migrations WHERE migration_id = $1",
      [migrationId]
    );
    if (rows.length === 0) {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (migration_id) VALUES ($1)",
        [migrationId]
      );
      console.log(`Applied migration ${migrationId}.`);
    } else {
      console.log(`Migration ${migrationId} is already applied.`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error("Database migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
