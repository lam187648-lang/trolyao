const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000
    })
  : null;

if (pool) {
  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error.message);
  });
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

module.exports = { pool, requireDatabase, withTransaction, closeDatabase };
