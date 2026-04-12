const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// Dynamic import for node-fetch v3 (ES module)
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

const app = express();
const server = http.createServer(app);

// CORS configuration - Allow GitHub Pages and localhost
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "https://lam187648.github.io", // GitHub Pages domain
    "https://*.github.io", // All GitHub Pages
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
      "https://*.github.io",
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json({ limit: "15mb" }));

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
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid payload: messages must be a non-empty array" });
    }

    const payload = {
      model: body.model || OPENROUTER_MODEL,
      messages,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.55,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2200
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
      console.error("❌ OpenRouter error:", data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Chat response received");
    res.json(data);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: err.message });
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
      isAdmin: user.isAdmin || false,
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

// Start server
const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("🚀 Server Tro Ly Ao đang chạy ở port", PORT);
  console.log("📡 Socket.IO ready for connections");
  console.log("🤖 AI Chat endpoint: /chat");
});
