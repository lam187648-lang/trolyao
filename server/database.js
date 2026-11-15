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
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function closeDatabase() {
  if (pool) await pool.end();
}

module.exports = { pool, requireDatabase, withTransaction, closeDatabase, checkDatabaseConnection };
