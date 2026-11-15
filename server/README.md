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
- **Root Directory**: `server`

### Bước 3: Thêm Environment Variables
Thêm các biến cần dùng trực tiếp trong Render Dashboard → Environment. Không đưa giá trị bí mật vào GitHub:

- `OPENROUTER_API_KEY` — bắt buộc để dùng chat AI.
- `DATABASE_URL` — PostgreSQL connection string; tài khoản và API quản trị trả `503 DATABASE_NOT_CONFIGURED` nếu chưa thiết lập.
- `DB_DIAGNOSTIC_SECRET` — secret ngẫu nhiên tối thiểu 32 ký tự để gọi riêng `GET /admin/db-diagnostic`; endpoint trả `401` nếu biến thiếu hoặc secret sai.
- `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL` — tùy chọn.
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` — chỉ cần nếu bật Pusher.

Mẫu tên biến (không chứa bí mật) ở [`.env.example`](.env.example). Lấy OpenRouter key tại https://openrouter.ai/keys.

**Quan trọng:** Secret Pusher cũ từng xuất hiện trong mã nguồn. Hãy thu hồi/rotate secret đó trong Pusher Dashboard ngay; không tái sử dụng secret cũ và không commit secret mới lên GitHub. Chỉ nhập secret mới trực tiếp vào Render Environment. Nếu chưa cấu hình đủ 4 biến Pusher, tính năng realtime sẽ tự tắt.

Khi chưa có `DATABASE_URL`, `/auth/status` báo rõ database chưa cấu hình và frontend không tạo tài khoản cục bộ mới. Tài khoản LocalStorage cũ vẫn được giữ; nếu đăng nhập theo chế độ cũ, dữ liệu đó chỉ là dữ liệu cục bộ, không có giá trị phân quyền hoặc số dư trên server.

### Chẩn đoán PostgreSQL

1. Tạo secret ngẫu nhiên 32 byte trên máy quản trị, ví dụ `openssl rand -base64 32`. Đặt kết quả vào biến `DB_DIAGNOSTIC_SECRET` trong Render Dashboard → Web Service → Environment, rồi deploy/restart service. Không đưa secret vào Git, query string, ảnh chụp màn hình hoặc chat.
2. Đặt cùng secret vào biến môi trường của terminal quản trị hoặc secret manager cục bộ, rồi gọi endpoint bằng header (không truyền secret trong URL):

```sh
curl --fail-with-body --silent --show-error \
  -H "X-DB-Diagnostic-Secret: ${DB_DIAGNOSTIC_SECRET}" \
  https://trolyao-1.onrender.com/admin/db-diagnostic
```

PowerShell có thể dùng `curl.exe -H "X-DB-Diagnostic-Secret: $env:DB_DIAGNOSTIC_SECRET" https://trolyao-1.onrender.com/admin/db-diagnostic`.

Endpoint chỉ đọc `information_schema.tables` và marker `001_initial_schema`; phản hồi chỉ gồm trạng thái kết nối/bảng/migration, danh sách tên bảng thiếu và mã lỗi PostgreSQL. Secret thiếu/sai trả `401`. Endpoint không tạo bảng, chạy migration hay đọc dữ liệu tài khoản. Sau khi chẩn đoán xong, xóa `DB_DIAGNOSTIC_SECRET` khỏi Render Environment và deploy/restart để đóng endpoint.

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

## 🗄️ PostgreSQL

1. Tạo PostgreSQL trên Render và sao lưu database hiện có (nếu có) trước khi thay đổi schema.
2. Thêm `DATABASE_URL` vào Environment của Web Service backend; không đặt biến này ở frontend/GitHub Pages.
3. Trong thư mục `server`, cài dependency bằng `npm install`, sau đó chỉ chạy migration có chủ đích bằng `npm run db:migrate`.
4. Chỉ sau khi đã truy vấn read-only và xác minh UUID của đúng tài khoản `lam`, mới cân nhắc chạy script cấp quyền riêng. Script chỉ cập nhật `role`, không tạo tài khoản và không thay đổi mật khẩu.
5. Triển khai backend trước frontend. `/health` báo `database: "not_configured"` khi thiếu `DATABASE_URL`; không có dữ liệu giả hoặc migration tự chạy lúc khởi động.

Khi backend khởi động với `DATABASE_URL`, server chạy `SELECT NOW()` để kiểm tra kết nối. Log thành công xác nhận database đã kết nối; nếu kiểm tra thất bại, lỗi được ghi bằng mã lỗi không kèm thông tin xác thực và backend vẫn tiếp tục chạy. SSL được bật trong môi trường production với `rejectUnauthorized: false` để tương thích kết nối PostgreSQL của Render.

Migration `001_initial_schema` chỉ tạo bảng và index; runner dùng transaction và ghi nhận migration đã áp dụng. Không chạy trước khi database và backup sẵn sàng.

### Trang quản trị và cấp quyền Admin

Trang `/admin/` trên GitHub Pages chuyển tới `admin-panel.html`. Dashboard luôn xác thực session với backend và chỉ hiển thị dữ liệu khi `/auth/me` xác nhận `role: "admin"`; không dùng vai trò từ LocalStorage hoặc frontend làm căn cứ phân quyền. Lệnh `/admin` và liên kết Quản trị mở cùng trang có bảo vệ này.

#### Xác minh UUID (chỉ đọc)

Script `scripts/identify-admin-target.js` chạy duy nhất câu `SELECT id, username FROM users WHERE username = $1` với `lam` chính xác. Script dừng lỗi nếu không có bản ghi hoặc có nhiều hơn một bản ghi, và chỉ in `id` cùng `username`; không đọc password hash, mật khẩu hay session token.

Trên Windows PowerShell, trong terminal quản trị tin cậy đã được cấu hình `DATABASE_URL`:

```powershell
Set-Location 'C:\path\to\trolyao-master\server'
if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw 'Set DATABASE_URL in this trusted shell before running the read-only lookup.'
}
npm run admin:identify
```

Kết quả thành công chỉ có dạng `{"id":"<UUID>","username":"lam"}`. Không ghi `DATABASE_URL` vào mã nguồn hoặc gửi qua chat. Lệnh này chỉ đọc và không thay đổi production.

#### Cấp quyền Admin riêng (chưa chạy)

Không chạy bước này cho tới khi UUID phía trên đã được xác minh. Khi có quyết định cấp quyền, trong môi trường quản trị tin cậy dùng đúng UUID đó:

```powershell
Set-Location 'C:\path\to\trolyao-master\server'
$env:ADMIN_PROMOTION_USER_ID = '<UUID just verified by admin:identify>'
npm run admin:promote
Remove-Item Env:ADMIN_PROMOTION_USER_ID
```

Script mở transaction, khóa đúng hàng theo UUID và kiểm tra username `lam` trước khi cập nhật duy nhất cột `role`. Nếu tài khoản đã là Admin, script không ghi dữ liệu. Không thêm biến cấp quyền vào Render Environment lâu dài hoặc commit chúng vào Git. **Không chạy lệnh cấp quyền trong lần xác minh read-only này; tài khoản chưa được cấp quyền bởi thay đổi này.**

Nếu `/auth/status` trả `databaseConfigured: true` nhưng `migrationApplied: false`, điều đó chỉ xác nhận migration chưa được ghi nhận; **không chạy ngay** nếu database đã có bảng `users`, `sessions` hoặc `schema_migrations` nhưng chưa có marker tương ứng. Sao lưu database trước, kiểm tra schema hiện có và nhật ký Render. Khi xác nhận migration chưa từng chạy và không có bảng xung đột, mở Shell của đúng Web Service (Root Directory `server`) và chạy:

```sh
npm run db:migrate
```

Runner dùng transaction và advisory lock; nếu migration đã được ghi nhận, lệnh không chạy lại. Sau đó kiểm tra log `Applied migration 001_initial_schema.` hoặc `Migration 001_initial_schema is already applied.` và gọi lại `/auth/status`. Lệnh không xóa dữ liệu; nếu gặp lỗi bảng đã tồn tại, dừng lại để đối chiếu schema, không xóa bảng để chạy tiếp.

### Dữ liệu LocalStorage cũ

Không có dữ liệu trình duyệt nào bị xóa hoặc tự gửi lên server. Trước khi chuyển sang tài khoản server, hãy sao lưu dữ liệu trình duyệt trên từng thiết bị. Mật khẩu cũ được lưu dạng hash/Base64 không thể chuyển thành hash bcrypt đáng tin cậy; người dùng cần đăng ký tài khoản server mới và đặt mật khẩu mới. Số dư Token/màu ở LocalStorage có thể bị sửa từ trình duyệt nên không tự nhập thành số dư server đã xác thực; Admin chỉ nên cấp lại các khoản đã kiểm chứng. Dữ liệu cũ được giữ tại trình duyệt để đối chiếu thủ công.

## 🛠️ API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/` | GET | Health check |
| `/health` | GET | Server status |
| `/chat` | POST | AI chat with OpenRouter |
| `/auth/status` | GET | Trạng thái PostgreSQL và migration `001_initial_schema` |
| `/admin/db-diagnostic` | GET | Chẩn đoán chỉ đọc; yêu cầu header `X-DB-Diagnostic-Secret` |
| `/auth/register`, `/auth/login` | POST | Đăng ký/đăng nhập, bcrypt và session token |
| `/auth/me`, `/auth/logout` | GET/POST | Kiểm tra hoặc thu hồi session |
| `/api/balance`, `/api/transactions` | GET | Token cá nhân |
| `/api/study-reward` | POST | Thưởng học tập có cooldown phía server |
| `/api/themes/*` | GET/POST/PUT | Quyền màu, mua màu thường, chọn màu |
| `/admin/users`, `/admin/audit` | GET | Danh sách tài khoản và nhật ký (Admin) |
| `/admin/users/:id/*` | POST/PATCH/DELETE | Token, trạng thái, session và quyền màu (Admin) |

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
- PostgreSQL chỉ khởi tạo khi có `DATABASE_URL`; không chạy migration tự động
- Mật khẩu được băm bằng bcrypt; session token ngẫu nhiên chỉ lưu dạng hash trong database
- Quyền Admin được đọc từ database; khóa tài khoản thu hồi các session hiện có
- Token grant/spend dùng transaction và ghi lịch sử; giao dịch quản trị được audit

## 🐛 Troubleshooting

### Render chỉ hiện `Trợ Lý Ảo backend đang chạy ở port ...`
Log này được in bởi `server.js` ở thư mục gốc, entrypoint cũ không nạp PostgreSQL. Hãy đặt **Root Directory** của Render thành `server` (không để trống); Build Command `npm install`, Start Command `npm start`. Backend trong thư mục này mới gọi kiểm tra `DATABASE_URL` khi HTTP server đã lắng nghe.

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

- Frontend cũ vẫn có luồng LocalStorage và cần được chuyển sang API server trước khi bật PostgreSQL cho người dùng; không dùng luồng cũ làm căn cứ phân quyền.
- Các nút quản trị legacy ở frontend vẫn khóa; chỉ API mới có kiểm tra Admin phía server.
- Cần triển khai backend rồi kiểm thử trên database staging trước khi chuyển tài khoản thật. Chưa chạy migration vì chưa xác nhận `DATABASE_URL` và backup.
- Pusher secret cũ đã từng nằm trong lịch sử Git. Xóa khỏi nhánh mới không xóa được lịch sử cũ: phải thu hồi/rotate secret trong Pusher Dashboard. Không gửi secret mới qua chat hoặc commit vào Git.
