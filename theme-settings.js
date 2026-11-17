(() => {
  const basicPalettes = [
    { id: "1", name: "Xanh dương", primary: "#3B82F6", hover: "#1E40AF", background: "#EFF6FF" },
    { id: "2", name: "Xanh lá", primary: "#10B981", hover: "#047857", background: "#F0FDF4" },
    { id: "3", name: "Tím dịu", primary: "#8B5CF6", hover: "#6D28D9", background: "#F5F3FF" },
    { id: "4", name: "Hồng", primary: "#EC4899", hover: "#BE185D", background: "#FDF2F8" },
    { id: "5", name: "Vàng ấm", primary: "#F59E0B", hover: "#D97706", background: "#FFFBEB" },
    { id: "9", name: "Xanh ngọc", primary: "#14B8A6", hover: "#0F766E", background: "#F0FDFA" }
  ];
  const specialPalettes = [
    { id: "17", name: "Vàng kim", primary: "#D4AF37", hover: "#B8860B", background: "#FFFAF0", icon: "✦" },
    { id: "18", name: "Bạc", primary: "#A9A9A9", hover: "#707780", background: "#F5F5F5", icon: "◇" },
    { id: "19", name: "Đồng", primary: "#CD7F32", hover: "#8B4513", background: "#FFF8DC", icon: "◆" },
    { id: "20", name: "Cầu vồng", primary: "#E44B83", hover: "#267DA8", background: "#FFF0F4", icon: "✧" },
    { id: "25", name: "Holographic", primary: "#D946EF", hover: "#0891B2", background: "#FDF4FF", icon: "✧" },
    { id: "26", name: "Rainbow", primary: "#EF4444", hover: "#7E22CE", background: "#FFF1F2", icon: "🌈" },
    { id: "27", name: "Galaxy", primary: "#6D28D9", hover: "#191970", background: "#F5F3FF", icon: "✦" },
    { id: "28", name: "Aurora", primary: "#10B981", hover: "#DB2777", background: "#ECFDF5", icon: "✧" },
    { id: "29", name: "Phoenix", primary: "#F97316", hover: "#D97706", background: "#FFF7ED", icon: "✦" },
    { id: "30", name: "Cyberpunk", primary: "#CA8A04", hover: "#C026D3", background: "#FEFCE8", icon: "⚡" },
    { id: "31", name: "Diamond", primary: "#0891B2", hover: "#67E8F9", background: "#ECFEFF", icon: "◇" },
    { id: "32", name: "Royal Amethyst", primary: "#9333EA", hover: "#581C87", background: "#FAF5FF", icon: "✦" },
    { id: "33", name: "Sunset Gold", primary: "#F97316", hover: "#EF4444", background: "#FFF7ED", icon: "☼" },
    { id: "34", name: "Frozen Ice", primary: "#0891B2", hover: "#38BDF8", background: "#F0FDFA", icon: "❄" },
    { id: "35", name: "Ocean Deep", primary: "#0369A1", hover: "#1E3A8A", background: "#EFF6FF", icon: "◈" },
    { id: "36", name: "Magma", primary: "#EA580C", hover: "#991B1B", background: "#FFF7ED", icon: "✦" },
    { id: "37", name: "Sakura", primary: "#EC4899", hover: "#BE185D", background: "#FDF2F8", icon: "✿" },
    { id: "38", name: "Emerald Forest", primary: "#16A34A", hover: "#166534", background: "#F0FDF4", icon: "❋" },
    { id: "39", name: "Starlight", primary: "#D4AF37", hover: "#64748B", background: "#F8FAFC", icon: "✦" },
    { id: "40", name: "Midnight", primary: "#3730A3", hover: "#1E1B4B", background: "#EEF2FF", icon: "☾" },
    { id: "41", name: "Golden Royal", primary: "#D4AF37", hover: "#B8860B", background: "#FFFBEB", icon: "✦" },
    { id: "42", name: "Prism", primary: "#DB2777", hover: "#0284C7", background: "#FDF2F8", icon: "✧" }
  ];
  const allPalettes = [...basicPalettes, ...specialPalettes];
  const allowedSpecialIds = new Set();
  const selectedLabel = document.getElementById("selected-label");
  const status = document.getElementById("settings-status");
  const previewCanvas = document.getElementById("preview-canvas");
  let selectedId = localStorage.getItem("selectedColorTheme") || "1";
  let permissionCheckFailed = false;

  function setStatus(message, kind) {
    status.textContent = message;
    status.classList.toggle("error", kind === "error");
    status.classList.toggle("success", kind === "success");
  }

  function updatePreview(palette) {
    previewCanvas.style.setProperty("--preview-primary", palette.primary);
    previewCanvas.style.setProperty("--preview-hover", palette.hover);
    previewCanvas.style.setProperty("--preview-background", palette.background);
    selectedLabel.textContent = `Đang chọn: ${palette.name}`;
    document.querySelectorAll(".palette-option").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.themeId === palette.id));
    });
  }

  function renderPalettes(containerId, palettes, special) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    palettes.forEach(palette => {
      const isAllowed = !special || allowedSpecialIds.has(palette.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-option";
      button.dataset.themeId = palette.id;
      button.disabled = !isAllowed;
      button.setAttribute("aria-pressed", String(selectedId === palette.id));
      button.title = isAllowed
        ? `Chọn màu ${palette.name}`
        : `Màu ${palette.name} cần được Admin cấp quyền`;
      button.innerHTML = `
        <span class="palette-swatch" style="--swatch:${palette.primary}" aria-hidden="true">${special ? palette.icon : ""}</span>
        <span>
          <span class="palette-name">${palette.name}</span>
          <span class="palette-state">${special ? (isAllowed ? "Đã được cấp quyền" : "Cần Admin cấp quyền") : "Miễn phí"}</span>
        </span>
        <span class="palette-check" aria-hidden="true">✓</span>`;
      button.addEventListener("click", () => {
        selectedId = palette.id;
        updatePreview(palette);
      });
      container.appendChild(button);
    });
  }

  async function loadEntitlements() {
    if (!window.AuthApi?.hasSession()) {
      if (specialPalettes.some(item => item.id === selectedId)) {
        selectedId = "1";
        window.ThemeManager.setColorTheme("1");
        updatePreview(basicPalettes[0]);
      }
      setStatus("Đăng nhập bằng tài khoản máy chủ để dùng màu đặc biệt sau khi Admin cấp quyền.", "");
      return;
    }

    try {
      const user = await window.AuthApi.restoreSession();
      if (!user || !window.AuthApi.hasSession()) {
        if (specialPalettes.some(item => item.id === selectedId)) {
          selectedId = "1";
          window.ThemeManager.setColorTheme("1");
          updatePreview(basicPalettes[0]);
        }
        setStatus("Phiên đăng nhập không còn hoạt động. Màu đặc biệt đang bị khóa.", "");
        renderPalettes("special-palettes", specialPalettes, true);
        return;
      }
      // FIX: Luôn gọi thẳng API server để lấy quyền màu, không dùng localStorage
      // Điều này đảm bảo màu được Admin cấp sẽ xuất hiện ngay lập tức
      const entitlementsData = await window.AuthApi.request("/api/themes/entitlements");
      const serverThemeIds = entitlementsData.themeIds || [];
      serverThemeIds.forEach(id => allowedSpecialIds.add(String(id)));
      if (specialPalettes.some(item => item.id === selectedId) && !allowedSpecialIds.has(selectedId)) {
        selectedId = "1";
        window.ThemeManager.setColorTheme("1");
        updatePreview(basicPalettes[0]);
      }
      renderPalettes("special-palettes", specialPalettes, true);
      if (!allowedSpecialIds.size) {
        setStatus("Tài khoản chưa được Admin cấp quyền màu đặc biệt.", "");
      } else {
        setStatus(`Đã tải ${allowedSpecialIds.size} màu đặc biệt được cấp.`, "success");
      }
    } catch (error) {
      permissionCheckFailed = true;
      renderPalettes("special-palettes", specialPalettes, true);
      setStatus("Không xác minh được quyền màu với máy chủ. Màu đặc biệt đang bị khóa để bảo vệ tài khoản.", "error");
    }
  }

  async function applySelected() {
    const palette = allPalettes.find(item => item.id === selectedId);
    if (!palette) {
      setStatus("Màu đang chọn không hợp lệ.", "error");
      return;
    }
    if (permissionCheckFailed && specialPalettes.some(item => item.id === selectedId)) {
      setStatus("Không thể áp dụng màu đặc biệt khi chưa xác minh được quyền.", "error");
      return;
    }

    const applyButton = document.getElementById("apply-button");
    applyButton.disabled = true;
    try {
      if (window.AuthApi?.hasSession()) {
        await window.AuthApi.request("/api/themes/selected", {
          method: "PUT",
          body: { themeId: selectedId }
        });
      } else if (specialPalettes.some(item => item.id === selectedId)) {
        setStatus("Màu đặc biệt cần tài khoản máy chủ và quyền được Admin cấp.", "error");
        return;
      }

      window.ThemeManager.setColorTheme(selectedId);
      document.getElementById("mode-label").textContent =
        document.documentElement.dataset.theme === "dark" ? "Tối" : "Sáng";
      setStatus(`Đã áp dụng bảng màu ${palette.name}.`, "success");
    } catch (error) {
      setStatus(error.message || "Không thể lưu màu trên máy chủ.", "error");
    } finally {
      applyButton.disabled = false;
    }
  }

  async function resetDefaults() {
    selectedId = "1";
    updatePreview(basicPalettes[0]);
    try {
      if (window.AuthApi?.hasSession()) {
        await window.AuthApi.request("/api/themes/selected", {
          method: "PUT",
          body: { themeId: "1" }
        });
      }
      window.ThemeManager.setColorTheme("1");
      window.ThemeManager.setMode("light");
      document.getElementById("mode-label").textContent = "Sáng";
      setStatus("Đã khôi phục giao diện Light AI mặc định.", "success");
    } catch (error) {
      setStatus(error.message || "Không thể lưu thiết lập mặc định trên máy chủ.", "error");
    }
  }

  document.getElementById("back-button").addEventListener("click", () => {
    if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
      history.back();
    } else {
      location.href = "index.html";
    }
  });
  document.getElementById("apply-button").addEventListener("click", applySelected);
  document.getElementById("reset-button").addEventListener("click", resetDefaults);
  window.addEventListener("app:themechange", event => {
    document.getElementById("mode-label").textContent = event.detail.theme === "dark" ? "Tối" : "Sáng";
  });

  renderPalettes("basic-palettes", basicPalettes, false);
  renderPalettes("special-palettes", specialPalettes, true);
  updatePreview(allPalettes.find(item => item.id === selectedId) || basicPalettes[0]);
  document.getElementById("mode-label").textContent =
    document.documentElement.dataset.theme === "dark" ? "Tối" : "Sáng";
  loadEntitlements();
})();
