const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("./helpers");

test("legacy import review audit", async (t) => {
  const s = await startServer();
  t.after(() => s.stop());
  const { api, db } = s;
  const admin = await s.register("ra");
  const admin2 = await s.register("rb");
  await s.promote(admin.id);
  await s.promote(admin2.id);

  async function newClaim(prefix, body) {
    const user = await s.register(prefix);
    const r = await api("/api/legacy-import", { method: "POST", token: user.token, body });
    assert.equal(r.status, 201);
    return { user, importId: r.data.import.id };
  }
  const balance = async (id) => Number((await db.query("SELECT token_balance FROM users WHERE id = $1", [id])).rows[0].token_balance);
  const approve = (id, body, token = admin.token) => api(`/admin/legacy-imports/${id}/approve`, { method: "POST", token, body });
  const reject = (id, body, token = admin.token) => api(`/admin/legacy-imports/${id}/reject`, { method: "POST", token, body });

  await t.test("approval cannot exceed the declared tokens or themes", async () => {
    const { user, importId } = await newClaim("rc", { localUsername: "old", claimedTokens: 100, claimedThemeIds: [20, 25] });
    for (const body of [
      { tokens: 101 }, { tokens: -1 }, { tokens: 1.5 }, { tokens: "50abc" },
      { tokens: 10, themeIds: ["26"] }, { tokens: 10, themeIds: ["20", "1"] }
    ]) {
      assert.equal((await approve(importId, body)).status, 400, JSON.stringify(body));
    }
    assert.equal(await balance(user.id), 0);
    const ok = await approve(importId, { tokens: 100, themeIds: ["20", "25"] });
    assert.equal(ok.status, 200);
    assert.equal(await balance(user.id), 100);
  });

  await t.test("concurrent approvals by two admins credit only once", async () => {
    const { user, importId } = await newClaim("rd", { localUsername: "old", claimedTokens: 400 });
    const results = await Promise.all([
      approve(importId, { tokens: 400 }), approve(importId, { tokens: 400 }, admin2.token),
      approve(importId, { tokens: 400 }), approve(importId, { tokens: 400 }, admin2.token)
    ]);
    const statuses = results.map((item) => item.status);
    assert.equal(statuses.filter((code) => code === 200).length, 1, JSON.stringify(statuses));
    assert.ok(statuses.every((code) => code === 200 || code === 409));
    assert.equal(await balance(user.id), 400);
    const ledger = await db.query("SELECT COUNT(*)::int AS n FROM token_transactions WHERE user_id = $1 AND transaction_type = 'legacy_import'", [user.id]);
    assert.equal(ledger.rows[0].n, 1);
  });

  await t.test("concurrent approve and reject: exactly one wins", async () => {
    const { user, importId } = await newClaim("re", { localUsername: "old", claimedTokens: 50 });
    const results = await Promise.all([approve(importId, { tokens: 50 }), reject(importId, { note: "x" }, admin2.token)]);
    assert.equal(results.filter((item) => item.status === 200).length, 1, JSON.stringify(results.map((item) => item.status)));
    const record = await db.query("SELECT status FROM legacy_imports WHERE id = $1", [importId]);
    assert.equal(await balance(user.id), record.rows[0].status === "approved" ? 50 : 0);
  });

  await t.test("rejected requests cannot be approved later", async () => {
    const { user, importId } = await newClaim("rf", { localUsername: "old", claimedTokens: 70 });
    assert.equal((await reject(importId, { note: "Không xác minh được" })).status, 200);
    assert.equal((await approve(importId, { tokens: 70 })).status, 409);
    assert.equal((await reject(importId, {})).status, 409);
    assert.equal(await balance(user.id), 0);
    const auditRows = await db.query("SELECT details FROM admin_audit_logs WHERE target_user_id = $1 AND action = 'legacy_import.reject'", [user.id]);
    assert.equal(auditRows.rows.length, 1);
    assert.equal(auditRows.rows[0].details.importId, importId);
  });

  await t.test("unknown or malformed ids are handled", async () => {
    assert.equal((await approve("00000000-0000-4000-8000-000000000000", { tokens: 0 })).status, 404);
    assert.equal((await approve("not-a-uuid", { tokens: 0 })).status, 400);
    assert.equal((await reject("not-a-uuid", {})).status, 400);
  });

  await t.test("users can only see their own import", async () => {
    const a = await newClaim("rg", { localUsername: "mine", claimedTokens: 1 });
    const other = await s.register("rh");
    const mine = await api("/api/legacy-import", { token: a.user.token });
    assert.equal(mine.data.import.id, a.importId);
    const theirs = await api("/api/legacy-import", { token: other.token });
    assert.equal(theirs.data.import, null);
  });

  await t.test("approval writes ledger with admin actor and an audit record", async () => {
    const { user, importId } = await newClaim("ri", { localUsername: "old", claimedTokens: 30, claimedThemeIds: [33] });
    assert.equal((await approve(importId, { tokens: 0, themeIds: ["33"], note: "Chỉ màu" })).status, 200);
    assert.equal(await balance(user.id), 0, "zero tokens creates no ledger row");
    const ledger = await db.query("SELECT COUNT(*)::int AS n FROM token_transactions WHERE user_id = $1", [user.id]);
    assert.equal(ledger.rows[0].n, 0);
    const themes = await db.query("SELECT granted_by_user_id FROM theme_entitlements WHERE user_id = $1 AND theme_id = '33'", [user.id]);
    assert.equal(themes.rows[0].granted_by_user_id, admin.id);
    const auditRows = await db.query("SELECT actor_user_id, details FROM admin_audit_logs WHERE target_user_id = $1 AND action = 'legacy_import.approve'", [user.id]);
    assert.equal(auditRows.rows[0].actor_user_id, admin.id);
    assert.deepEqual(auditRows.rows[0].details.themeIds, ["33"]);
  });
});
