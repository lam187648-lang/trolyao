# Tro Ly Ao - Backend Server

Backend server cho ứng dụng Chatbot hỗ trợ học tập.

## 🚀 Deploy lên Render

### Bước 1: Tạo Web Service trên Render
1. Vào [render.com](https://render.com) → Create New → Web Service
2. Connect GitHub repo của bạn
3. Chọn folder `server` làm root directory

### Bước 2: Cấu hình Build & Start
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Bước 3: Thêm Environment Variables
Trong Render Dashboard → Environment → Add:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
```

Lấy API key từ: https://openrouter.ai/keys

### Bước 4: Deploy
Click "Create Web Service" → Wait for build ✅

## 🔗 Cập nhật Frontend

Trong `app.js`, cập nhật URL server:

```javascript
const RENDER_SERVER_URL = "https://your-app-name.onrender.com";
```

## 📁 Cấu trúc Server

```
server/
├── server.js       # Main server file
├── package.json    # Dependencies
├── .env.example    # Environment template
└── README.md       # This file
```

## 🛠️ API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | Health check |
| `/health` | GET | Server status |
| `/chat` | POST | AI chat with OpenRouter |

## 📡 Socket.IO Events

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `join` | Client → Server | User đăng nhập |
| `users` | Server → Client | Danh sách user online |
| `kick` | Client → Server | Kick user |
| `kicked` | Server → Client | Bị kick |
| `disconnect` | Auto | User ngắt kết nối |

## 🔒 Bảo mật

- AI API key chỉ nằm ở server (ENV)
- Frontend KHÔNG chứa API key
- CORS được cấu hình chỉ cho phép GitHub Pages

## 🐛 Troubleshooting

### Lỗi "Missing OPENROUTER_API_KEY"
→ Thêm ENV variable `OPENROUTER_API_KEY` trong Render Dashboard

### Lỗi CORS
→ Kiểm tra `origin` trong `corsOptions` khớp với GitHub Pages URL

### 2 máy không thấy nhau
→ Check console có `"✅ Socket connected"` không
→ Check Render logs có `"User joined"` không

## 📞 Hỗ trợ

Tạo issue trên GitHub nếu cần giúp đỡ!
