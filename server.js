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
const io = new Server(server, {
  cors: { origin: "*" }
});

// 👇 PHẢI ĐẶT TRƯỚC TẤT CẢ ROUTE
const corsOptions = {
  origin: true, // Cho phép semua origin
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));

// 👇 BẮT BUỘC cho preflight
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "15mb" }));

const API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "http://localhost:5500";

app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("Server chatbot đang chạy OK 🚀");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/chat", async (req, res) => {
  try {
    // Ensure fetch is available
    if (!fetch) {
      fetch = (await import('node-fetch')).default;
    }
    
    if (!API_KEY) {
      return res.status(500).json({
        error: "Missing OPENROUTER_API_KEY",
        hint: "Đặt biến môi trường OPENROUTER_API_KEY trên host (ví dụ Render → Environment)."
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

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": "Chatbot"
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
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO event handlers
let users = [];

io.on("connection", (socket) => {

  socket.on("join", (user) => {
    const newUser = {
      id: socket.id,
      username: user.username,
      isAdmin: user.isAdmin || false
    };

    users.push(newUser);

    io.emit("users", users);
  });

  socket.on("kick", (username) => {
    const user = users.find(u => u.username === username);

    if (user) {
      io.to(user.id).emit("kicked"); // kick đúng người
      users = users.filter(u => u.username !== username);
      io.emit("users", users);
    }
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit("users", users);
  });

});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log("Server chạy ở port", PORT);
});
