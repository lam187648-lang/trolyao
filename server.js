const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Dynamic import for node-fetch v3 (ES module)
let fetch;
(async () => {
  fetch = (await import("node-fetch")).default;
})();

const app = express();
const server = http.createServer(app);
app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = new Set([
  "https://lam187648-lang.github.io",
  "http://localhost:5500",
  "http://localhost:3000",
  "http://127.0.0.1:5500"
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "8mb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

const io = new Server(server, {
  cors: {
    origin: [...allowedOrigins],
    methods: ["GET", "POST"]
  }
});
app.set("io", io);

const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "https://lam187648-lang.github.io/trolyao/";

const chatRateBuckets = new Map();
function chatRateLimit(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const bucket = chatRateBuckets.get(key) || { count: 0, resetAt: now + 60_000 };
  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60_000;
  }
  bucket.count += 1;
  chatRateBuckets.set(key, bucket);
  if (chatRateBuckets.size > 5000) {
    for (const [ip, value] of chatRateBuckets) {
      if (now >= value.resetAt) chatRateBuckets.delete(ip);
    }
  }
  if (bucket.count > 12) {
    return res.status(429).json({ error: "Bạn gửi yêu cầu quá nhanh. Vui lòng đợi một phút rồi thử lại." });
  }
  next();
}

app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("Server Trợ Lý Ảo đang chạy.");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.post("/chat", chatRateLimit, async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(503).json({ error: "Máy chủ chưa được cấu hình khóa AI." });
    }
    if (!fetch) fetch = (await import("node-fetch")).default;

    const messages = req.body?.messages;
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

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": "Tro Ly Ao Chatbot"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: safeMessages,
        temperature: 0.55,
        max_tokens: 1800
      })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(502).json({ error: "Dịch vụ AI trả về phản hồi không hợp lệ." });
    }

    if (!response.ok) {
      console.error("OpenRouter upstream status:", response.status);
      return res.status(502).json({ error: "Dịch vụ AI hiện chưa phản hồi được. Vui lòng thử lại sau." });
    }
    return res.json(data);
  } catch (error) {
    console.error("Chat request failed:", error?.name || "Error");
    return res.status(500).json({ error: "Máy chủ gặp lỗi khi xử lý yêu cầu." });
  }
});

let users = [];
io.on("connection", (socket) => {
  socket.emit("users", users);
  socket.emit("study-room:users", users);

  socket.on("join", (user) => {
    if (!user || typeof user.username !== "string" || !/^[\p{L}\p{N}_-]{2,24}$/u.test(user.username)) return;
    const username = user.username;
    const safeAvatar = typeof user.avatar === "string" && (user.avatar.startsWith("data:image/") || user.avatar.startsWith("http") || user.avatar.length < 500000)
      ? user.avatar
      : "";
    const safeTheme = typeof user.selectedColorTheme === "string" ? user.selectedColorTheme : "1";
    const safeStudyTime = Number(user.studyTime) || 0;

    users = users.filter((entry) => entry.username !== username);
    users.push({
      id: socket.id,
      username,
      avatar: safeAvatar,
      selectedColorTheme: safeTheme,
      studyTime: safeStudyTime,
      isAdmin: false,
      joinTime: Date.now()
    });
    io.emit("users", users);
    io.emit("study-room:users", users);
  });

  socket.on("study-room:update-profile", (data) => {
    const entry = users.find(u => u.id === socket.id);
    if (!entry) return;
    if (typeof data?.avatar === "string" && (data.avatar.startsWith("data:image/") || data.avatar.startsWith("http") || data.avatar.length < 500000)) {
      entry.avatar = data.avatar;
    }
    if (typeof data?.selectedColorTheme === "string") {
      entry.selectedColorTheme = data.selectedColorTheme;
    }
    if (Number.isFinite(data?.studyTime)) {
      entry.studyTime = Number(data.studyTime);
    }
    io.emit("users", users);
    io.emit("study-room:users", users);
  });

  socket.on("study-room:leave", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
    io.emit("study-room:users", users);
  });

  // Admin actions stay disabled until a real server-side session/role system exists.
  socket.on("kick", () => socket.emit("admin-action-disabled", {
    message: "Chức năng quản trị vui lòng thực hiện qua Trang Quản Trị."
  }));

  socket.on("disconnect", () => {
    users = users.filter((entry) => entry.id !== socket.id);
    io.emit("users", users);
    io.emit("study-room:users", users);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log("Trợ Lý Ảo backend đang chạy ở port", PORT);
});
