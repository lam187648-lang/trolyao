const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("./helpers");

async function balance(db, userId) {
  return Number((await db.query("SELECT token_balance FROM users WHERE id = $1", [userId])).rows[0].token_balance);
}
async function themes(db, userId) {
  return (await db.query("SELECT theme_id FROM theme_entitlements WHERE user_id = $1 ORDER BY theme_id", [userId])).rows.map((row) => row.theme_id);
}

test("legacy local account import", async (t) => {
  const s = await startServer();
  t.after(() => s.stop());
  const { api, db } = s;
  const admin = await s.register("la");
  await s.promote(admin.id);
  const user = await s.register("lu");
  const submit = (body, token = user.token) => api("/api/legacy-import", { method: "POST", token, body });

  await t.test("anonymous and wrong-login requests are rejected", async () => {
    assert.equal((await api("/api/legacy-import", { method: "POST", body: { localUsername: "x" } })).status, 401);
    assert.equal((await api("/auth/login", { method: "POST", body: { username: user.username, password: "wrong-password" } })).status, 401);
  });

  await t.test("invalid payloads are rejected without side effects", async () => {
    for (const body of [
      { localUsername: "" },
      { localUsername: "old", claimedTokens: -5 },
      { localUsername: "old", claimedTokens: "abc" },
      { localUsername: "old", claimedTokens: 2000000 },
      { localUsername: "old", claimedTokens: 1.5 },
      { localUsername: "old", claimedThemeIds: "17" },
      { localUsername: "old", claimedThemeIds: ["../17"] },
      { localUsername: "old", selectedThemeId: "<script>" }
    ]) {
      assert.equal((await submit(body)).status, 400, JSON.stringify(body));
    }
    assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM legacy_imports WHERE user_id = $1", [user.id])).rows[0].n, 0);
  });

  let importId;
  await t.test("valid import applies only verifiable data and queues the rest", async () => {
    const r = await submit({ localUsername: "oldlam", claimedTokens: 500, claimedThemeIds: [1, "3", 17, 31, 31], selectedThemeId: "3" });
    assert.equal(r.status, 201);
    importId = r.data.import.id;
    assert.equal(r.data.import.status, "pending_review");
    assert.deepEqual(r.data.pendingReview, { tokens: 500, themeIds: ["17", "31"] });
    assert.equal(r.data.applied.length, 1);
    assert.equal(r.data.notEligible.length, 2, "free themes are not imported");
    assert.equal(await balance(db, user.id), 0, "no tokens credited without review");
    assert.deepEqual(await themes(db, user.id), [], "no paid themes granted without review");
    const selected = await db.query("SELECT selected_theme_id FROM users WHERE id = $1", [user.id]);
    assert.equal(selected.rows[0].selected_theme_id, "3");
    const auditRows = await db.query("SELECT * FROM admin_audit_logs WHERE target_user_id = $1 AND action = 'legacy_import.submit'", [user.id]);
    assert.equal(auditRows.rows.length, 1);
  });

  await t.test("duplicate import is refused", async () => {
    const r = await submit({ localUsername: "another", claimedTokens: 10 });
    assert.equal(r.status, 409);
    assert.equal(r.data.code, "LEGACY_IMPORT_EXISTS");
    assert.equal((await api("/api/legacy-import", { token: user.token })).data.import.id, importId);
  });

  await t.test("forged token and theme ownership is never auto-granted", async () => {
    const forger = await s.register("lf");
    const r = await submit({ localUsername: "rich", claimedTokens: 1000000, claimedThemeIds: [41, 42], selectedThemeId: "42" }, forger.token);
    assert.equal(r.status, 201);
    assert.equal(await balance(db, forger.id), 0);
    assert.deepEqual(await themes(db, forger.id), []);
    const selected = await db.query("SELECT selected_theme_id FROM users WHERE id = $1", [forger.id]);
    assert.notEqual(selected.rows[0].selected_theme_id, "42", "unowned selected theme not applied");
    const overApprove = await api(`/admin/legacy-imports/${r.data.import.id}/approve`, { method: "POST", token: admin.token, body: { tokens: 2000000 } });
    assert.equal(overApprove.status, 400);
    const reject = await api(`/admin/legacy-imports/${r.data.import.id}/reject`, { method: "POST", token: admin.token, body: { note: "Không xác minh được" } });
    assert.equal(reject.status, 200);
    assert.equal(await balance(db, forger.id), 0);
  });

  await t.test("concurrent submissions create exactly one import", async () => {
    const racer = await s.register("lr");
    const results = await Promise.all(Array.from({ length: 6 }, () => submit({ localUsername: "race", claimedTokens: 5 }, racer.token)));
    const statuses = results.map((item) => item.status);
    assert.equal(statuses.filter((code) => code === 201).length, 1, JSON.stringify(statuses));
    assert.ok(statuses.every((code) => code === 201 || code === 409));
    assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM legacy_imports WHERE user_id = $1", [racer.id])).rows[0].n, 1);
  });

  await t.test("server failure mid-import rolls back completely", async () => {
    const victim = await s.register("lv");
    await db.query(`CREATE OR REPLACE FUNCTION test_fail_audit() RETURNS trigger AS $$
      BEGIN IF NEW.action = 'legacy_import.submit' THEN RAISE EXCEPTION 'simulated failure'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql`);
    await db.query("CREATE TRIGGER test_fail_audit BEFORE INSERT ON admin_audit_logs FOR EACH ROW EXECUTE FUNCTION test_fail_audit()");
    try {
      assert.equal((await submit({ localUsername: "old", claimedTokens: 5, selectedThemeId: "5" }, victim.token)).status, 500);
    } finally {
      await db.query("DROP TRIGGER test_fail_audit ON admin_audit_logs");
      await db.query("DROP FUNCTION test_fail_audit()");
    }
    assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM legacy_imports WHERE user_id = $1", [victim.id])).rows[0].n, 0);
    const selected = await db.query("SELECT selected_theme_id FROM users WHERE id = $1", [victim.id]);
    assert.equal(selected.rows[0].selected_theme_id, "1", "selected theme rolled back");
    assert.equal((await submit({ localUsername: "old", claimedTokens: 5, selectedThemeId: "5" }, victim.token)).status, 201, "retry works");
  });

  await t.test("client disconnect never produces duplicate imports", async () => {
    const dropped = await s.register("ld");
    const controller = new AbortController();
    const pending = submit({ localUsername: "old", claimedTokens: 7 }, dropped.token);
    const aborted = api("/api/legacy-import", { method: "POST", token: dropped.token, body: { localUsername: "old", claimedTokens: 7 }, signal: controller.signal });
    controller.abort();
    await aborted.catch(() => null);
    await pending;
    const retry = await submit({ localUsername: "old", claimedTokens: 7 }, dropped.token);
    assert.ok([201, 409].includes(retry.status));
    assert.equal((await db.query("SELECT COUNT(*)::int AS n FROM legacy_imports WHERE user_id = $1", [dropped.id])).rows[0].n, 1);
  });

  await t.test("non-admins cannot review imports", async () => {
    assert.equal((await api("/admin/legacy-imports", { token: user.token })).status, 403);
    assert.equal((await api(`/admin/legacy-imports/${importId}/approve`, { method: "POST", token: user.token, body: { tokens: 500 } })).status, 403);
  });

  await t.test("admin approval credits through the ledger exactly once", async () => {
    const list = await api("/admin/legacy-imports?status=pending_review", { token: admin.token });
    assert.ok(list.data.imports.some((item) => item.id === importId));
    assert.equal((await api(`/admin/legacy-imports/${importId}/approve`, { method: "POST", token: admin.token, body: { tokens: 300, themeIds: ["99"] } })).status, 400, "theme outside claim");
    const r = await api(`/admin/legacy-imports/${importId}/approve`, { method: "POST", token: admin.token, body: { tokens: 300, themeIds: ["17"], note: "Đã xác minh" } });
    assert.equal(r.status, 200);
    assert.equal(await balance(db, user.id), 300);
    assert.deepEqual(await themes(db, user.id), ["17"]);
    const ledger = await db.query("SELECT * FROM token_transactions WHERE user_id = $1 AND transaction_type = 'legacy_import'", [user.id]);
    assert.equal(ledger.rows.length, 1);
    assert.equal(ledger.rows[0].actor_user_id, admin.id);
    const again = await api(`/admin/legacy-imports/${importId}/approve`, { method: "POST", token: admin.token, body: { tokens: 300 } });
    assert.equal(again.status, 409, "cannot approve twice");
    assert.equal(await balance(db, user.id), 300);
    const auditRows = await db.query("SELECT * FROM admin_audit_logs WHERE target_user_id = $1 AND action = 'legacy_import.approve'", [user.id]);
    assert.equal(auditRows.rows.length, 1);
  });
});
