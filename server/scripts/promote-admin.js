const { pool, withTransaction, closeDatabase } = require("../database");

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function main() {
  const userId = process.env.ADMIN_PROMOTION_USER_ID?.trim();

  if (!USER_ID_PATTERN.test(userId || "")) {
    throw new Error("Set ADMIN_PROMOTION_USER_ID to the verified account UUID.");
  }
  if (!pool) throw new Error("DATABASE_URL is not configured.");

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `SELECT id, username, role
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );
    const user = rows[0];
    if (!user) throw new Error("No account matches ADMIN_PROMOTION_USER_ID.");
    if (user.username !== "lam") {
      throw new Error("The verified identifier does not belong to the existing lam account.");
    }
    if (user.role === "admin") return { user, changed: false };

    const { rows: updatedRows } = await client.query(
      `UPDATE users
       SET role = 'admin'
       WHERE id = $1
       RETURNING id, username, role`,
      [user.id]
    );
    return { user: updatedRows[0], changed: true };
  });

  const action = result.changed ? "Promoted" : "Already admin";
  console.log(
    `${action}: ${result.user.username} (${result.user.id}). ` +
    "No password or other account data was changed."
  );
}

function safePostgresErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : null;
}

main()
  .catch((error) => {
    const code = safePostgresErrorCode(error);
    if (code) {
      console.error(`Admin promotion failed (PostgreSQL ${code}).`);
    } else {
      console.error("Admin promotion failed:", error.message);
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
