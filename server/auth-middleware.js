const crypto = require("node:crypto");
const { pool } = require("./database");

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = /^Bearer ([A-Za-z0-9_-]{40,100})$/.exec(authorization);
  if (!match) {
    return res.status(401).json({ error: "Vui lòng đăng nhập.", code: "AUTH_REQUIRED" });
  }

  const tokenHash = hashSessionToken(match[1]);
  pool.query(
    `SELECT u.id, u.username, u.email, u.role, u.token_balance,
            u.selected_theme_id, u.status, u.ban_reason, u.ban_started_at, u.ban_expires_at,
            s.id AS session_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [tokenHash]
  ).then(async ({ rows }) => {
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", code: "SESSION_INVALID" });
    }

    // Kiểm tra nếu ban đã hết hạn → tự động mở khóa
    if (user.status === "locked" && user.ban_expires_at && new Date(user.ban_expires_at) <= new Date()) {
      try {
        await pool.query(
          `UPDATE users SET status = 'active', ban_reason = NULL, ban_started_at = NULL, ban_expires_at = NULL
           WHERE id = $1`,
          [user.id]
        );
        // Cho phép tiếp tục với status active
        user.status = "active";
      } catch (err) {
        console.error("Auto-unban error:", err.message);
      }
    }

    if (user.status !== "active") {
      // Trả về thông tin ban để client hiển thị
      return res.status(403).json({
        error: "Tài khoản hiện đang bị khóa.",
        code: "ACCOUNT_LOCKED",
        reason: user.ban_reason || null,
        startedAt: user.ban_started_at || null,
        expiresAt: user.ban_expires_at || null
      });
    }

    await pool.query("UPDATE sessions SET last_used_at = NOW() WHERE id = $1", [user.session_id]);
    req.user = user;
    req.sessionId = user.session_id;
    next();
  }).catch(next);
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này.", code: "ADMIN_REQUIRED" });
  }
  next();
}

module.exports = { authenticate, requireAdmin, hashSessionToken };
