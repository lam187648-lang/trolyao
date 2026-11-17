const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL?.trim();
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    })
  : null;

function getSafeErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : "UNKNOWN";
}

if (pool) {
  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", getSafeErrorCode(error));
  });
}

async function checkDatabaseConnection() {
  console.log("🔎 Checking PostgreSQL connection...");
  if (!pool) {
    console.error("⚠️ DATABASE_URL is not configured or is empty; PostgreSQL connection check skipped.");
    return false;
  }

  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected successfully");
    return true;
  } catch (error) {
    console.error(
      `❌ PostgreSQL connection failed (${getSafeErrorCode(error)}). Check DATABASE_URL, network access, and PostgreSQL availability. Backend will continue running.`
    );
    return false;
  }
}

async function checkInitialSchemaMigration() {
  if (!pool) return false;

  const { rows: trackingRows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_name = 'schema_migrations'
     ) AS tracking_table_exists`
  );
  if (!trackingRows[0]?.tracking_table_exists) return false;

  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM schema_migrations
       WHERE migration_id = $1
     ) AS applied`,
    ["001_initial_schema"]
  );
  return rows[0].applied;
}

const appliedMigrations = new Set();

async function isMigrationApplied(migrationId) {
  if (!pool) return false;
  if (appliedMigrations.has(migrationId)) return true;
  try {
    const { rows } = await pool.query(
      `SELECT to_regclass('schema_migrations') IS NOT NULL AS tracking_table_exists`
    );
    if (rows[0]?.tracking_table_exists) {
      const { rows: appliedRows } = await pool.query(
        "SELECT 1 FROM schema_migrations WHERE migration_id = $1",
        [migrationId]
      );
      if (appliedRows.length > 0) {
        appliedMigrations.add(migrationId);
        return true;
      }
    }
    // Fallback: check if the target tables exist directly
    if (migrationId === "002_garden_rewards_legacy_import") {
      const { rows: tableRows } = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = current_schema() AND table_name = 'garden_sessions'
         ) AS exists`
      );
      if (tableRows[0]?.exists) {
        // Record into schema_migrations if table exists
        try {
          await pool.query(
            `CREATE TABLE IF NOT EXISTS schema_migrations (
               migration_id TEXT PRIMARY KEY,
               applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
             );
             INSERT INTO schema_migrations (migration_id) VALUES ($1) ON CONFLICT DO NOTHING;`,
            [migrationId]
          );
        } catch (_) {}
        appliedMigrations.add(migrationId);
        return true;
      }
    } else if (migrationId === "001_initial_schema") {
      const { rows: tableRows } = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = current_schema() AND table_name = 'users'
         ) AS exists`
      );
      if (tableRows[0]?.exists) {
        appliedMigrations.add(migrationId);
        return true;
      }
    }
  } catch (err) {
    console.error("isMigrationApplied check error:", err.message);
  }
  return false;
}

function requireMigration(migrationId) {
  return (_req, res, next) => {
    isMigrationApplied(migrationId)
      .then((applied) => {
        if (applied) return next();
        res.status(503).json({
          error: "Cơ sở dữ liệu chưa được cập nhật cho chức năng này. Quản trị viên cần chạy npm run db:migrate.",
          code: "MIGRATION_REQUIRED"
        });
      })
      .catch(next);
  };
}

function requireDatabase(_req, res, next) {
  if (!pool) {
    return res.status(503).json({
      error: "PostgreSQL chưa được cấu hình. Hãy thêm DATABASE_URL trên Render.",
      code: "DATABASE_NOT_CONFIGURED"
    });
  }
  next();
}

async function withTransaction(work) {
  if (!pool) {
    const error = new Error("DATABASE_NOT_CONFIGURED");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("PostgreSQL rollback failed:", getSafeErrorCode(rollbackError));
    }
    throw error;
  } finally {
    client.release();
  }
}

async function closeDatabase() {
  if (pool) await pool.end();
}

module.exports = {
  pool,
  requireDatabase,
  withTransaction,
  closeDatabase,
  checkDatabaseConnection,
  checkInitialSchemaMigration,
  isMigrationApplied,
  requireMigration
};
