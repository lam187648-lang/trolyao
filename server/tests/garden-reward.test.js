const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("./helpers");

async function finishSession(db, sessionId) {
  await db.query("UPDATE garden_sessions SET started_at = started_at - INTERVAL '4 hours' WHERE id = $1", [sessionId]);
}
async function allowNewStart(db, userId) {
  await db.query("UPDATE garden_sessions SET started_at = started_at - INTERVAL '10 seconds' WHERE user_id = $1", [userId]);
}
async function expireRewardCooldown(db, userId) {
  await db.query(
    "UPDATE token_transactions SET created_at = created_at - INTERVAL '2 minutes' WHERE user_id = $1 AND transaction_type = 'garden_reward'",
    [userId]
  );
}
async function balance(db, userId) {
  return Number((await db.query("SELECT token_balance FROM users WHERE id = $1", [userId])).rows[0].token_balance);
}

test("garden reward API", async (t) => {
  const s = await startServer();
  t.after(() => s.stop());
  const { api, db } = s;
  const user = await s.register("gu");
  const other = await s.register("go");
  const start = (body = { seed: "oak", durationMinutes: 10 }, token = user.token) =>
    api("/api/garden/sessions", { method: "POST", token, body });
  const claim = (sessionId, extra = {}, token = user.token) =>
    api("/api/garden-reward", { method: "POST", token, body: { sessionId, ...extra } });

  await t.test("anonymous requests are rejected", async () => {
    assert.equal((await api("/api/garden-reward", { method: "POST", body: { sessionId: "x" } })).status, 401);
    assert.equal((await api("/api/garden/sessions", { method: "POST", body: { seed: "oak", durationMinutes: 10 } })).status, 401);
  });

  await t.test("invalid garden options are rejected", async () => {
    assert.equal((await start({ seed: "rose", durationMinutes: 10 })).status, 400);
    assert.equal((await start({ seed: "oak", durationMinutes: 7 })).status, 400);
    assert.equal((await start({ seed: "oak", durationMinutes: 100000 })).status, 400);
    assert.equal((await claim("not-a-uuid")).status, 400);
  });

  let sessionId;
  await t.test("forged reward data and early claims do not pay", async () => {
    const r = await start({ seed: "oak", durationMinutes: 10, rewardAmount: 999999 });
    assert.equal(r.status, 201);
    assert.equal(r.data.session.rewardAmount, 50, "server computes 10 min x 5");
    sessionId = r.data.session.id;
    const early = await claim(sessionId, { tokens: 999999, completed: true, rewardAmount: 999999 });
    assert.equal(early.status, 409);
    assert.equal(early.data.code, "GARDEN_NOT_COMPLETE");
    assert.equal(await balance(db, user.id), 0);
  });

  await t.test("another account cannot claim the session", async () => {
    await finishSession(db, sessionId);
    assert.equal((await claim(sessionId, {}, other.token)).status, 404);
  });

  await t.test("valid claim pays once, with ledger and audit", async () => {
    const r = await claim(sessionId, { tokens: 999999 });
    assert.equal(r.status, 200);
    assert.equal(r.data.rewardAmount, 50);
    assert.equal(r.data.tokenBalance, 50);
    const again = await claim(sessionId);
    assert.equal(again.status, 409);
    assert.equal(again.data.code, "GARDEN_ALREADY_REWARDED");
    const ledger = await db.query("SELECT * FROM token_transactions WHERE user_id = $1 AND transaction_type = 'garden_reward'", [user.id]);
    assert.equal(ledger.rows.length, 1);
    assert.equal(Number(ledger.rows[0].balance_after), 50);
    const auditRows = await db.query("SELECT * FROM admin_audit_logs WHERE target_user_id = $1 AND action = 'garden.reward'", [user.id]);
    assert.equal(auditRows.rows.length, 1);
    assert.equal(auditRows.rows[0].details.sessionId, sessionId);
  });

  await t.test("cooldown blocks rapid consecutive rewards", async () => {
    await allowNewStart(db, user.id);
    const r = await start();
    await finishSession(db, r.data.session.id);
    const blocked = await claim(r.data.session.id);
    assert.equal(blocked.status, 429);
    assert.ok(blocked.data.retryAfterSeconds > 0);
    assert.equal(await balance(db, user.id), 50);
    await expireRewardCooldown(db, user.id);
    assert.equal((await claim(r.data.session.id)).status, 200, "same session is claimable after cooldown");
    assert.equal(await balance(db, user.id), 100);
  });

  await t.test("spamming session starts is rate limited", async () => {
    await allowNewStart(db, user.id);
    assert.equal((await start()).status, 201);
    assert.equal((await start()).status, 429);
  });

  await t.test("abandoned sessions cannot be claimed", async () => {
    await allowNewStart(db, user.id);
    const r = await start();
    assert.equal((await api(`/api/garden/sessions/${r.data.session.id}/abandon`, { method: "POST", token: user.token })).status, 204);
    await finishSession(db, r.data.session.id);
    const res = await claim(r.data.session.id);
    assert.equal(res.status, 409);
    assert.equal(res.data.code, "GARDEN_SESSION_ABANDONED");
  });

  await t.test("concurrent claims pay exactly once", async () => {
    await allowNewStart(db, user.id);
    await expireRewardCooldown(db, user.id);
    const r = await start({ seed: "pine", durationMinutes: 20 });
    await finishSession(db, r.data.session.id);
    const before = await balance(db, user.id);
    const results = await Promise.all(Array.from({ length: 8 }, () => claim(r.data.session.id)));
    const statuses = results.map((item) => item.status).sort();
    assert.equal(statuses.filter((code) => code === 200).length, 1, JSON.stringify(statuses));
    assert.ok(statuses.every((code) => code === 200 || code === 409));
    assert.equal(await balance(db, user.id), before + 100);
  });

  await t.test("failed transaction leaves no partial reward", async () => {
    await allowNewStart(db, user.id);
    await expireRewardCooldown(db, user.id);
    const r = await start();
    await finishSession(db, r.data.session.id);
    const before = await balance(db, user.id);
    await db.query(`CREATE OR REPLACE FUNCTION test_fail_audit() RETURNS trigger AS $$
      BEGIN IF NEW.action = 'garden.reward' THEN RAISE EXCEPTION 'simulated failure'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql`);
    await db.query("CREATE TRIGGER test_fail_audit BEFORE INSERT ON admin_audit_logs FOR EACH ROW EXECUTE FUNCTION test_fail_audit()");
    try {
      assert.equal((await claim(r.data.session.id)).status, 500);
    } finally {
      await db.query("DROP TRIGGER test_fail_audit ON admin_audit_logs");
      await db.query("DROP FUNCTION test_fail_audit()");
    }
    assert.equal(await balance(db, user.id), before, "balance rolled back");
    const session = await db.query("SELECT status FROM garden_sessions WHERE id = $1", [r.data.session.id]);
    assert.equal(session.rows[0].status, "running", "session still claimable");
    assert.equal((await claim(r.data.session.id)).status, 200, "retry succeeds");
  });

  await t.test("ledger sum matches balance and balance is never negative", async () => {
    const sum = await db.query("SELECT COALESCE(SUM(amount), 0)::bigint AS total FROM token_transactions WHERE user_id = $1", [user.id]);
    assert.equal(Number(sum.rows[0].total), await balance(db, user.id));
    assert.ok(await balance(db, user.id) >= 0);
  });

  await t.test("locked accounts cannot claim", async () => {
    await allowNewStart(db, other.id);
    const r = await start(undefined, other.token);
    await finishSession(db, r.data.session.id);
    await db.query("UPDATE users SET status = 'locked' WHERE id = $1", [other.id]);
    const res = await claim(r.data.session.id, {}, other.token);
    assert.ok([401, 403].includes(res.status));
    assert.equal(await balance(db, other.id), 0);
  });

  await t.test("study reward is unchanged", async () => {
    const before = await balance(db, user.id);
    assert.equal((await api("/api/study-reward", { method: "POST", token: user.token })).data.tokenBalance, before + 20);
    assert.equal((await api("/api/study-reward", { method: "POST", token: user.token })).status, 429);
  });
});
