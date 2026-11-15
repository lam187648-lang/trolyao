// Legacy token page disabled: browser-only token minting was insecure.
(() => {
  const root = document.querySelector("main") || document.body;
  root.replaceChildren();
  const panel = document.createElement("section");
  panel.style.cssText = "max-width:620px;margin:12vh auto;padding:30px;border-radius:20px;background:#0b1a2b;color:#e8f3ff;text-align:center;font-family:system-ui;line-height:1.7";
  const title = document.createElement("h1");
  title.textContent = "🔒 Trang token cũ đã được khóa";
  const message = document.createElement("p");
  message.textContent = "Trang cũ cho phép tự cộng token trực tiếp trong trình duyệt. Tính năng này không an toàn nên đã tắt; số dư token cần được quản lý bởi máy chủ.";
  const controls = document.createElement("nav");
  controls.className = "page-controls";
  controls.setAttribute("aria-label", "Điều hướng trang token");
  const back = document.createElement("button");
  back.type = "button";
  back.dataset.pageBack = "";
  back.dataset.fallback = "index.html";
  back.textContent = "← Quay lại";
  const link = document.createElement("a");
  link.href = "index.html";
  link.textContent = "⌂ Trang chủ";
  link.style.color = "#7dd3fc";
  controls.append(back, link);
  panel.append(title, message, controls);
  root.appendChild(panel);
})();
