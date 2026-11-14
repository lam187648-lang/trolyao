const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Pusher = require("pusher");

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

// CORS configuration - Allow GitHub Pages and localhost
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://lam187648.github.io" // GitHub Pages origin only
  ],
  methods: ["GET", "POST", "OPTIONS"],
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
      "https://lam187648.github.io",
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
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "https://lam187648.github.io/troly";

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
    for (const message of messages) {
      if (!message || !["user", "assistant"].includes(message.role) ||
          !(typeof message.content === "string" || Array.isArray(message.content)) ||
          JSON.stringify(message.content).length > 12000) {
        return res.status(400).json({ error: "Nội dung tin nhắn không hợp lệ hoặc quá dài." });
      }
      safeMessages.push({ role: message.role, content: message.content });
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
    console.error("❌ Server error:", err);
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
    console.log("👤 User joined:", user.username);
    
    // Remove existing user with same username
    users = users.filter(u => u.username !== user.username);
    
    const newUser = {
      id: socket.id,
      username: user.username,
      isAdmin: false,
      joinTime: Date.now()
    };

    users.push(newUser);
    
    // Broadcast updated user list to all clients
    io.emit("users", users);
  });

  // Handle kick user
  socket.on("kick", (username) => {
    console.log("🚫 Kick user:", username);
    const user = users.find(u => u.username === username);

    if (user) {
      io.to(user.id).emit("kicked"); // Send kick event to specific user
      users = users.filter(u => u.username !== username);
      io.emit("users", users); // Broadcast updated list
    }
  });

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
  pusher.trigger("admin-channel", "user-update", {
    users: Object.entries(pusherUsers).map(([id, data]) => ({ id, username: data.username, online: true }))
  }).catch(() => {});
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

// Start server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("🚀 Server Tro Ly Ao đang chạy ở port", PORT);
  console.log("📡 Socket.IO ready for connections");
  console.log("🤖 AI Chat endpoint: /chat");
});
