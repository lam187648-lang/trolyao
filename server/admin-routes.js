const express = require("express");
const { pool, requireDatabase, withTransaction } = require("./database");
const { authenticate, requireAdmin } = require("./auth-middleware");

const router = express.Router();

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

module.exports = router;
