const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Pusher = require("pusher");
const { pool, closeDatabase, checkDatabaseConnection } = require("./database");
const authRoutes = require("./auth-routes");
const adminRoutes = require("./admin-routes");
const tokenRoutes = require("./token-routes");

// Dynamic import for node-fetch v3 (ES module)
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

// Pusher is optional. Never keep credentials in source control.
const pusherConfigured = ["PUSHER_APP_ID", "PUSHER_KEY", "PUSHER_SECRET", "PUSHER_CLUSTER"]
  .every((name) => Boolean(process.env[name]));
const pusher = pusherConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true
    })
  : null;

const app = express();
const server = http.createServer(app);
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Per-instance/IP throttling for the public AI endpoint.
const chatRateBuckets = new Map();
function chatRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = chatRateBuckets.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now >= bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 60_000; }
  bucket.count += 1;
  chatRateBuckets.set(key, bucket);
  if (chatRateBuckets.size > 5000) {
    for (const [ip, value] of chatRateBuckets) if (now >= value.resetAt) chatRateBuckets.delete(ip);
  }
  if (bucket.count > 12) return res.status(429).json({ error: "Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một phút rồi thử lại." });
  next();
}

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// CORS configuration - Allow GitHub Pages and localhost
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://lam187648-lang.github.io" // GitHub Pages origin only
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "https://lam187648-lang.github.io",
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json({ limit: "8mb" }));

// Environment variables
const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "https://lam187648-lang.github.io/trolyao/";

// Health check endpoint
app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("✅ Server chatbot Tro Ly Ao đang chạy OK!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: pool ? "configured" : "not_configured"
  });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api", tokenRoutes);

// AI Chat endpoint
app.post("/chat", chatRateLimit, async (req, res) => {
  try {
    // Ensure fetch is available
    if (!fetch) {
      fetch = (await import('node-fetch')).default;
    }
    
    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY",
        hint: "Đặt biến môi trường OPENROUTER_API_KEY trên Render (Environment Variables)."
      });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
      return res.status(400).json({ error: "Tin nhắn không hợp lệ." });
    }
    const safeMessages = [];
    for (const [index, message] of messages.entries()) {
      if (!message || !["system", "user", "assistant"].includes(message.role) ||
          (message.role === "system" && index !== 0)) {
        return res.status(400).json({ error: "Nội dung tin nhắn không hợp lệ." });
      }
      if (typeof message.content === "string") {
        if (message.content.length > 12000) return res.status(400).json({ error: "Tin nhắn quá dài." });
        safeMessages.push({ role: message.role, content: message.content });
        continue;
      }
      if (message.role !== "user" || !Array.isArray(message.content) || message.content.length > 2) {
        return res.status(400).json({ error: "Định dạng nội dung không hợp lệ." });
      }
      const safeParts = [];
      for (const part of message.content) {
        if (part?.type === "text" && typeof part.text === "string" && part.text.length <= 12000) {
          safeParts.push({ type: "text", text: part.text });
        } else if (part?.type === "image_url" &&
                   typeof part.image_url?.url === "string" &&
                   /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]{1,7000000}$/.test(part.image_url.url)) {
          safeParts.push({ type: "image_url", image_url: { url: part.image_url.url } });
        } else {
          return res.status(400).json({ error: "Ảnh hoặc nội dung gửi lên không hợp lệ." });
        }
      }
      safeMessages.push({ role: message.role, content: safeParts });
    }

    const payload = {
      model: OPENROUTER_MODEL,
      messages: safeMessages,
      temperature: 0.55,
      max_tokens: 1800
    };

    console.log("🤖 Sending request to OpenRouter...");
    
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": "Tro Ly Ao Chatbot"
      },
      body: JSON.stringify(payload)
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(502).json({ error: "Upstream returned non-JSON response" });
    }

    if (!response.ok) {
      console.error("OpenRouter upstream status:", response.status);
      return res.status(502).json({ error: "Dịch vụ AI hiện chưa phản hồi được. Vui lòng thử lại sau." });
    }

    console.log("✅ Chat response received");
    res.json(data);
  } catch (err) {
    console.error("Server request failed:", err?.name || "Error");
    res.status(500).json({ error: "Máy chủ gặp lỗi khi xử lý yêu cầu." });
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
    if (!user || typeof user.username !== "string" || !/^[\p{L}\p{N}_-]{2,24}$/u.test(user.username)) return;
    const safeUsername = user.username;
    
    // Remove existing user with same username
    users = users.filter(u => u.username !== safeUsername);
    
    const newUser = {
      id: socket.id,
      username: safeUsername,
      isAdmin: false,
      joinTime: Date.now()
    };

    users.push(newUser);
    
    // Broadcast updated user list to all clients
    io.emit("users", users);
  });

  // Admin kick is disabled until a verified server-side admin session exists.
  socket.on("kick", () => socket.emit("admin-action-disabled", {
    message: "Chức năng quản trị đang tạm khóa để bảo vệ tài khoản."
  }));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
  });
});

// ========== PUSHER REAL-TIME ENDPOINTS ==========
// Public client events may announce presence only. Administrative actions
// are disabled until a server-side authentication and authorization system exists.
let pusherUsers = {};

app.post("/pusher/user-online", (req, res) => {
  if (!pusher) return res.status(503).json({ success: false, error: "Realtime service is not configured." });
  const userId = typeof req.body?.id === "string" ? req.body.id.slice(0, 80) : "";
  const username = typeof req.body?.username === "string" ? req.body.username.slice(0, 40) : userId;
  if (!userId) return res.status(400).json({ success: false, error: "Invalid user ID." });
  pusherUsers[userId] = { username, lastSeen: Date.now() };
  res.json({ success: true });
});

app.post("/pusher/user-offline", (req, res) => {
  const userId = typeof req.body?.id === "string" ? req.body.id.slice(0, 80) : "";
  if (userId) delete pusherUsers[userId];
  res.json({ success: true });
});

// Do not expose admin actions (kick/gift) through unauthenticated HTTP endpoints.
app.all(["/pusher/kick", "/pusher/gift-color", "/pusher/users"], (_req, res) => {
  res.status(403).json({ success: false, error: "Administrative access is not enabled until secure server-side authentication is configured." });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON request body không hợp lệ." });
  }
  if (error.code === "DATABASE_NOT_CONFIGURED") {
    return res.status(503).json({
      error: "PostgreSQL chưa được cấu hình. Hãy thêm DATABASE_URL trên Render.",
      code: "DATABASE_NOT_CONFIGURED"
    });
  }
  if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT"].includes(error.code) ||
      (typeof error.code === "string" && error.code.startsWith("08"))) {
    console.error("PostgreSQL is unavailable:", error.code);
    return res.status(503).json({
      error: "Không thể kết nối PostgreSQL. Hãy kiểm tra cấu hình và trạng thái database.",
      code: "DATABASE_UNAVAILABLE"
    });
  }
  console.error("Request failed:", error.code || error.name || "Error");
  res.status(500).json({ error: "Máy chủ gặp lỗi khi xử lý yêu cầu." });
});

// Start server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("🚀 Server Tro Ly Ao đang chạy ở port", PORT);
  console.log("📡 Socket.IO ready for connections");
  console.log("🤖 AI Chat endpoint: /chat");
  console.log(pool ? "🗄️ PostgreSQL is configured" : "⚠️ DATABASE_URL is missing; account and admin APIs return 503");
  void checkDatabaseConnection();
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; closing server resources.`);
  const timeout = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exitCode = 1;
  }, 15000);
  timeout.unref();

  io.close(async () => {
    try {
      await closeDatabase();
      clearTimeout(timeout);
      console.log("Server resources closed.");
    } catch (error) {
      const errorCode = error && typeof error.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
        ? error.code
        : "UNKNOWN";
      console.error("Failed to close PostgreSQL pool:", errorCode);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
