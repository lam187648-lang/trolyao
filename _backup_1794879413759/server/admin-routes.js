const crypto = require("node:crypto");
const express = require("express");
const { pool, requireDatabase, requireMigration, withTransaction } = require("./database");
const { authenticate, requireAdmin } = require("./auth-middleware");

const router = express.Router();
const LEGACY_IMPORT_MIGRATION = "002_garden_rewards_legacy_import";
const DIAGNOSTIC_TABLES = ["users", "sessions", "schema_migrations"];
const diagnosticSecret = process.env.DB_DIAGNOSTIC_SECRET?.trim() || "";

function safePostgresErrorCode(error) {
  const code = error && error.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : "UNKNOWN";
}

function authorizeDatabaseDiagnostic(req, res, next) {
  const suppliedSecret = req.get("x-db-diagnostic-secret") || "";
  if (diagnosticSecret.length < 32 || suppliedSecret.length > 512) {
    return res.status(401).json({ authorized: false });
  }

  const expectedHash = crypto.createHash("sha256").update(diagnosticSecret).digest();
  const suppliedHash = crypto.createHash("sha256").update(suppliedSecret).digest();
  if (!crypto.timingSafeEqual(expectedHash, suppliedHash)) {
    return res.status(401).json({ authorized: false });
  }
  next();
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function audit(client, actorId, targetId, action, details = {}) {
  return client.query(
    `INSERT INTO admin_audit_logs (actor_user_id, target_user_id, action, details)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [actorId, targetId, action, JSON.stringify(details)]
  );
}

router.get("/db-diagnostic", authorizeDatabaseDiagnostic, asyncRoute(async (_req, res) => {
  if (!pool) {
    return res.status(503).json({
      databaseReachable: false,
      postgresErrorCode: null
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = current_schema()
         AND table_type = 'BASE TABLE'
         AND table_name = ANY($1::text[])`,
      [DIAGNOSTIC_TABLES]
    );
    const existingTables = new Set(rows.map((row) => row.table_name));
    const tables = Object.fromEntries(
      DIAGNOSTIC_TABLES.map((tableName) => [tableName, existingTables.has(tableName)])
    );
    const missingTables = DIAGNOSTIC_TABLES.filter((tableName) => !tables[tableName]);
    let migrationApplied = false;

    if (tables.schema_migrations) {
      const { rows: migrationRows } = await pool.query(
        `SELECT EXISTS (
           SELECT 1 FROM schema_migrations
           WHERE migration_id = $1
         ) AS applied`,
        ["001_initial_schema"]
      );
      migrationApplied = migrationRows[0].applied;
    }

    return res.json({
      databaseReachable: true,
      tables,
      missingTables,
      migrationApplied,
      postgresErrorCode: null
    });
  } catch (error) {
    const errorCode = safePostgresErrorCode(error);
    console.error("PostgreSQL diagnostic query failed:", errorCode);
    return res.status(503).json({
      databaseReachable: false,
      postgresErrorCode: errorCode
    });
  }
}));

router.use(requireDatabase, authenticate, requireAdmin);

router.get("/users", asyncRoute(async (req, res) => {
  const search = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const status = ["active", "locked"].includes(req.query.status) ? req.query.status : null;
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(req.query.pageSize, 10) || 25));
  const searchPattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users
     WHERE ($1 = '' OR username ILIKE $2 ESCAPE '\\' OR email ILIKE $2 ESCAPE '\\')
       AND ($3::text IS NULL OR status = $3)`,
    [search, searchPattern, status]
  );
  const { rows } = await pool.query(
    `SELECT id, username, email, role, token_balance, status, created_at, last_login_at
     FROM users
     WHERE ($1 = '' OR username ILIKE $2 ESCAPE '\\' OR email ILIKE $2 ESCAPE '\\')
       AND ($3::text IS NULL OR status = $3)
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [search, searchPattern, status, pageSize, (page - 1) * pageSize]
  );
  res.json({ users: rows, page, pageSize, total: countRows[0].total });
}));

router.post("/users/:userId/tokens", asyncRoute(async (req, res) => {
  const { userId } = req.params;
  const amount = Number(req.body?.amount);
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 200) : "";
  if (!isUuid(userId)) return res.status(400).json({ error: "ID người dùng không hợp lệ." });
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) {
    return res.status(400).json({ error: "Số Token phải là số nguyên từ 1 đến 1.000.000." });
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT id, token_balance FROM users WHERE id = $1 FOR UPDATE",
      [userId]
    );
    if (!rows[0]) return null;
    const { rows: updated } = await client.query(
      `UPDATE users SET token_balance = token_balance + $2
       WHERE id = $1
       RETURNING id, username, token_balance`,
      [userId, amount]
    );
    await client.query(
      `INSERT INTO token_transactions
       (user_id, actor_user_id, transaction_type, amount, balance_after, note)
       VALUES ($1, $2, 'admin_gift', $3, $4, $5)`,
      [userId, req.user.id, amount, updated[0].token_balance, note || null]
    );
    await audit(client, req.user.id, userId, "tokens.gift", { amount, note });
    return updated[0];
  });

  if (!result) return res.status(404).json({ error: "Không tìm thấy tài khoản." });
  res.json({ user: result });
}));

router.patch("/users/:userId/status", asyncRoute(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body || {};
  if (!isUuid(userId)) return res.status(400).json({ error: "ID người dùng không hợp lệ." });
  if (!["active", "locked"].includes(status)) {
    return res.status(400).json({ error: "Trạng thái chỉ có thể là active hoặc locked." });
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE users SET status = $2 WHERE id = $1
       RETURNING id, username, status`,
      [userId, status]
    );
    if (!rows[0]) return null;
    if (status === "locked") await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await audit(client, req.user.id, userId, `account.${status}`, {});
    return rows[0];
  });

  if (!result) return res.status(404).json({ error: "Không tìm thấy tài khoản." });
  res.json({ user: result });
}));

router.post("/users/:userId/sessions/revoke", asyncRoute(async (req, res) => {
  const { userId } = req.params;
  if (!isUuid(userId)) return res.status(400).json({ error: "ID người dùng không hợp lệ." });

  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (!userRows[0]) return null;
    const { rowCount } = await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await audit(client, req.user.id, userId, "sessions.revoke", { revoked: rowCount });
    return rowCount;
  });

  if (result === null) return res.status(404).json({ error: "Không tìm thấy tài khoản." });
  res.json({ revokedSessions: result });
}));

router.post("/users/:userId/themes/:themeId", asyncRoute(async (req, res) => {
  const { userId, themeId } = req.params;
  if (!isUuid(userId) || !/^[A-Za-z0-9_-]{1,40}$/.test(themeId)) {
    return res.status(400).json({ error: "Tài khoản hoặc mã màu không hợp lệ." });
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (!rows[0]) return false;
    await client.query(
      `INSERT INTO theme_entitlements (user_id, theme_id, granted_by_user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, theme_id) DO NOTHING`,
      [userId, themeId, req.user.id]
    );
    await audit(client, req.user.id, userId, "theme.grant", { themeId });
    return true;
  });
  if (!result) return res.status(404).json({ error: "Không tìm thấy tài khoản." });
  res.status(204).end();
}));

router.delete("/users/:userId/themes/:themeId", asyncRoute(async (req, res) => {
  const { userId, themeId } = req.params;
  if (!isUuid(userId) || !/^[A-Za-z0-9_-]{1,40}$/.test(themeId)) {
    return res.status(400).json({ error: "Tài khoản hoặc mã màu không hợp lệ." });
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (!rows[0]) return false;
    await client.query(
      "DELETE FROM theme_entitlements WHERE user_id = $1 AND theme_id = $2",
      [userId, themeId]
    );
    await client.query(
      `UPDATE users SET selected_theme_id = '1'
       WHERE id = $1 AND selected_theme_id = $2`,
      [userId, themeId]
    );
    await audit(client, req.user.id, userId, "theme.revoke", { themeId });
    return true;
  });
  if (!result) return res.status(404).json({ error: "Không tìm thấy tài khoản." });
  res.status(204).end();
}));

router.get("/audit", asyncRoute(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(req.query.pageSize, 10) || 25));
  const { rows } = await pool.query(
    `SELECT l.id, l.action, l.details, l.created_at,
            actor.username AS actor_username, target.username AS target_username
     FROM admin_audit_logs l
     JOIN users actor ON actor.id = l.actor_user_id
     LEFT JOIN users target ON target.id = l.target_user_id
     ORDER BY l.created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, (page - 1) * pageSize]
  );
  res.json({ logs: rows, page, pageSize });
}));

router.get("/legacy-imports", requireMigration(LEGACY_IMPORT_MIGRATION), asyncRoute(async (req, res) => {
  const status = ["pending_review", "completed", "approved", "rejected"].includes(req.query.status)
    ? req.query.status
    : "pending_review";
  const { rows } = await pool.query(
    `SELECT li.*, u.username,
            (SELECT COUNT(*)::int FROM legacy_imports other
             WHERE LOWER(other.local_username) = LOWER(li.local_username)) AS same_local_username_count
     FROM legacy_imports li
     JOIN users u ON u.id = li.user_id
     WHERE li.status = $1
     ORDER BY li.created_at ASC
     LIMIT 100`,
    [status]
  );
  res.json({ imports: rows });
}));

router.post("/legacy-imports/:importId/approve", requireMigration(LEGACY_IMPORT_MIGRATION), asyncRoute(async (req, res) => {
  const { importId } = req.params;
  if (!isUuid(importId)) return res.status(400).json({ error: "Mã yêu cầu không hợp lệ." });
  const tokens = Number(req.body?.tokens ?? 0);
  const themeIds = Array.isArray(req.body?.themeIds) ? [...new Set(req.body.themeIds.map(String))] : [];
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 200) : "";
  if (!Number.isSafeInteger(tokens) || tokens < 0) {
    return res.status(400).json({ error: "Số Token duyệt không hợp lệ." });
  }

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query("SELECT * FROM legacy_imports WHERE id = $1 FOR UPDATE", [importId]);
    const record = rows[0];
    if (!record) return { notFound: true };
    if (record.status !== "pending_review") return { conflict: true };
    if (tokens > Number(record.claimed_tokens)) return { invalid: "Không được duyệt nhiều Token hơn số đã khai báo." };
    if (themeIds.some((themeId) => !record.claimed_theme_ids.includes(themeId))) {
      return { invalid: "Chỉ được duyệt những màu có trong yêu cầu." };
    }

    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE",
      [record.user_id]
    );
    if (!userRows[0]) return { notFound: true };
    if (tokens > 0) {
      const { rows: updated } = await client.query(
        "UPDATE users SET token_balance = token_balance + $2 WHERE id = $1 RETURNING token_balance",
        [record.user_id, tokens]
      );
      await client.query(
        `INSERT INTO token_transactions
         (user_id, actor_user_id, transaction_type, amount, balance_after, note)
         VALUES ($1, $2, 'legacy_import', $3, $4, $5)`,
        [record.user_id, req.user.id, tokens, updated[0].token_balance,
          `Chuyển dữ liệu từ tài khoản cũ "${record.local_username}"`]
      );
    }
    for (const themeId of themeIds) {
      await client.query(
        `INSERT INTO theme_entitlements (user_id, theme_id, granted_by_user_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, theme_id) DO NOTHING`,
        [record.user_id, themeId, req.user.id]
      );
    }
    const { rows: reviewed } = await client.query(
      `UPDATE legacy_imports
       SET status = 'approved', approved_tokens = $2, approved_theme_ids = $3,
           reviewed_by_user_id = $4, review_note = $5, reviewed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [importId, tokens, themeIds, req.user.id, note || null]
    );
    await audit(client, req.user.id, record.user_id, "legacy_import.approve", {
      importId, tokens, themeIds, note
    });
    return { record: reviewed[0] };
  });

  if (result.notFound) return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  if (result.conflict) return res.status(409).json({ error: "Yêu cầu này đã được xử lý." });
  if (result.invalid) return res.status(400).json({ error: result.invalid });
  res.json({ import: result.record });
}));

router.post("/legacy-imports/:importId/reject", requireMigration(LEGACY_IMPORT_MIGRATION), asyncRoute(async (req, res) => {
  const { importId } = req.params;
  if (!isUuid(importId)) return res.status(400).json({ error: "Mã yêu cầu không hợp lệ." });
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 200) : "";

  const result = await withTransaction(async (client) => {
    const { rows } = await client.query("SELECT * FROM legacy_imports WHERE id = $1 FOR UPDATE", [importId]);
    if (!rows[0]) return { notFound: true };
    if (rows[0].status !== "pending_review") return { conflict: true };
    const { rows: reviewed } = await client.query(
      `UPDATE legacy_imports
       SET status = 'rejected', reviewed_by_user_id = $2, review_note = $3, reviewed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [importId, req.user.id, note || null]
    );
    await audit(client, req.user.id, rows[0].user_id, "legacy_import.reject", { importId, note });
    return { record: reviewed[0] };
  });

  if (result.notFound) return res.status(404).json({ error: "Không tìm thấy yêu cầu." });
  if (result.conflict) return res.status(409).json({ error: "Yêu cầu này đã được xử lý." });
  res.json({ import: result.record });
}));

module.exports = router;
