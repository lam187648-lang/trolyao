(() => {
  const themeKey = "theme";
  const colorThemeKey = "selectedColorTheme";
  const root = document.documentElement;
  const body = document.body;
  const colorThemes = {
    "1": ["#3B82F6", "#1E40AF", "#EFF6FF"],
    "2": ["#10B981", "#047857", "#F0FDF4"],
    "3": ["#8B5CF6", "#6D28D9", "#F5F3FF"],
    "4": ["#EC4899", "#BE185D", "#FDF2F8"],
    "5": ["#F59E0B", "#D97706", "#FFFBEB"],
    "6": ["#F97316", "#EA580C", "#FFF7ED"],
    "7": ["#EF4444", "#DC2626", "#FEF2F2"],
    "8": ["#6B7280", "#4B5563", "#F9FAFB"],
    "9": ["#14B8A6", "#0F766E", "#F0FDFA"],
    "10": ["#6366F1", "#4F46E5", "#EEF2FF"],
    "11": ["#A855F7", "#9333EA", "#FAF5FF"],
    "12": ["#F472B6", "#EC4899", "#FDF4FF"],
    "13": ["#92400E", "#78350F", "#FEF3C7"],
    "14": ["#1E40AF", "#1E3A8A", "#DBEAFE"],
    "15": ["#374151", "#111827", "#F3F4F6"],
    "16": ["#7B8492", "#5F6876", "#F9FAFB"],
    "17": ["#D4AF37", "#B8860B", "#FFFAF0"],
    "18": ["#A9A9A9", "#808080", "#F5F5F5"],
    "19": ["#CD7F32", "#8B4513", "#FFF8DC"],
    "20": ["#FF6B6B", "#4ECDC4", "#FFF0F4"],
    "25": ["#D946EF", "#0891B2", "#FDF4FF"],
    "26": ["#EF4444", "#7E22CE", "#FFF1F2"],
    "27": ["#6D28D9", "#191970", "#F5F3FF"],
    "28": ["#10B981", "#DB2777", "#ECFDF5"],
    "29": ["#F97316", "#D97706", "#FFF7ED"],
    "30": ["#CA8A04", "#C026D3", "#FEFCE8"],
    "31": ["#0891B2", "#67E8F9", "#ECFEFF"],
    "32": ["#9333EA", "#581C87", "#FAF5FF"],
    "33": ["#F97316", "#EF4444", "#FFF7ED"],
    "34": ["#0891B2", "#38BDF8", "#F0FDFA"],
    "35": ["#0369A1", "#1E3A8A", "#EFF6FF"],
    "36": ["#EA580C", "#991B1B", "#FFF7ED"],
    "37": ["#EC4899", "#BE185D", "#FDF2F8"],
    "38": ["#16A34A", "#166534", "#F0FDF4"],
    "39": ["#D4AF37", "#64748B", "#F8FAFC"],
    "40": ["#3730A3", "#1E1B4B", "#EEF2FF"],
    "41": ["#D4AF37", "#B8860B", "#FFFBEB"],
    "42": ["#DB2777", "#0284C7", "#FDF2F8"]
  };

  function makeThemeIcon(isDark) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", isDark
      ? "M20.2 15.1A8.3 8.3 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"
      : "M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.7");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function updateToggleButtons(theme) {
    const isDark = theme === "dark";
    document.querySelectorAll("#theme-toggle-menu, #theme-toggle, [data-theme-toggle]").forEach(button => {
      button.setAttribute("aria-label", isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("title", isDark ? "Giao diện tối" : "Giao diện sáng");

      const icon = button.querySelector(".menu-icon");
      if (icon) {
        icon.replaceChildren(makeThemeIcon(!isDark));
      } else {
        button.replaceChildren(makeThemeIcon(!isDark));
      }
    });
  }

  function getCurrentUser() {
    return localStorage.getItem("currentUser") || "";
  }

  function getStoredAccountTheme(user) {
    const username = user !== undefined ? user : getCurrentUser();
    if (username) {
      const val = localStorage.getItem(`theme:${username}`);
      if (val === "dark" || val === "light") return val;
      try {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        if (users[username]?.themeMode === "dark" || users[username]?.themeMode === "light") {
          return users[username].themeMode;
        }
      } catch {}
    }
    const guest = localStorage.getItem("theme:guest") || localStorage.getItem(themeKey);
    return guest === "dark" ? "dark" : "light";
  }

  function saveAccountTheme(mode, user) {
    const username = user !== undefined ? user : getCurrentUser();
    const selectedTheme = mode === "dark" ? "dark" : "light";
    if (username) {
      localStorage.setItem(`theme:${username}`, selectedTheme);
      try {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        if (users[username]) {
          users[username].themeMode = selectedTheme;
          localStorage.setItem("users", JSON.stringify(users));
        }
      } catch {}
    } else {
      localStorage.setItem("theme:guest", selectedTheme);
    }
    localStorage.setItem(themeKey, selectedTheme);
  }

  function getStoredAccountColorTheme(user) {
    const username = user !== undefined ? user : getCurrentUser();
    if (username) {
      const val = localStorage.getItem(`colorTheme:${username}`);
      if (val && colorThemes[val]) return val;
      try {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        if (users[username]?.selectedColorTheme && colorThemes[users[username].selectedColorTheme]) {
          return String(users[username].selectedColorTheme);
        }
      } catch {}
    }
    const fallback = localStorage.getItem(colorThemeKey);
    return (fallback && colorThemes[fallback]) ? fallback : "1";
  }

  function saveAccountColorTheme(themeId, user) {
    const username = user !== undefined ? user : getCurrentUser();
    const strId = String(themeId);
    if (username) {
      localStorage.setItem(`colorTheme:${username}`, strId);
      try {
        const users = JSON.parse(localStorage.getItem("users") || "{}");
        if (users[username]) {
          users[username].selectedColorTheme = strId;
          localStorage.setItem("users", JSON.stringify(users));
        }
      } catch {}
    }
    localStorage.setItem(colorThemeKey, strId);
  }

  function applyTheme(theme, persist) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = selectedTheme;
    body.dataset.theme = selectedTheme;
    body.classList.toggle("dark", selectedTheme === "dark");
    root.style.colorScheme = selectedTheme;
    if (persist) saveAccountTheme(selectedTheme);
    applySelectedColorTheme();
    updateToggleButtons(selectedTheme);
    window.dispatchEvent(new CustomEvent("app:themechange", { detail: { theme: selectedTheme } }));
  }

  function applySelectedColorTheme() {
    const palette = colorThemes[getStoredAccountColorTheme()];
    if (!palette) return;
    const [primary, hover, light] = palette;
    root.style.setProperty("--ai-primary", primary);
    root.style.setProperty("--ai-primary-hover", hover);
    root.style.setProperty("--ai-accent", hover);
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-hover", hover);
    root.style.setProperty("--primary-light", light);
  }

  function ensureThemeControl() {
    const existing = document.querySelector("#theme-toggle, #theme-toggle-menu, [data-theme-toggle]");
    if (existing) return;

    const button = document.createElement("button");
    button.type = "button";
    const navigation = document.querySelector(
      ".settings-topbar, .games-topbar, .page-controls, .admin-topbar, .game-page-nav"
    );
    button.className = navigation ? "page-theme-toggle" : "theme-switch";
    button.dataset.themeToggle = "true";
    button.appendChild(makeThemeIcon(true));
    button.setAttribute("aria-label", "Chuyển sang giao diện tối");
    if (navigation) navigation.appendChild(button);
    else body.appendChild(button);
  }

  function toggleTheme() {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  }

  function applyStoredTheme() {
    applyTheme(getStoredAccountTheme(), false);
  }

  window.ThemeManager = {
    applyStored: applyStoredTheme,
    restoreAccountTheme: (username) => {
      applyTheme(getStoredAccountTheme(username), false);
    },
    setColorTheme: (themeId) => {
      if (!colorThemes[String(themeId)]) return false;
      saveAccountColorTheme(themeId);
      applySelectedColorTheme();
      window.dispatchEvent(new CustomEvent("app:colorthemechange", {
        detail: { themeId: String(themeId) }
      }));
      return true;
    },
    setMode: (theme) => applyTheme(theme, true),
    toggle: toggleTheme
  };

  applyStoredTheme();
  ensureThemeControl();
  document.addEventListener("DOMContentLoaded", ensureThemeControl, { once: true });
  updateToggleButtons(root.dataset.theme);

  document.querySelectorAll("#theme-toggle, [data-theme-toggle]").forEach(button => {
    button.addEventListener("click", toggleTheme);
  });

  window.addEventListener("storage", event => {
    if (event.key === themeKey) applyStoredTheme();
    if (event.key === colorThemeKey) applySelectedColorTheme();
  });
})();
