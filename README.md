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
git push origin master
```

**Bước 2:** Enable GitHub Pages
1. Vào repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: master / root
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
| 🎁 Gifting | Tạm khóa cho đến khi có phân quyền phía máy chủ |
| 📚 Study Room | Phòng học nhóm real-time |
| 👑 Admin Panel | Tạm khóa để tránh quản trị trái phép từ trình duyệt |
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
- ⚠️ Tài khoản hiện vẫn lưu ở localStorage, mật khẩu Base64; chưa phải xác thực an toàn
- ⚠️ Token và vật phẩm vẫn do trình duyệt quản lý, chưa chống được sửa dữ liệu
- ✅ API chat có giới hạn tốc độ, kiểm tra dữ liệu đầu vào và model do server kiểm soát
- ✅ Các thao tác quản trị không xác thực đã bị khóa

## ⚠️ Trạng thái bảo mật hiện tại

Không dùng lại mật khẩu quan trọng trên phiên bản hiện tại. Muốn mở lại tài khoản đa thiết bị, token có giá trị tin cậy và trang quản trị cần cấu hình PostgreSQL (hoặc database bền vững khác), hash mật khẩu ở server và phiên đăng nhập có chữ ký. Secret Pusher cũ từng bị lộ trong lịch sử Git; phải thu hồi/rotate tại Pusher Dashboard, không chỉ xóa khỏi file hiện tại.

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

MIT © 2025 nguyenvietlam team
