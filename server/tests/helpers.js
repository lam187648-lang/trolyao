const { spawn } = require("node:child_process");
const path = require("node:path");
const { Client } = require("pg");

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "";

function assertSafeTestDatabase() {
  if (!TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL is required. Never point it at a production database.");
  }
  const databaseName = new URL(TEST_DATABASE_URL).pathname.slice(1);
  if (!/test/i.test(databaseName) || process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run: the test database name must contain \"test\" and NODE_ENV must not be production.");
  }
}

async function startServer(extraEnv = {}) {
  assertSafeTestDatabase();
  const port = 4300 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, PORT: String(port), OPENROUTER_API_KEY: "", ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  const db = new Client({ connectionString: TEST_DATABASE_URL });
  await db.connect();

  async function api(pathName, { method = "GET", body, token, signal } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(baseUrl + pathName, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal
    });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  }

  async function register(prefix) {
    const username = `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(0, 30);
    const password = "password123";
    const result = await api("/auth/register", { method: "POST", body: { username, password } });
    if (result.status !== 201) throw new Error(`register failed: ${JSON.stringify(result)}`);
    return { username, password, token: result.data.accessToken, id: result.data.user.id };
  }

  async function promote(userId) {
    await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
  }

  async function stop() {
    await db.end();
    child.kill();
  }

  return { api, db, register, promote, stop, baseUrl, logs };
}

module.exports = { startServer, assertSafeTestDatabase, TEST_DATABASE_URL };
