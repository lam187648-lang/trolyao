const { pool, closeDatabase } = require("../database");

async function main() {
  if (!pool) throw new Error("DATABASE_URL is not configured.");

  const { rows } = await pool.query(
    "SELECT id, username FROM users WHERE username = $1",
    ["lam"]
  );
  if (rows.length === 0) {
    throw new Error("No user row has the exact username 'lam'.");
  }
  if (rows.length > 1) {
    throw new Error("Multiple user rows have the exact username 'lam'; no account was selected.");
  }

  console.log(JSON.stringify({
    id: rows[0].id,
    username: rows[0].username
  }, null, 2));
}

function safePostgresErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : null;
}

main()
  .catch((error) => {
    const code = safePostgresErrorCode(error);
    if (code) {
      console.error(`Account lookup failed (PostgreSQL ${code}).`);
    } else {
      console.error("Account lookup failed:", error.message);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeDatabase();
    } catch (error) {
      const code = safePostgresErrorCode(error);
      console.error(`Database connection cleanup failed (${code || "UNKNOWN"}).`);
      process.exitCode = 1;
    }
  });
