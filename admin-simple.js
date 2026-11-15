// Admin management is intentionally disabled.
// The previous implementation trusted a password embedded in browser code
// and changed only localStorage, so it did not provide real access control.
(() => {
  const root = document.querySelector(".admin-container");
  const modal = document.getElementById("password-modal");
  if (modal) modal.remove();
  if (!root) return;

  root.replaceChildren();
  const panel = document.createElement("section");
  panel.style.cssText = "max-width:640px;margin:12vh auto;padding:32px;border:1px solid rgba(125,211,252,.25);border-radius:22px;background:#0b1a2b;color:#e8f3ff;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.35)";
  const title = document.createElement("h1");
  title.textContent = "🔒 Quản trị đang tạm khóa";
  const message = document.createElement("p");
  message.textContent = "Trang quản trị cũ sử dụng mật khẩu lưu trong mã trình duyệt và dữ liệu chỉ nằm trên thiết bị. Để bảo vệ tài khoản, các thao tác quản trị đã được tắt cho đến khi hệ thống xác thực phía máy chủ được triển khai.";
  message.style.cssText = "line-height:1.7;color:#b8cce0";
  const link = document.createElement("a");
  link.href = "index.html";
  link.textContent = "← Quay lại Trợ Lý Ảo";
  link.style.cssText = "display:inline-block;margin-top:18px;padding:11px 18px;border-radius:12px;background:#0284c7;color:white;text-decoration:none";
  panel.append(title, message, link);
  root.appendChild(panel);
})();
