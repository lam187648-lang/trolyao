const express = require("express");
const { pool, requireDatabase, withTransaction } = require("./database");
const { authenticate } = require("./auth-middleware");

const router = express.Router();
const BASIC_THEME_IDS = new Set(
  [...Array(13)].map((_, index) => String(index + 1)).concat("16")
);
const TOKEN_THEME_PRICES = new Map([
  ["14", 50],
  ["15", 50]
]);

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.use(requireDatabase, authenticate);

router.get("/balance", asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT token_balance FROM users WHERE id = $1",
    [req.user.id]
  );
  res.json({ tokenBalance: Number(rows[0].token_balance) });
}));

router.get("/transactions", asyncRoute(async (req, res) => {
  const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
  const pageSize = Math.max(1, Math.min(100, Number.parseInt(req.query.pageSize, 10) || 25));
  const { rows } = await pool.query(
    `SELECT id, transaction_type, amount, balance_after, note, created_at
     FROM token_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, pageSize, (page - 1) * pageSize]
  );
  res.json({ transactions: rows, page, pageSize });
}));

router.post("/study-reward", asyncRoute(async (req, res) => {
  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      "SELECT token_balance FROM users WHERE id = $1 AND status = 'active' FOR UPDATE",
      [req.user.id]
    );
    if (!userRows[0]) return { locked: true };

    const { rows: rewardRows } = await client.query(
      `SELECT GREATEST(0, 600 - EXTRACT(EPOCH FROM (NOW() - created_at))::int) AS retry_after
       FROM token_transactions
       WHERE user_id = $1 AND transaction_type = 'study_reward'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (rewardRows[0] && Number(rewardRows[0].retry_after) > 0) {
      return { retryAfter: Number(rewardRows[0].retry_after) };
    }

    const { rows: updatedRows } = await client.query(
      `UPDATE users SET token_balance = token_balance + 20
       WHERE id = $1
       RETURNING token_balance`,
      [req.user.id]
    );
    await client.query(
      `INSERT INTO token_transactions
       (user_id, transaction_type, amount, balance_after, note)
       VALUES ($1, 'study_reward', 20, $2, 'Thưởng học tập')`,
      [req.user.id, updatedRows[0].token_balance]
    );
    return { tokenBalance: Number(updatedRows[0].token_balance) };
  });

  if (result.locked) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (result.retryAfter) {
    return res.status(429).json({
      error: "Phần thưởng tiếp theo chưa sẵn sàng.",
      retryAfterSeconds: result.retryAfter
    });
  }
  res.json(result);
}));

router.get("/themes/entitlements", asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT theme_id FROM theme_entitlements WHERE user_id = $1 ORDER BY theme_id",
    [req.user.id]
  );
  res.json({ themeIds: rows.map((row) => row.theme_id) });
}));

router.post("/themes/:themeId/purchase", asyncRoute(async (req, res) => {
  const { themeId } = req.params;
  const price = TOKEN_THEME_PRICES.get(themeId);
  if (!price) {
    return res.status(403).json({
      error: "Màu này chỉ có thể được Admin cấp.",
      code: "ADMIN_THEME_REQUIRED"
    });
  }

  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      "SELECT token_balance FROM users WHERE id = $1 AND status = 'active' FOR UPDATE",
      [req.user.id]
    );
    if (!userRows[0]) return { locked: true };

    const { rows: ownedRows } = await client.query(
      "SELECT 1 FROM theme_entitlements WHERE user_id = $1 AND theme_id = $2",
      [req.user.id, themeId]
    );
    if (ownedRows.length) {
      return { alreadyOwned: true, tokenBalance: Number(userRows[0].token_balance) };
    }
    if (Number(userRows[0].token_balance) < price) return { insufficient: true };

    const { rows: updatedRows } = await client.query(
      `UPDATE users SET token_balance = token_balance - $2
       WHERE id = $1 RETURNING token_balance`,
      [req.user.id, price]
    );
    await client.query(
      `INSERT INTO theme_entitlements (user_id, theme_id)
       VALUES ($1, $2)`,
      [req.user.id, themeId]
    );
    await client.query(
      `INSERT INTO token_transactions
       (user_id, transaction_type, amount, balance_after, note)
       VALUES ($1, 'theme_purchase', $2, $3, $4)`,
      [req.user.id, -price, updatedRows[0].token_balance, `Mở khóa màu ${themeId}`]
    );
    return { tokenBalance: Number(updatedRows[0].token_balance) };
  });

  if (result.locked) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (result.insufficient) return res.status(409).json({ error: "Bạn không đủ Token để mở khóa màu này." });
  res.json({ ...result, themeId });
}));

router.put("/themes/selected", asyncRoute(async (req, res) => {
  const themeId = typeof req.body?.themeId === "string" ? req.body.themeId : "";
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(themeId)) {
    return res.status(400).json({ error: "Mã màu không hợp lệ." });
  }

  const updated = await withTransaction(async (client) => {
    const { rows } = await client.query(
      "SELECT status FROM users WHERE id = $1 FOR UPDATE",
      [req.user.id]
    );
    if (!rows[0] || rows[0].status !== "active") return "locked";
    if (!BASIC_THEME_IDS.has(themeId)) {
      const { rows: entitlementRows } = await client.query(
        "SELECT 1 FROM theme_entitlements WHERE user_id = $1 AND theme_id = $2",
        [req.user.id, themeId]
      );
      if (!entitlementRows.length) return "not_entitled";
    }
    await client.query(
      "UPDATE users SET selected_theme_id = $2 WHERE id = $1",
      [req.user.id, themeId]
    );
    return "updated";
  });
  if (updated === "locked") return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (updated === "not_entitled") {
    return res.status(403).json({ error: "Bạn chưa được cấp quyền sử dụng màu này." });
  }
  res.json({ selectedThemeId: themeId });
}));

module.exports = router;
