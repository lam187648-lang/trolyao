import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
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

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Server chạy (port ${port})`));
