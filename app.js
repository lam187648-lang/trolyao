const OPENROUTER_API_KEY = "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";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_SITE_URL = globalThis.location?.origin || "http://localhost:5500";

let aiReady = false;
const conversationHistory = [];

const chatBody = document.getElementById("chat-body");
const input = document.getElementById("user-input");
const imageInput = document.getElementById("image-input");
const sendBtn = document.getElementById("send-btn");
const uploadBtn = document.getElementById("upload-btn");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileRemove = document.getElementById("file-remove");
const themeToggle = document.getElementById("theme-toggle");
const quickTags = document.getElementById("quick-tags");

function createMessageWrapper(sender) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}-wrapper`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = sender === "bot" ? "🤖" : "👤";

  wrapper.appendChild(avatar);
  return wrapper;
}

function addMessage(text, sender, isHtml = false) {
  const wrapper = createMessageWrapper(sender);

  const div = document.createElement("div");
  div.className = `message ${sender}`;

  if (isHtml) {
    div.innerHTML = text;
  } else {
    div.textContent = text;
  }

  wrapper.appendChild(div);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;

  if (globalThis.MathJax?.typesetPromise) {
    globalThis.MathJax.typesetPromise([div]).catch(() => {});
  }
  return wrapper;
}

function addTypingIndicator() {
  const wrapper = createMessageWrapper("bot");
  wrapper.id = "typing-indicator";

  const div = document.createElement("div");
  div.className = "message bot typing-indicator";
  div.innerHTML = "<span></span><span></span><span></span>";

  wrapper.appendChild(div);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
  return wrapper;
}

function removeTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}

function setSendingState(isSending) {
  sendBtn.disabled = isSending;
  uploadBtn.disabled = isSending;
  input.disabled = isSending;
  imageInput.disabled = isSending;
  sendBtn.textContent = isSending ? "..." : "Gửi ➤";
}

function normalizeAssistantContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text || "";
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function applyThemeFromStorage() {
  const saved = localStorage.getItem("theme");
  let isDark;
  if (saved === "dark") {
    isDark = true;
  } else if (saved === "light") {
    isDark = false;
  } else {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.body.classList.toggle("dark", isDark);
  themeToggle.textContent = isDark ? "☀️" : "🌙";
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
}

const THEME_TOGGLE_POS_KEY = "themeTogglePos";
const THEME_TOGGLE_DRAG_THRESHOLD = 10;

function clampThemeTogglePosition(left, top) {
  const rect = themeToggle.getBoundingClientRect();
  const w = rect.width || themeToggle.offsetWidth || 48;
  const h = rect.height || themeToggle.offsetHeight || 48;
  const maxL = Math.max(0, window.innerWidth - w);
  const maxT = Math.max(0, window.innerHeight - h);
  return {
    left: Math.min(Math.max(0, left), maxL),
    top: Math.min(Math.max(0, top), maxT)
  };
}

function persistThemeTogglePosition() {
  const left = parseFloat(themeToggle.style.left);
  const top = parseFloat(themeToggle.style.top);
  if (Number.isFinite(left) && Number.isFinite(top)) {
    localStorage.setItem(THEME_TOGGLE_POS_KEY, JSON.stringify({ left, top }));
  }
}

function applyStoredThemeTogglePosition() {
  const raw = localStorage.getItem(THEME_TOGGLE_POS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const left = Number(parsed?.left);
    const top = Number(parsed?.top);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    requestAnimationFrame(() => {
      const c = clampThemeTogglePosition(left, top);
      themeToggle.style.setProperty("left", `${c.left}px`);
      themeToggle.style.setProperty("top", `${c.top}px`);
      themeToggle.style.setProperty("right", "auto");
      themeToggle.style.setProperty("bottom", "auto");
    });
  } catch {
    /* ignore */
  }
}

function initThemeToggleDrag() {
  let pointerId = null;
  let startClientX = 0;
  let startClientY = 0;
  let originLeft = 0;
  let originTop = 0;
  let dragging = false;
  let suppressClick = false;

  const ensurePixelPosition = () => {
    const r = themeToggle.getBoundingClientRect();
    if (!themeToggle.style.left || !themeToggle.style.top) {
      const c = clampThemeTogglePosition(r.left, r.top);
      themeToggle.style.setProperty("left", `${c.left}px`);
      themeToggle.style.setProperty("top", `${c.top}px`);
      themeToggle.style.setProperty("right", "auto");
      themeToggle.style.setProperty("bottom", "auto");
    }
    return {
      left: parseFloat(themeToggle.style.left),
      top: parseFloat(themeToggle.style.top)
    };
  };

  themeToggle.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    pointerId = event.pointerId;
    dragging = false;
    suppressClick = false;
    startClientX = event.clientX;
    startClientY = event.clientY;
    const pos = ensurePixelPosition();
    originLeft = pos.left;
    originTop = pos.top;
    themeToggle.setPointerCapture(pointerId);
  });

  themeToggle.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    const dx = event.clientX - startClientX;
    const dy = event.clientY - startClientY;
    if (!dragging) {
      if (Math.abs(dx) < THEME_TOGGLE_DRAG_THRESHOLD && Math.abs(dy) < THEME_TOGGLE_DRAG_THRESHOLD) {
        return;
      }
      dragging = true;
      suppressClick = true;
      themeToggle.classList.add("is-dragging");
    }
    event.preventDefault();
    const c = clampThemeTogglePosition(originLeft + dx, originTop + dy);
    themeToggle.style.setProperty("left", `${c.left}px`);
    themeToggle.style.setProperty("top", `${c.top}px`);
    themeToggle.style.setProperty("right", "auto");
    themeToggle.style.setProperty("bottom", "auto");
  });

  const endPointer = (event) => {
    if (pointerId !== event.pointerId) return;
    if (themeToggle.hasPointerCapture(event.pointerId)) {
      themeToggle.releasePointerCapture(event.pointerId);
    }
    pointerId = null;
    themeToggle.classList.remove("is-dragging");
    if (dragging) {
      persistThemeTogglePosition();
    }
    dragging = false;
  };

  themeToggle.addEventListener("pointerup", endPointer);
  themeToggle.addEventListener("pointercancel", endPointer);

  themeToggle.addEventListener("click", (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }
    toggleTheme();
  });

  window.addEventListener(
    "resize",
    () => {
      if (!themeToggle.style.left || !themeToggle.style.top) return;
      const c = clampThemeTogglePosition(
        parseFloat(themeToggle.style.left),
        parseFloat(themeToggle.style.top)
      );
      themeToggle.style.setProperty("left", `${c.left}px`);
      themeToggle.style.setProperty("top", `${c.top}px`);
      persistThemeTogglePosition();
    },
    { passive: true }
  );
}

async function initAI() {
  const systemInstruction = `
Bạn là trợ lý học tập có tư duy logic cao, ưu tiên tiếng Việt.

Nguyên tắc trả lời:
1) Luôn phân tích kỹ trong nội bộ trước khi trả lời, nhưng KHÔNG được lộ quá trình suy luận thô.
2) Nếu đề mơ hồ hoặc thiếu dữ kiện, chỉ hỏi lại tối đa 1-2 câu ngắn, đúng trọng tâm.
3) Trả lời bằng văn phong tự nhiên, mạch lạc, không chia mục cứng kiểu "Hiểu đề", "Phân tích", "Kiểm tra nhanh" trừ khi người dùng yêu cầu.
4) Giải thích ngắn gọn nhưng đủ logic; ưu tiên kết luận rõ ràng, sau đó nêu lý do chính.
5) Với bài tập cần từng bước, trình bày các bước gọn và liền mạch, tránh lặp ý.
6) Không dùng câu rời rạc gây ngắt quãng; giữ nhịp đọc trơn tru, dễ hiểu.

Quy tắc theo loại câu hỏi:
- Toán/Lý/Hóa: giải từng bước, có công thức và diễn giải.
- Lập trình: nêu nguyên nhân lỗi, cách sửa, ví dụ ngắn, cách test lại.
- Câu hỏi kiến thức: trả lời có cấu trúc, ngắn gọn nhưng đủ ý.
`;

  conversationHistory.length = 0;
  conversationHistory.push({
    role: "system",
    content: systemInstruction
  });

  const key = String(OPENROUTER_API_KEY || "").trim();
  aiReady = key.length > 0 && key !== "YOUR_OPENROUTER_API_KEY";

  // Welcome message
  addMessage("Chào bạn! Mình là trợ lý học tập AI. Bạn có thể hỏi bài tập, nhờ giải thích khái niệm, hoặc gửi ảnh để phân tích. Hãy thử chọn một chủ đề phía trên nhé!", "bot");

  if (!aiReady) {
    addMessage("Lưu ý: Bạn chưa cấu hình OpenRouter API key trong app.js.", "bot");
  }
}

// File upload handling
uploadBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) {
    fileName.textContent = file.name;
    fileInfo.classList.remove("hidden");
  } else {
    fileInfo.classList.add("hidden");
  }
});

fileRemove.addEventListener("click", () => {
  imageInput.value = "";
  fileInfo.classList.add("hidden");
  fileName.textContent = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);
applyThemeFromStorage();
applyStoredThemeTogglePosition();
initThemeToggleDrag();
initAI();

if (quickTags) {
  quickTags.addEventListener("click", (event) => {
    const target = event.target.closest(".tag-btn");
    if (!target) return;
    const preset = target.dataset.text || "";
    input.value = preset;
    input.focus();
  });
}

async function sendMessage() {
  let text = input.value.trim();
  const file = imageInput.files?.[0] ?? null;

  if (!text && !file) return;

  text = text.replace(/\^/g, " mũ ");

  if (text) addMessage(text, "user");

  if (file) {
    const url = URL.createObjectURL(file);
    addMessage(`<img src="${url}" alt="Ảnh người dùng tải lên">`, "user", true);
  }

  input.value = "";
  imageInput.value = "";
  fileInfo.classList.add("hidden");
  fileName.textContent = "";
  setSendingState(true);

  const thinkingEl = addTypingIndicator();

  try {
    if (!aiReady) {
      throw new Error("AI_NOT_READY");
    }
    let userContent;
    if (file) {
      const base64 = await getBase64(file);
      userContent = [
        {
          type: "text",
          text: text || "Phân tích nội dung trong ảnh và trả lời theo cấu trúc logic."
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${base64}`
          }
        }
      ];
    } else {
      userContent = text;
    }

    const userMessage = {
      role: "user",
      content: userContent
    };

    const messages = [...conversationHistory, userMessage];
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-Title": "Chatbot Ho Tro Hoc Tap"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.55,
        max_tokens: 2200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OPENROUTER_${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawReply = data?.choices?.[0]?.message?.content;
    const reply = normalizeAssistantContent(rawReply) || "Mình chưa tạo được câu trả lời. Bạn thử lại nhé.";

    conversationHistory.push(userMessage);
    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    removeTypingIndicator();
    addMessage(reply, "bot");

  } catch (err) {
    console.error(err);
    removeTypingIndicator();

    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("ai_not_ready")) {
      addMessage("AI chưa sẵn sàng. Hãy thêm OpenRouter API key vào app.js.", "bot");
    } else if (msg.includes("401") || msg.includes("api key") || msg.includes("permission")) {
      addMessage("API key OpenRouter không hợp lệ hoặc chưa có quyền truy cập model.", "bot");
    } else if (msg.includes("quota") || msg.includes("429")) {
      addMessage("Đã hết quota hoặc bị giới hạn tần suất từ OpenRouter. Bạn thử lại sau.", "bot");
    } else {
      addMessage("Không gửi được câu hỏi tới OpenRouter. Bạn mở F12 để xem lỗi chi tiết.", "bot");
    }
  } finally {
    setSendingState(false);
  }
}
