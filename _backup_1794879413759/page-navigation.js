document.querySelectorAll("[data-page-back]").forEach(button => {
  button.addEventListener("click", () => {
    const fallback = button.dataset.fallback || "index.html";
    if (document.referrer && history.length > 1) {
      try {
        if (new URL(document.referrer).origin === location.origin) {
          history.back();
          return;
        }
      } catch (error) {
        console.warn("Không thể đọc trang trước; chuyển đến trang dự phòng.", error);
      }
    }
    location.href = fallback;
  });
});
