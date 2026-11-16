const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync, spawn } = require("node:child_process");
const { Client } = require("pg");
const { assertSafeTestDatabase, TEST_DATABASE_URL } = require("./helpers");

const MIGRATE = path.join(__dirname, "..", "scripts", "migrate.js");

function urlFor(databaseName) {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function runMigrate(databaseUrl) {
  return spawnSync(process.execPath, [MIGRATE], { env: { ...process.env, DATABASE_URL: databaseUrl }, encoding: "utf8" });
}

function runMigrateAsync(databaseUrl) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [MIGRATE], { env: { ...process.env, DATABASE_URL: databaseUrl } });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("close", (status) => resolve({ status, output }));
  });
}

test("migrations 001 and 002", async (t) => {
  assertSafeTestDatabase();
  const admin = new Client({ connectionString: urlFor("postgres") });
  await admin.connect();
  const created = [];
  async function freshDatabase(label) {
    const name = `trolyao_test_mig_${label}_${Date.now().toString(36)}`;
    await admin.query(`CREATE DATABASE ${name}`);
    created.push(name);
    const client = new Client({ connectionString: urlFor(name) });
    await client.connect();
    return { name, url: urlFor(name), client };
  }
  t.after(async () => {
    for (const name of created) await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end();
  });

  await t.test("fresh database: applies 001 and 002, rerun is a no-op", async () => {
    const { url, client } = await freshDatabase("fresh");
    const first = runMigrate(url);
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /Applied migration 001_initial_schema/);
    assert.match(first.stdout, /Applied migration 002_garden_rewards_legacy_import/);
    const second = runMigrate(url);
    assert.equal(second.status, 0, second.stderr);
    assert.match(second.stdout, /002_garden_rewards_legacy_import is already applied/);
    const ids = (await client.query("SELECT migration_id FROM schema_migrations ORDER BY migration_id")).rows.map((row) => row.migration_id);
    assert.deepEqual(ids, ["001_initial_schema", "002_garden_rewards_legacy_import"]);
    const check = await client.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'token_transactions_transaction_type_check'");
    assert.match(check.rows[0].def, /garden_reward/);
    const checks = await client.query("SELECT COUNT(*)::int AS n FROM pg_constraint WHERE conrelid = 'token_transactions'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%transaction_type%'");
    assert.equal(checks.rows[0].n, 1, "exactly one transaction_type check");
    await client.end();
  });

  await t.test("upgrade from 001 keeps existing data intact", async () => {
    const { url, client } = await freshDatabase("upgrade");
    const sql001 = fs.readFileSync(path.join(__dirname, "..", "migrations", "001_initial_schema.sql"), "utf8");
    await client.query("CREATE TABLE schema_migrations (migration_id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    await client.query(sql001);
    await client.query("INSERT INTO schema_migrations (migration_id) VALUES ('001_initial_schema')");
    const user = await client.query("INSERT INTO users (username, password_hash, token_balance) VALUES ('legacy', 'x', 120) RETURNING id");
    await client.query("INSERT INTO token_transactions (user_id, transaction_type, amount, balance_after) VALUES ($1, 'admin_gift', 120, 120)", [user.rows[0].id]);
    await client.query("INSERT INTO theme_entitlements (user_id, theme_id) VALUES ($1, '17')", [user.rows[0].id]);
    const result = runMigrate(url);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /001_initial_schema is already applied/);
    assert.match(result.stdout, /Applied migration 002/);
    const balance = await client.query("SELECT token_balance FROM users WHERE username = 'legacy'");
    assert.equal(Number(balance.rows[0].token_balance), 120);
    assert.equal((await client.query("SELECT COUNT(*)::int AS n FROM token_transactions")).rows[0].n, 1);
    assert.equal((await client.query("SELECT COUNT(*)::int AS n FROM theme_entitlements")).rows[0].n, 1);
    await client.query("INSERT INTO token_transactions (user_id, transaction_type, amount, balance_after) VALUES ($1, 'garden_reward', 5, 125)", [user.rows[0].id]);
    await assert.rejects(
      client.query("INSERT INTO token_transactions (user_id, transaction_type, amount, balance_after) VALUES ($1, 'hack', 5, 130)", [user.rows[0].id]),
      /check constraint/
    );
    await assert.rejects(
      client.query("UPDATE users SET token_balance = -1 WHERE username = 'legacy'"),
      /check constraint/,
      "negative balance still blocked"
    );
    await client.end();
  });

  await t.test("failed migration rolls back completely and can be retried", async () => {
    const { url, client } = await freshDatabase("fail");
    const sql001 = fs.readFileSync(path.join(__dirname, "..", "migrations", "001_initial_schema.sql"), "utf8");
    await client.query("CREATE TABLE schema_migrations (migration_id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    await client.query(sql001);
    await client.query("INSERT INTO schema_migrations (migration_id) VALUES ('001_initial_schema')");
    await client.query("CREATE TABLE legacy_imports (id INT)");
    const failed = runMigrate(url);
    assert.notEqual(failed.status, 0, "migration must fail");
    assert.match(failed.stderr, /Database migration failed/);
    assert.ok(!failed.stderr.includes("postgres://"), "no DATABASE_URL in error output");
    const ids = (await client.query("SELECT migration_id FROM schema_migrations")).rows.map((row) => row.migration_id);
    assert.deepEqual(ids, ["001_initial_schema"], "002 not recorded");
    assert.equal((await client.query("SELECT to_regclass('garden_sessions') AS t")).rows[0].t, null, "garden_sessions rolled back");
    const check = await client.query("SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'token_transactions'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%transaction_type%'");
    assert.equal(check.rows.length, 1);
    assert.doesNotMatch(check.rows[0].def, /garden_reward/, "old constraint restored by rollback");
    await client.query("DROP TABLE legacy_imports");
    const retry = runMigrate(url);
    assert.equal(retry.status, 0, retry.stderr);
    assert.match(retry.stdout, /Applied migration 002/);
    await client.end();
  });

  await t.test("concurrent migration runs apply each migration exactly once", async () => {
    const { url, client } = await freshDatabase("race");
    const results = await Promise.all([runMigrateAsync(url), runMigrateAsync(url), runMigrateAsync(url)]);
    assert.ok(results.every((item) => item.status === 0), results.map((item) => item.output).join("\n"));
    const appliedLines = results.map((item) => item.output).join("").match(/Applied migration 002/g) || [];
    assert.equal(appliedLines.length, 1);
    assert.equal((await client.query("SELECT COUNT(*)::int AS n FROM schema_migrations")).rows[0].n, 2);
    await client.end();
  });

  await t.test("migration 001 file is unchanged from the committed version", async () => {
    const sql = fs.readFileSync(path.join(__dirname, "..", "migrations", "001_initial_schema.sql"), "utf8");
    assert.match(sql, /transaction_type IN \('admin_gift', 'theme_purchase', 'study_reward', 'legacy_import'\)/);
  });
});
