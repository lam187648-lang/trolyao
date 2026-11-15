document.getElementById("back-button").addEventListener("click", () => {
  const previous = document.referrer;
  if (previous) {
    try {
      if (new URL(previous).origin === location.origin && history.length > 1) {
        history.back();
        return;
      }
    } catch (error) {
      console.warn("Không thể đọc trang trước; chuyển về trang chủ.", error);
    }
  }
  location.href = "index.html";
});
