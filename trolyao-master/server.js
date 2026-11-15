const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5500,http://127.0.0.1:3000,http://127.0.0.1:5500,https://lam187648.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] }
});

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname, { index: false }));

const API_KEY = process.env.OPENROUTER_API_KEY;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "http://localhost:5500";
const USERNAME_PATTERN = /^[^<>&"'`\u0000-\u001f\u007f]{1,80}$/u;

function isValidUsername(username) {
  return typeof username === "string" && USERNAME_PATTERN.test(username);
}

function isValidAdminToken(token) {
  if (!ADMIN_API_TOKEN || typeof token !== "string") return false;
  const expected = Buffer.from(ADMIN_API_TOKEN);
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("Server chatbot đang chạy OK 🚀");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "trolyao", uptime: process.uptime() });
});

app.post("/chat", async (req, res) => {
  let timeout;
  try {
    if (!API_KEY) {
      return res.status(503).json({ error: "AI_NOT_CONFIGURED" });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = body.messages;
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 50 ||
      messages.some((message) =>
        !message ||
        !["system", "user", "assistant"].includes(message.role) ||
        !(typeof message.content === "string" || Array.isArray(message.content))
      )
    ) {
      return res.status(400).json({ error: "INVALID_CHAT_PAYLOAD" });
    }

    const payload = {
      model: OPENROUTER_MODEL,
      messages,
      temperature: typeof body.temperature === "number" ? Math.max(0, Math.min(body.temperature, 1)) : 0.55,
      max_tokens: typeof body.max_tokens === "number" ? Math.max(1, Math.min(body.max_tokens, 2200)) : 2200
    };

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 45000);
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": "Chatbot"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: "AI_RATE_LIMITED" });
      console.error("OpenRouter request failed with status:", response.status);
      return res.status(502).json({ error: "AI_UPSTREAM_FAILED" });
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) {
      return res.status(502).json({ error: "AI_INVALID_RESPONSE" });
    }
    return res.json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "AI_TIMEOUT" });
    }
    console.error("Chat request failed:", err.message);
    return res.status(502).json({ error: "AI_CONNECTION_FAILED" });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

// Socket.IO event handlers
let users = [];

io.on("connection", (socket) => {

  socket.on("join", (user) => {
    if (!user || typeof user !== "object" || !isValidUsername(user.username)) return;
    const newUser = {
      id: socket.id,
      username: user.username,
      isAdmin: user.isAdmin || false
    };

    users.push(newUser);

    io.emit("users", users);
  });

  socket.on("kick", (request, acknowledge) => {
    const username = typeof request === "string" ? request : request?.username;
    const adminToken = typeof request === "object" ? request?.adminToken : undefined;

    if (!isValidAdminToken(adminToken)) {
      if (typeof acknowledge === "function") acknowledge({ ok: false, error: "ADMIN_AUTH_REQUIRED" });
      return;
    }

    if (typeof username !== "string" || !username) {
      if (typeof acknowledge === "function") acknowledge({ ok: false, error: "INVALID_USERNAME" });
      return;
    }

    const user = users.find(u => u.username === username);

    if (user) {
      io.to(user.id).emit("kicked"); // kick đúng người
      users = users.filter(u => u.username !== username);
      io.emit("users", users);
    }
    if (typeof acknowledge === "function") acknowledge({ ok: true });
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
  });

});

app.get(/^(?!\/(?:chat|health)(?:\/|$)|\/api(?:\/|$)|\/socket\.io(?:\/|$)).*/, (req, res) => {
  const requestedPath = req.path === "/" ? "index.html" : req.path.replace(/^\/+/, "");
  const safeFile = path.resolve(__dirname, requestedPath);
  const relativePath = path.relative(__dirname, safeFile);
  const isInsideRoot = relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath));

  if (isInsideRoot && fs.existsSync(safeFile) && fs.statSync(safeFile).isFile()) {
    return res.sendFile(safeFile);
  }

  const fallback = path.join(__dirname, "index.html");
  if (fs.existsSync(fallback)) {
    return res.sendFile(fallback);
  }

  return res.status(404).send("Not found");
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Server chạy ở port", PORT);
});
