# 🤖 Trợ Lý Ảo - Chatbot Hỗ Trợ Học Tập

Chatbot thông minh giúp học sinh ôn tập, giải thích kiến thức và quản lý thời gian học tập.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │◄──────►│    Backend      │
│  (GitHub Pages) │  HTTP   │   (Render)      │
│                 │         │                 │
│ • HTML/CSS/JS   │         │ • Node.js       │
│ • UI/UX         │         │ • Socket.io     │
│ • LocalStorage  │         │ • AI API        │
└─────────────────┘         └─────────────────┘
```

## 🚀 Deploy

### 1. Backend (Render)

Xem chi tiết tại: [`server/README.md`](server/README.md)

```bash
cd server
# Deploy to Render.com
```

**Cần setup ENV:**
- `OPENROUTER_API_KEY` - Lấy từ https://openrouter.ai/keys

### 2. Frontend (GitHub Pages)

**Bước 1:** Push code lên GitHub
```bash
git add .
git commit -m "Update for deployment"
git push origin main
```

**Bước 2:** Enable GitHub Pages
1. Vào repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

**Bước 3:** Update server URL trong `app.js`:
```javascript
const RENDER_SERVER_URL = "https://your-render-app.onrender.com";
```

## 📁 Cấu trúc Project

```
troly/
├── 📄 index.html          # Trang chính (Chatbot)
├── 📄 auth.html           # Đăng nhập/Đăng ký
├── 📄 token-shop-new.html # Cửa hàng token
├── 📄 study-room.html     # Phòng học nhóm
├── 📄 admin-simple.html   # Admin panel
├── 📄 app.js              # Logic chính
├── 📄 style.css           # Styles
├── 📄 device-manager.js   # Quản lý thiết bị
└── 📁 server/             # Backend
    ├── server.js          # Main server
    ├── package.json
    └── README.md
```

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 🤖 AI Chat | Chat với AI hỗ trợ học tập |
| 🎨 Themes | Đổi màu giao diện bằng token |
| 🪙 Token Shop | Mua/mở khóa màu đặc biệt |
| 🎁 Gifting | Tặng màu cho người dùng khác |
| 📚 Study Room | Phòng học nhóm real-time |
| 👑 Admin Panel | Quản lý user, kick user |
| ⏱️ Token Rewards | 20 tokens/10 phút học tập |

## 🔌 Kết nối Backend

### Socket.IO (Real-time)
```javascript
// Tự động detect local/production
const SERVER_URL = location.hostname === "localhost" 
  ? "http://localhost:4000" 
  : "https://your-app.onrender.com";

const socket = io(SERVER_URL);
```

### API Chat (AI)
```javascript
const response = await fetch(`${SERVER_URL}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages })
});
```

## 🔒 Bảo mật

- ✅ AI API key chỉ ở Backend (ENV)
- ✅ Frontend KHÔNG chứa key
- ✅ CORS giới hạn chỉ GitHub Pages
- ✅ Authentication qua localStorage + server

## 🛠️ Local Development

```bash
# Terminal 1: Start backend
cd server
npm install
npm start
# Server chạy ở http://localhost:4000

# Terminal 2: Start frontend (Live Server)
# Dùng VS Code → Live Server extension
# hoặc: npx live-server --port=5500
```

## 🐛 Debug

### 2 máy không thấy nhau?

1. **Check console frontend** có `"✅ Socket connected"` không?
2. **Check Render logs** có `"👤 User joined"` không?
3. **Check URL** trong `app.js` có đúng Render URL không?

### AI không trả lời?

1. Check `OPENROUTER_API_KEY` đã set trong Render chưa
2. Check Render logs có lỗi gì không
3. Thử gọi API trực tiếp: `POST /chat`

## 📝 License

MIT © 2024 Tro Ly Ao Team
