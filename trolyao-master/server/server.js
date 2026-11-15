const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");
const pusherConfig = {
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER
};
const hasPusherConfig = Object.values(pusherConfig).every(Boolean);
const pusher = hasPusherConfig ? new (require("pusher"))({ ...pusherConfig, useTLS: true }) : null;

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5500,http://127.0.0.1:3000,http://127.0.0.1:5500,https://lam187648.github.io")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: false }));

// Environment variables
const API_KEY = process.env.OPENROUTER_API_KEY;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "https://lam187648.github.io/troly";
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

function requireAdminApi(req, res, next) {
  if (!ADMIN_API_TOKEN) return res.status(503).json({ error: "ADMIN_AUTH_NOT_CONFIGURED" });
  const authorization = req.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!isValidAdminToken(token)) return res.status(401).json({ error: "ADMIN_AUTH_REQUIRED" });
  return next();
}

// Health check endpoint
app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("✅ Server chatbot Tro Ly Ao đang chạy OK!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// AI Chat endpoint
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
        "X-Title": "Tro Ly Ao Chatbot"
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
    if (err.name === "AbortError") return res.status(504).json({ error: "AI_TIMEOUT" });
    console.error("Chat request failed:", err.message);
    return res.status(502).json({ error: "AI_CONNECTION_FAILED" });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
});

// Socket.IO event handlers
let users = [];

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);
  
  // Send current users to new connection
  socket.emit("users", users);
  
  // Handle user join
  socket.on("join", (user) => {
    if (!user || typeof user !== "object" || !isValidUsername(user.username)) return;
    console.log("👤 User joined:", user.username);
    
    // Remove existing user with same username
    users = users.filter(u => u.username !== user.username);
    
    const newUser = {
      id: socket.id,
      username: user.username,
      isAdmin: user.isAdmin || false,
      joinTime: Date.now()
    };

    users.push(newUser);
    
    // Broadcast updated user list to all clients
    io.emit("users", users);
  });

  // Handle kick user
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

    console.log("🚫 Kick user:", username);
    const user = users.find(u => u.username === username);

    if (user) {
      io.to(user.id).emit("kicked"); // Send kick event to specific user
      users = users.filter(u => u.username !== username);
      io.emit("users", users); // Broadcast updated list
    }
    if (typeof acknowledge === "function") acknowledge({ ok: true });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
  });
});

// ========== PUSHER REAL-TIME ADMIN ENDPOINTS ==========
// Track online users for Pusher
let pusherUsers = Object.create(null);

// User online - báo server khi user vào
app.post("/pusher/user-online", (req, res) => {
  if (!pusher) return res.status(503).json({ success: false, error: "PUSHER_NOT_CONFIGURED" });
  const userId = req.body?.id;
  const username = req.body?.username || userId;
  if (!isValidUsername(userId) || !isValidUsername(username)) {
    return res.status(400).json({ success: false, error: "INVALID_USERNAME" });
  }
  
  if (userId) {
    pusherUsers[userId] = { username, lastSeen: Date.now() };
    
    // Broadcast updated user list
    pusher.trigger("private-admin-channel", "user-update", {
      users: Object.entries(pusherUsers).map(([id, data]) => ({
        id,
        username: data.username,
        online: true
      }))
    });
    
    console.log("🟢 Pusher user online:", username);
  }
  
  res.json({ success: true, users: Object.keys(pusherUsers) });
});

// User offline - báo khi user thoát
app.post("/pusher/user-offline", (req, res) => {
  if (!pusher) return res.status(503).json({ success: false, error: "PUSHER_NOT_CONFIGURED" });
  const userId = req.body?.id;
  if (typeof userId !== "string" || !isValidUsername(userId)) {
    return res.status(400).json({ success: false, error: "INVALID_USERNAME" });
  }
  
  if (userId && pusherUsers[userId]) {
    delete pusherUsers[userId];
    
    pusher.trigger("private-admin-channel", "user-update", {
      users: Object.entries(pusherUsers).map(([id, data]) => ({
        id,
        username: data.username,
        online: true
      }))
    });
    
    console.log("🔴 Pusher user offline:", userId);
  }
  
  res.json({ success: true });
});

// API kick user real-time
app.post("/pusher/kick", requireAdminApi, (req, res) => {
  if (!pusher) return res.status(503).json({ success: false, error: "PUSHER_NOT_CONFIGURED" });
  const userId = req.body?.id;
  const reason = typeof req.body?.reason === "string"
    ? req.body.reason.slice(0, 200)
    : "Bạn đã bị admin kick khỏi hệ thống";
  if (typeof userId !== "string" || !isValidUsername(userId)) {
    return res.status(400).json({ success: false, error: "INVALID_USERNAME" });
  }
  
  if (userId) {
    // Gửi lệnh kick realtime đến user cụ thể
    pusher.trigger("user-" + userId, "kick", {
      id: userId,
      reason: reason,
      timestamp: Date.now()
    });
    
    // Xóa khỏi danh sách online
    if (pusherUsers[userId]) {
      delete pusherUsers[userId];
    }
    
    // Cập nhật lại danh sách user
    pusher.trigger("private-admin-channel", "user-update", {
      users: Object.entries(pusherUsers).map(([id, data]) => ({
        id,
        username: data.username,
        online: true
      }))
    });
    
    console.log("🚫 Pusher kick user:", userId);
    res.json({ success: true, message: "Đã kick user " + userId });
  } else {
    res.status(400).json({ success: false, error: "Thiếu user ID" });
  }
});

// API tặng màu cho user real-time
app.post("/pusher/gift-color", requireAdminApi, (req, res) => {
  if (!pusher) return res.status(503).json({ success: false, error: "PUSHER_NOT_CONFIGURED" });
  const userId = req.body?.id;
  const colorId = req.body?.colorId;
  const colorName = typeof req.body?.colorName === "string"
    ? req.body.colorName.slice(0, 80)
    : "Màu đặc biệt";
  if (
    typeof userId !== "string" ||
    !isValidUsername(userId) ||
    !(typeof colorId === "string" || typeof colorId === "number") ||
    String(colorId).length > 80
  ) {
    return res.status(400).json({ success: false, error: "INVALID_GIFT" });
  }
  
  if (userId && colorId) {
    // Gửi thông báo tặng màu realtime đến user cụ thể
    pusher.trigger("user-" + userId, "gift-color", {
      id: userId,
      colorId: colorId,
      colorName: colorName,
      message: `Bạn đã nhận được ${colorName} từ admin!`,
      timestamp: Date.now()
    });
    
    console.log("🎁 Pusher gift color:", colorId, "to user:", userId);
    res.json({ success: true, message: `Đã tặng ${colorName} cho ${userId}` });
  } else {
    res.status(400).json({ success: false, error: "Thiếu user ID hoặc color ID" });
  }
});

// API lấy danh sách user online
app.get("/pusher/users", requireAdminApi, (req, res) => {
  res.json({
    users: Object.entries(pusherUsers).map(([id, data]) => ({
      id,
      username: data.username,
      lastSeen: data.lastSeen
    })),
    count: Object.keys(pusherUsers).length
  });
});

app.post("/pusher/auth", requireAdminApi, (req, res) => {
  if (!pusher) return res.status(503).json({ error: "PUSHER_NOT_CONFIGURED" });
  const { socket_id: socketId, channel_name: channelName } = req.body || {};
  if (typeof socketId !== "string" || typeof channelName !== "string" || channelName !== "private-admin-channel") {
    return res.status(400).json({ error: "INVALID_PUSHER_AUTH_REQUEST" });
  }
  return res.json(pusher.authenticate(socketId, channelName));
});

// Start server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("🚀 Server Tro Ly Ao đang chạy ở port", PORT);
  console.log("📡 Socket.IO ready for connections");
  console.log("🤖 AI Chat endpoint: /chat");
});
