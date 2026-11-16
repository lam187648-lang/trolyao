const express = require("express");
const { pool, requireDatabase, requireMigration, withTransaction } = require("./database");
const { authenticate } = require("./auth-middleware");
const { BASIC_THEME_IDS } = require("./theme-catalog");

const router = express.Router();
const LEGACY_IMPORT_MIGRATION = "002_garden_rewards_legacy_import";
const MAX_CLAIMED_TOKENS = 1000000;
const MAX_CLAIMED_THEMES = 100;

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function toImportPayload(row) {
  return {
    id: row.id,
    localUsername: row.local_username,
    claimedTokens: Number(row.claimed_tokens),
    claimedThemeIds: row.claimed_theme_ids,
    appliedThemeId: row.applied_theme_id,
    status: row.status,
    approvedTokens: Number(row.approved_tokens),
    approvedThemeIds: row.approved_theme_ids,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  };
}

function parseThemeId(value) {
  const themeId = String(value ?? "").trim();
  return /^[1-9][0-9]{0,2}$/.test(themeId) ? themeId : null;
}

function validateImportBody(body) {
  const localUsername = typeof body?.localUsername === "string" ? body.localUsername.trim() : "";
  if (localUsername.length < 1 || localUsername.length > 50) return { error: "Tên tài khoản cũ không hợp lệ." };

  const claimedTokens = body?.claimedTokens === undefined ? 0 : Number(body.claimedTokens);
  if (!Number.isSafeInteger(claimedTokens) || claimedTokens < 0 || claimedTokens > MAX_CLAIMED_TOKENS) {
    return { error: "Số Token khai báo không hợp lệ." };
  }

  const rawThemes = body?.claimedThemeIds === undefined ? [] : body.claimedThemeIds;
  if (!Array.isArray(rawThemes) || rawThemes.length > MAX_CLAIMED_THEMES) {
    return { error: "Danh sách màu không hợp lệ." };
  }
  const claimedThemeIds = [];
  for (const value of rawThemes) {
    const themeId = parseThemeId(value);
    if (!themeId) return { error: "Danh sách màu không hợp lệ." };
    if (!claimedThemeIds.includes(themeId)) claimedThemeIds.push(themeId);
  }

  let selectedThemeId = null;
  if (body?.selectedThemeId !== undefined && body.selectedThemeId !== null && String(body.selectedThemeId) !== "0") {
    selectedThemeId = parseThemeId(body.selectedThemeId);
    if (!selectedThemeId) return { error: "Màu đang chọn không hợp lệ." };
  }
  return { localUsername, claimedTokens, claimedThemeIds, selectedThemeId };
}

router.use("/legacy-import", requireDatabase, requireMigration(LEGACY_IMPORT_MIGRATION), authenticate);

router.get("/legacy-import", asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM legacy_imports WHERE user_id = $1", [req.user.id]);
  res.json({ import: rows[0] ? toImportPayload(rows[0]) : null });
}));

// Local data is self-reported: nothing that has monetary value is credited without admin review.
router.post("/legacy-import", asyncRoute(async (req, res) => {
  const input = validateImportBody(req.body);
  if (input.error) return res.status(400).json({ error: input.error, code: "INVALID_LEGACY_IMPORT" });

  const result = await withTransaction(async (client) => {
    const { rows: userRows } = await client.query(
      "SELECT id FROM users WHERE id = $1 AND status = 'active' FOR UPDATE",
      [req.user.id]
    );
    if (!userRows[0]) return { locked: true };

    const { rows: existingRows } = await client.query(
      "SELECT * FROM legacy_imports WHERE user_id = $1",
      [req.user.id]
    );
    if (existingRows[0]) return { duplicate: existingRows[0] };

    const { rows: ownedRows } = await client.query(
      "SELECT theme_id FROM theme_entitlements WHERE user_id = $1",
      [req.user.id]
    );
    const owned = new Set(ownedRows.map((row) => row.theme_id));
    const applied = [];
    const notEligible = [];
    const pendingThemeIds = [];

    for (const themeId of input.claimedThemeIds) {
      if (BASIC_THEME_IDS.has(themeId)) {
        notEligible.push({ item: `Màu ${themeId}`, reason: "Màu miễn phí, tài khoản server đã có sẵn." });
      } else if (owned.has(themeId)) {
        notEligible.push({ item: `Màu ${themeId}`, reason: "Tài khoản server đã sở hữu màu này." });
      } else {
        pendingThemeIds.push(themeId);
      }
    }

    let appliedThemeId = null;
    if (input.selectedThemeId) {
      if (BASIC_THEME_IDS.has(input.selectedThemeId) || owned.has(input.selectedThemeId)) {
        appliedThemeId = input.selectedThemeId;
        await client.query("UPDATE users SET selected_theme_id = $2 WHERE id = $1", [req.user.id, appliedThemeId]);
        applied.push({ item: `Màu đang dùng ${appliedThemeId}`, reason: "Đã áp dụng cho tài khoản server." });
      } else {
        notEligible.push({ item: `Màu đang dùng ${input.selectedThemeId}`, reason: "Chưa có quyền sở hữu trên máy chủ; chỉ áp dụng sau khi được duyệt." });
      }
    }

    const needsReview = input.claimedTokens > 0 || pendingThemeIds.length > 0;
    const { rows: insertedRows } = await client.query(
      `INSERT INTO legacy_imports
       (user_id, local_username, claimed_tokens, claimed_theme_ids, applied_theme_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [req.user.id, input.localUsername, input.claimedTokens, pendingThemeIds, appliedThemeId,
        needsReview ? "pending_review" : "completed"]
    );
    if (!insertedRows[0]) return { duplicate: true };

    await client.query(
      `INSERT INTO admin_audit_logs (actor_user_id, target_user_id, action, details)
       VALUES ($1, $1, 'legacy_import.submit', $2::jsonb)`,
      [req.user.id, JSON.stringify({
        importId: insertedRows[0].id,
        localUsername: input.localUsername,
        claimedTokens: input.claimedTokens,
        claimedThemeIds: pendingThemeIds,
        appliedThemeId
      })]
    );
    return {
      record: insertedRows[0],
      applied,
      notEligible,
      pendingReview: { tokens: input.claimedTokens, themeIds: pendingThemeIds }
    };
  });

  if (result.locked) return res.status(403).json({ error: "Tài khoản hiện đang bị khóa." });
  if (result.duplicate) {
    return res.status(409).json({
      error: "Tài khoản server này đã gửi yêu cầu chuyển dữ liệu trước đó.",
      code: "LEGACY_IMPORT_EXISTS",
      import: result.duplicate === true ? null : toImportPayload(result.duplicate)
    });
  }
  res.status(201).json({
    import: toImportPayload(result.record),
    applied: result.applied,
    notEligible: result.notEligible,
    pendingReview: result.pendingReview
  });
}));

module.exports = router;
