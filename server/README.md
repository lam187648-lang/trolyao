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
OPENROUTER_API_KEY=your_new_openrouter_key
OPENROUTER_MODEL=openai/gpt-4o-mini
# Chỉ bật Pusher khi đã tạo secret mới và cấu hình đủ cả 4 biến:
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_public_key
PUSHER_SECRET=your_new_secret
PUSHER_CLUSTER=your_cluster
```

Lấy API key từ: https://openrouter.ai/keys

**Quan trọng:** Secret Pusher cũ từng xuất hiện trong mã nguồn. Hãy thu hồi/rotate secret đó trong Pusher Dashboard ngay; không tái sử dụng secret cũ và không commit secret mới lên GitHub. Chỉ nhập secret mới trực tiếp vào Render Environment. Nếu chưa cấu hình đủ 4 biến Pusher, tính năng realtime sẽ tự tắt.

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
| `kick` | — | Tạm vô hiệu hóa; cần xác thực admin phía server trước khi bật |
| `disconnect` | Auto | User ngắt kết nối |

## 🔒 Bảo mật

- AI API key chỉ nằm ở server (ENV)
- Frontend KHÔNG chứa API key
- CORS giới hạn theo origin GitHub Pages và localhost phát triển
- Không lưu Pusher secret trong mã nguồn; Pusher tự tắt nếu thiếu ENV
- Endpoint quản trị kick/tặng màu bị khóa khi chưa có xác thực server-side
- Không tin cậy cờ isAdmin do trình duyệt gửi lên
- Chat giới hạn số lượng, độ dài tin nhắn và model/token do server kiểm soát

## 🐛 Troubleshooting

### Lỗi "Missing OPENROUTER_API_KEY"
→ Thêm ENV variable `OPENROUTER_API_KEY` trong Render Dashboard

### Lỗi CORS
→ Kiểm tra `origin` trong `corsOptions` khớp với GitHub Pages URL

### Pusher chưa hoạt động
→ Kiểm tra đủ 4 biến PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER trong Render Environment.

### 2 máy không thấy nhau
→ Check console có `"✅ Socket connected"` không
→ Check Render logs có `"User joined"` không

## 📞 Hỗ trợ

Tạo issue trên GitHub nếu cần giúp đỡ!


## Giới hạn bảo mật còn lại — cần hoàn tất trước khi dùng tài khoản thật

- Đăng ký/đăng nhập hiện vẫn lưu dữ liệu và mật khẩu dạng Base64 trong localStorage. Đây không phải xác thực an toàn; không dùng mật khẩu quan trọng hoặc dữ liệu cá nhân trên hệ thống hiện tại.
- Số dư token, màu đã mua và phần thưởng vẫn do trình duyệt quản lý, nên không thể chống sửa dữ liệu từ DevTools.
- Quản trị, kick, cấp token và các trang quản lý cũ đã bị khóa để tránh giả mạo quyền từ trình duyệt.
- Muốn mở lại tài khoản và quản trị đúng chuẩn cần một cơ sở dữ liệu bền vững (ví dụ PostgreSQL), mật khẩu băm Argon2/bcrypt, phiên đăng nhập phía máy chủ và kiểm tra quyền ở từng API. Chưa tự tạo database hoặc thay đổi dữ liệu tài khoản vì cần cấu hình dịch vụ lưu trữ riêng.
- Pusher secret cũ đã từng nằm trong lịch sử Git. Xóa khỏi nhánh mới không xóa được lịch sử cũ: phải thu hồi/rotate secret trong Pusher Dashboard. Không gửi secret mới qua chat hoặc commit vào Git.
