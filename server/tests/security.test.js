const test = require("node:test");
const assert = require("node:assert/strict");
const { startServer } = require("./helpers");

const FAKE_KEY = "sk-or-test-DO-NOT-LEAK-1234567890";

test("security audit: IDOR, replay, races, input validation and data exposure", async (t) => {
  const s = await startServer({ OPENROUTER_API_KEY: FAKE_KEY, DB_DIAGNOSTIC_SECRET: "x".repeat(40) });
  t.after(() => s.stop());
  const { api, db } = s;
  const alice = await s.register("sa");
  const bob = await s.register("sb");
  const admin = await s.register("sx");
  await s.promote(admin.id);

  await t.test("malformed or forged bearer tokens are rejected", async () => {
    for (const token of ["abc", "x".repeat(43), `${alice.token}x`]) {
      assert.equal((await api("/auth/me", { token })).status, 401);
    }
    const r = await fetch(`${s.baseUrl}/auth/me`, { headers: { Authorization: `Basic ${alice.token}` } });
    assert.equal(r.status, 401);
  });

  await t.test("expired sessions are rejected", async () => {
    const temp = await s.register("se");
    await db.query("UPDATE sessions SET expires_at = NOW() - INTERVAL '1 second' WHERE user_id = $1", [temp.id]);
    assert.equal((await api("/auth/me", { token: temp.token })).status, 401);
  });

  await t.test("logout revokes only the current session and cannot be replayed", async () => {
    const login = await api("/auth/login", { method: "POST", body: { username: alice.username, password: alice.password } });
    const second = login.data.accessToken;
    assert.equal((await api("/auth/logout", { method: "POST", token: second })).status, 204);
    assert.equal((await api("/auth/logout", { method: "POST", token: second })).status, 401, "replayed logout");
    assert.equal((await api("/auth/me", { token: second })).status, 401);
    assert.equal((await api("/auth/me", { token: alice.token })).status, 200, "other session still valid");
  });

  await t.test("garden IDOR: cannot abandon, claim or read another user's sessions", async () => {
    const started = await api("/api/garden/sessions", { method: "POST", token: alice.token, body: { seed: "oak", durationMinutes: 10 } });
    const id = started.data.session.id;
    assert.equal((await api(`/api/garden/sessions/${id}/abandon`, { method: "POST", token: bob.token })).status, 404);
    await db.query("UPDATE garden_sessions SET started_at = started_at - INTERVAL '1 hour' WHERE id = $1", [id]);
    assert.equal((await api("/api/garden-reward", { method: "POST", token: bob.token, body: { sessionId: id } })).status, 404);
    const bobHistory = await api("/api/garden/history", { token: bob.token });
    assert.equal(bobHistory.status, 200);
    assert.ok(!bobHistory.data.history.some((item) => item.id === id));
    const status = await db.query("SELECT status FROM garden_sessions WHERE id = $1", [id]);
    assert.equal(status.rows[0].status, "running");
  });

  await t.test("garden history returns the server-verified reward amounts", async () => {
    const before = await api("/api/garden/history", { token: alice.token });
    const running = before.data.history.find((item) => item.status === "running");
    const claimed = await api("/api/garden-reward", { method: "POST", token: alice.token, body: { sessionId: running.id } });
    assert.equal(claimed.status, 200);
    const after = await api("/api/garden/history", { token: alice.token });
    const entry = after.data.history.find((item) => item.id === running.id);
    assert.equal(entry.status, "rewarded");
    assert.equal(entry.rewardAmount, claimed.data.rewardAmount);
    const ledger = await db.query(
      "SELECT tt.amount FROM garden_sessions gs JOIN token_transactions tt ON tt.id = gs.reward_transaction_id WHERE gs.id = $1",
      [running.id]
    );
    assert.equal(Number(ledger.rows[0].amount), entry.rewardAmount);
    assert.equal((await api("/api/garden/history")).status, 401);
  });

  await t.test("concurrent theme purchases charge only once", async () => {
    await db.query("UPDATE users SET token_balance = 60 WHERE id = $1", [bob.id]);
    const results = await Promise.all(Array.from({ length: 6 }, () => api("/api/themes/15/purchase", { method: "POST", token: bob.token })));
    assert.ok(results.every((item) => item.status === 200), JSON.stringify(results.map((item) => item.status)));
    const balance = await db.query("SELECT token_balance FROM users WHERE id = $1", [bob.id]);
    assert.equal(Number(balance.rows[0].token_balance), 10);
    const purchases = await db.query("SELECT COUNT(*)::int AS n FROM token_transactions WHERE user_id = $1 AND transaction_type = 'theme_purchase'", [bob.id]);
    assert.equal(purchases.rows[0].n, 1);
  });

  await t.test("concurrent study rewards pay only once", async () => {
    const racer = await s.register("ss");
    const results = await Promise.all(Array.from({ length: 6 }, () => api("/api/study-reward", { method: "POST", token: racer.token })));
    assert.equal(results.filter((item) => item.status === 200).length, 1, JSON.stringify(results.map((item) => item.status)));
    const balance = await db.query("SELECT token_balance FROM users WHERE id = $1", [racer.id]);
    assert.equal(Number(balance.rows[0].token_balance), 20);
  });

  await t.test("input validation rejects hostile payloads", async () => {
    assert.equal((await api("/api/themes/selected", { method: "PUT", token: alice.token, body: { themeId: "1'; DROP TABLE users;--" } })).status, 400);
    assert.equal((await api("/api/themes/%27%20OR%201%3D1/purchase", { method: "POST", token: alice.token })).status, 403);
    assert.equal((await api("/api/garden/sessions", { method: "POST", token: alice.token, body: { seed: { $ne: null }, durationMinutes: [10] } })).status, 400);
    assert.equal((await api("/api/garden-reward", { method: "POST", token: alice.token, body: { sessionId: ["x"] } })).status, 400);
    const injected = await api(`/admin/users?q=${encodeURIComponent("' OR 1=1 --")}`, { token: admin.token });
    assert.equal(injected.status, 200);
    assert.equal(injected.data.total, 0);
    const badJson = await fetch(`${s.baseUrl}/api/study-reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${alice.token}` },
      body: "{bad json"
    });
    assert.equal(badJson.status, 400);
    const huge = await fetch(`${s.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "a", password: "x".repeat(9 * 1024 * 1024) })
    });
    assert.equal(huge.status, 413);
    const users = await db.query("SELECT COUNT(*)::int AS n FROM users");
    assert.ok(users.rows[0].n > 0, "users table intact");
  });

  await t.test("admin-only routes reject normal users and anonymous callers", async () => {
    for (const [method, path] of [
      ["GET", "/admin/users"], ["GET", "/admin/audit"], ["GET", "/admin/legacy-imports"],
      ["POST", `/admin/users/${bob.id}/tokens`], ["PATCH", `/admin/users/${bob.id}/status`],
      ["POST", `/admin/users/${bob.id}/sessions/revoke`], ["POST", `/admin/users/${bob.id}/themes/20`],
      ["DELETE", `/admin/users/${bob.id}/themes/20`]
    ]) {
      assert.equal((await api(path, { method, token: alice.token, body: method === "GET" ? undefined : { amount: 5, status: "locked" } })).status, 403, path);
      assert.equal((await api(path, { method, body: method === "GET" ? undefined : {} })).status, 401, path);
    }
    assert.equal((await api("/admin/db-diagnostic")).status, 401);
  });

  await t.test("responses never expose password hashes, session hashes or secrets", async () => {
    const responses = [
      await api("/auth/me", { token: alice.token }),
      await api("/auth/login", { method: "POST", body: { username: alice.username, password: alice.password } }),
      await api("/admin/users", { token: admin.token }),
      await api("/admin/audit", { token: admin.token }),
      await api("/api/transactions", { token: alice.token }),
      await api("/auth/status"),
      await api("/health")
    ];
    const text = JSON.stringify(responses);
    assert.ok(!/password_hash|token_hash|\$2[aby]\$/.test(text), "no hashes");
    assert.ok(!text.includes(FAKE_KEY), "no API key");
    assert.ok(!text.includes("postgres://"), "no DATABASE_URL");
  });

  await t.test("server logs do not contain secrets or credentials", async () => {
    await api("/auth/login", { method: "POST", body: { username: alice.username, password: "WrongPassword!123" } });
    await api("/chat", { method: "POST", body: { messages: "invalid" } });
    const logText = s.logs.join("");
    assert.ok(!logText.includes(FAKE_KEY), "API key not logged");
    assert.ok(!logText.includes("postgres://"), "DATABASE_URL not logged");
    assert.ok(!logText.includes("WrongPassword!123") && !logText.includes(alice.password), "passwords not logged");
    assert.ok(!logText.includes(alice.token), "session token not logged");
  });
});
