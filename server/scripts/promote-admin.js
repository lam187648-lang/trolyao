const bcrypt = require("bcryptjs");
const { pool, closeDatabase } = require("../database");

async function main() {
  if (!pool) throw new Error("DATABASE_URL is not configured.");

  const username = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (typeof username !== "string" || !/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) {
    throw new Error("Set ADMIN_BOOTSTRAP_USERNAME to an existing account username.");
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new Error("Set ADMIN_BOOTSTRAP_PASSWORD to a 12–128 character password.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `UPDATE users
     SET role = 'admin', password_hash = $2
     WHERE lower(username) = lower($1)
     RETURNING username`,
    [username, passwordHash]
  );
  if (!rows[0]) throw new Error("Account not found. Register it before promoting it.");
  console.log(`Promoted ${rows[0].username} to admin and reset its password.`);
}

main()
  .catch((error) => {
    console.error("Admin promotion failed:", error.message);
    process.exitCode = 1;
  })
  .finally(closeDatabase);
