// Legacy admin dashboard disabled.
// This page previously trusted localStorage and exposed account data without
// authenticating an administrator on the server.
(() => {
  const root = document.querySelector("main") || document.body;
  root.replaceChildren();
  const panel = document.createElement("section");
  panel.style.cssText = "max-width:640px;margin:12vh auto;padding:32px;border:1px solid rgba(125,211,252,.25);border-radius:22px;background:#0b1a2b;color:#e8f3ff;text-align:center;font-family:system-ui;line-height:1.7";
  const title = document.createElement("h1");
  title.textContent = "🔒 Admin dashboard tạm khóa";
  const message = document.createElement("p");
  message.textContent = "Bảng quản trị cũ không xác thực quyền ở máy chủ. Các chức năng quản lý người dùng đã tắt để tránh truy cập trái phép.";
  const link = document.createElement("a");
  link.href = "index.html";
  link.textContent = "Quay lại trang chủ";
  link.style.color = "#7dd3fc";
  panel.append(title, message, link);
  root.appendChild(panel);
})();
