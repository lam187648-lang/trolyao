const express = require("express");
const { pool, requireDatabase, requireMigration, withTransaction } = require("./database");
const { authenticate } = require("./auth-middleware");

const router = express.Router();
const GARDEN_MIGRATION = "002_garden_rewards_legacy_import";
const GARDEN_SEEDS = new Set(["oak", "sunflower", "pine"]);
const GARDEN_DURATIONS = new Set([10, 20, 30, 45, 60, 90, 120, 150, 180]);
const TOKENS_PER_MINUTE = 5;
const REWARD_COOLDOWN_SECONDS = 60;
const START_COOLDOWN_SECONDS = 3;

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toSessionPayload(row) {
  return {
    id: row.id,
    seed: row.seed,
    durationMinutes: row.duration_minutes,
    rewardAmount: row.reward_amount,
    status: row.status,
    startedAt: row.started_at,
    completesAt: row.completes_at
  };
}

router.use(["/garden", "/garden-reward"], requireDatabase, requireMigration(GARDEN_MIGRATION), authenticate);

router.post("/garden/sessions", asyncRoute(async (req, res) => {
  const seed = req.body?.seed;
  const durationMinutes = Number(req.body?.durationMinutes);
  if (!GARDEN_SEEDS.has(seed) || !GARDEN_DURATIONS.has(durationMinutes)) {
    return res.status(400).json({ error: "Hạt giống hoặc thời gian không hợp lệ.", code: "INVALID_GARDEN_OPTIONS" });
  }

  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE id = $1 AND status = 'active' FOR UPDATE",
      [req.user.id]
    );
    if (!userRows[0]) return { locked: true };

    const { rows: recentRows } = await client.query(
      `SELECT GREATEST(0, $2 - EXTRACT(EPOCH FROM (NOW() - started_at))::int) AS retry_after
       FROM garden_sessions WHERE user_id = $1
       ORDER BY started_at DESC LIMIT 1`,
      [req.user.id, START_COOLDOWN_SECONDS]
    );
    if (recentRows[0] && Number(recentRows[0].retry_after) > 0) {
      return { retryAfter: Number(recentRows[0].retry_after) };
    }

    await client.query(
      `UPDATE garden_sessions SET status = 'abandoned', ended_at = NOW()
       WHERE user_id = $1 AND status = 'running'`,
      [req.user.id]
    );
    const { rows } = await client.query(
      `INSERT INTO garden_sessions (user_id, seed, duration_minutes, reward_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *, started_at + make_interval(mins => duration_minutes) AS completes_at`,
      [req.user.id, seed, durationMinutes, durationMinutes * TOKENS_PER_MINUTE]
    );
    return { session: rows[0] };
  });

  if (result.locked) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (result.retryAfter) {
    return res.status(429).json({ error: "Bạn vừa bắt đầu một lượt trồng cây. Vui lòng thử lại sau.", retryAfterSeconds: result.retryAfter });
  }
  res.status(201).json({ session: toSessionPayload(result.session) });
}));

router.get("/garden/history", asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT gs.id, gs.seed, gs.duration_minutes, gs.status, gs.started_at, gs.ended_at,
            tt.amount AS reward_amount
     FROM garden_sessions gs
     LEFT JOIN token_transactions tt ON tt.id = gs.reward_transaction_id
     WHERE gs.user_id = $1
     ORDER BY gs.started_at DESC
     LIMIT 20`,
    [req.user.id]
  );
  res.json({
    history: rows.map((row) => ({
      id: row.id,
      seed: row.seed,
      durationMinutes: row.duration_minutes,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      rewardAmount: row.reward_amount === null ? 0 : Number(row.reward_amount)
    }))
  });
}));

router.post("/garden/sessions/:sessionId/abandon", asyncRoute(async (req, res) => {
  const { sessionId } = req.params;
  if (!isUuid(sessionId)) return res.status(400).json({ error: "Mã lượt trồng không hợp lệ." });
  const result = await withTransaction((client) => client.query(
    `UPDATE garden_sessions SET status = 'abandoned', ended_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'running'`,
    [sessionId, req.user.id]
  ));
  if (!result.rowCount) return res.status(404).json({ error: "Không tìm thấy lượt trồng đang chạy." });
  res.status(204).end();
}));

// Only the session id is read from the request; completion and reward amount come from the database.
router.post("/garden-reward", asyncRoute(async (req, res) => {
  const sessionId = req.body?.sessionId;
  if (!isUuid(sessionId)) {
    return res.status(400).json({ error: "Mã lượt trồng không hợp lệ.", code: "INVALID_GARDEN_SESSION" });
  }

  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE id = $1 AND status = 'active' FOR UPDATE",
      [req.user.id]
    );
    if (!userRows[0]) return { locked: true };

    const { rows: sessionRows } = await client.query(
      `SELECT *, GREATEST(0, CEIL(EXTRACT(EPOCH FROM
                (started_at + make_interval(mins => duration_minutes) - NOW()))))::int AS remaining_seconds
       FROM garden_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [sessionId, req.user.id]
    );
    const session = sessionRows[0];
    if (!session) return { notFound: true };
    if (session.status === "rewarded") return { conflict: "GARDEN_ALREADY_REWARDED", message: "Lượt trồng này đã được nhận thưởng." };
    if (session.status !== "running") return { conflict: "GARDEN_SESSION_ABANDONED", message: "Lượt trồng này đã bị dừng." };
    if (Number(session.remaining_seconds) > 0) {
      return { conflict: "GARDEN_NOT_COMPLETE", message: "Cây chưa trưởng thành.", remainingSeconds: Number(session.remaining_seconds) };
    }

    const { rows: rewardRows } = await client.query(
      `SELECT GREATEST(0, $2 - EXTRACT(EPOCH FROM (NOW() - created_at))::int) AS retry_after
       FROM token_transactions
       WHERE user_id = $1 AND transaction_type = 'garden_reward'
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, REWARD_COOLDOWN_SECONDS]
    );
    if (rewardRows[0] && Number(rewardRows[0].retry_after) > 0) {
      return { retryAfter: Number(rewardRows[0].retry_after) };
    }

    const { rows: updatedRows } = await client.query(
      "UPDATE users SET token_balance = token_balance + $2 WHERE id = $1 RETURNING token_balance",
      [req.user.id, session.reward_amount]
    );
    const { rows: transactionRows } = await client.query(
      `INSERT INTO token_transactions (user_id, transaction_type, amount, balance_after, note)
       VALUES ($1, 'garden_reward', $2, $3, $4)
       RETURNING id`,
      [req.user.id, session.reward_amount, updatedRows[0].token_balance, `Thưởng khu vườn ${session.duration_minutes} phút`]
    );
    await client.query(
      `UPDATE garden_sessions
       SET status = 'rewarded', ended_at = NOW(), reward_transaction_id = $2
       WHERE id = $1`,
      [session.id, transactionRows[0].id]
    );
    await client.query(
      `INSERT INTO admin_audit_logs (actor_user_id, target_user_id, action, details)
       VALUES ($1, $1, 'garden.reward', $2::jsonb)`,
      [req.user.id, JSON.stringify({
        sessionId: session.id,
        seed: session.seed,
        durationMinutes: session.duration_minutes,
        amount: session.reward_amount
      })]
    );
    return { tokenBalance: Number(updatedRows[0].token_balance), rewardAmount: session.reward_amount };
  });

  if (result.locked) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (result.notFound) return res.status(404).json({ error: "Không tìm thấy lượt trồng.", code: "GARDEN_SESSION_NOT_FOUND" });
  if (result.conflict) {
    return res.status(409).json({ error: result.message, code: result.conflict, remainingSeconds: result.remainingSeconds });
  }
  if (result.retryAfter) {
    return res.status(429).json({ error: "Phần thưởng khu vườn tiếp theo chưa sẵn sàng.", retryAfterSeconds: result.retryAfter });
  }
  res.json(result);
}));

module.exports = router;
