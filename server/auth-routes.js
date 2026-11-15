const crypto = require("node:crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const { pool, requireDatabase, withTransaction, checkInitialSchemaMigration } = require("./database");
const { authenticate, hashSessionToken } = require("./auth-middleware");

const router = express.Router();
const SESSION_DAYS = 30;
const authRateBuckets = new Map();

function authRateLimit(req, res, next) {
  const key = `${req.ip || req.socket.remoteAddress || "unknown"}:${req.path}`;
  const now = Date.now();
  const bucket = authRateBuckets.get(key) || { count: 0, resetAt: now + 15 * 60_000 };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 15 * 60_000;
  }
  bucket.count += 1;
  authRateBuckets.set(key, bucket);
  if (authRateBuckets.size > 5000) {
    for (const [bucketKey, value] of authRateBuckets) {
      if (now >= value.resetAt) authRateBuckets.delete(bucketKey);
    }
  }
  if (bucket.count > 10) {
    return res.status(429).json({ error: "Quá nhiều lần thử. Vui lòng đợi 15 phút rồi thử lại." });
  }
  next();
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function validUsername(value) {
  return typeof value === "string" && /^[\p{L}\p{N}_-]{2,24}$/u.test(value);
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tokenBalance: Number(user.token_balance),
    selectedThemeId: user.selected_theme_id,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  };
}

async function createSession(client, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  await client.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 day'))`,
    [userId, tokenHash, SESSION_DAYS]
  );
  return token;
}

router.get("/status", asyncRoute(async (_req, res) => {
  const databaseConfigured = Boolean(pool);
  const migrationApplied = databaseConfigured
    ? await checkInitialSchemaMigration()
    : false;
  res.json({ databaseConfigured, migrationApplied });
}));

router.use(requireDatabase);

router.post("/register", authRateLimit, asyncRoute(async (req, res) => {
  const { username, password, email = null } = req.body || {};
  if (!validUsername(username)) {
    return res.status(400).json({ error: "Tên đăng nhập cần dài 2–24 ký tự và chỉ gồm chữ, số, _ hoặc -." });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Mật khẩu cần có từ 8 đến 128 ký tự." });
  }
  if (email !== null && (typeof email !== "string" || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return res.status(400).json({ error: "Email không hợp lệ." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, role, token_balance, selected_theme_id, created_at, last_login_at`,
        [username, email, passwordHash]
      );
      const user = rows[0];
      const accessToken = await createSession(client, user.id);
      return { user, accessToken };
    });
    res.status(201).json({ user: publicUser(result.user), accessToken: result.accessToken });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Tên đăng nhập hoặc email đã được sử dụng." });
    }
    throw error;
  }
}));

router.post("/login", authRateLimit, asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  const identifier = typeof username === "string" ? username.trim() : "";
  const validIdentifier = validUsername(identifier) ||
    (identifier.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier));
  if (!validIdentifier ||
      typeof password !== "string" || password.length === 0 || password.length > 128) {
    return res.status(400).json({ error: "Tên đăng nhập hoặc mật khẩu không hợp lệ." });
  }

  const { rows } = await pool.query(
    `SELECT id, username, email, password_hash, role, token_balance,
            selected_theme_id, created_at, last_login_at, status
     FROM users WHERE lower(username) = lower($1) OR lower(email) = lower($1)
     LIMIT 1`,
    [identifier]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." });
  }
  if (user.status !== "active") {
    return res.status(403).json({ error: "Tài khoản hiện đang bị khóa.", code: "ACCOUNT_LOCKED" });
  }

  const result = await withTransaction(async (client) => {
    const { rows: lockedRows } = await client.query(
      "SELECT status FROM users WHERE id = $1 FOR UPDATE",
      [user.id]
    );
    if (!lockedRows[0] || lockedRows[0].status !== "active") return null;

    const { rows: updatedRows } = await client.query(
      `UPDATE users SET last_login_at = NOW()
       WHERE id = $1
       RETURNING id, username, email, role, token_balance, selected_theme_id, created_at, last_login_at`,
      [user.id]
    );
    const accessToken = await createSession(client, user.id);
    return { user: updatedRows[0], accessToken };
  });
  if (!result) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa.", code: "ACCOUNT_LOCKED" });
  res.json({ user: publicUser(result.user), accessToken: result.accessToken });
}));

router.get("/me", authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      tokenBalance: Number(req.user.token_balance),
      selectedThemeId: req.user.selected_theme_id
    }
  });
});

router.post("/logout", authenticate, asyncRoute(async (req, res) => {
  await pool.query("DELETE FROM sessions WHERE id = $1", [req.sessionId]);
  res.status(204).end();
}));

module.exports = router;
