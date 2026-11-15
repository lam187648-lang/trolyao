(() => {
  const themeKey = "theme";
  const root = document.documentElement;
  const body = document.body;

  function updateToggleButtons(theme) {
    const isDark = theme === "dark";
    document.querySelectorAll("#theme-toggle-menu, #theme-toggle, [data-theme-toggle]").forEach(button => {
      button.setAttribute("aria-label", isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối");
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("title", isDark ? "Giao diện tối" : "Giao diện sáng");

      const icon = button.querySelector(".menu-icon");
      if (icon) {
        icon.textContent = isDark ? "☀️" : "🌙";
      } else {
        button.textContent = isDark ? "☀️" : "🌙";
      }
    });
  }

  function applyTheme(theme, persist) {
    const selectedTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = selectedTheme;
    body.dataset.theme = selectedTheme;
    body.classList.toggle("dark", selectedTheme === "dark");
    root.style.colorScheme = selectedTheme;
    if (persist) localStorage.setItem(themeKey, selectedTheme);
    updateToggleButtons(selectedTheme);
    window.dispatchEvent(new CustomEvent("app:themechange", { detail: { theme: selectedTheme } }));
  }

  function ensureThemeControl() {
    const existing = document.querySelector("#theme-toggle, [data-theme-toggle]");
    if (existing) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-switch";
    button.dataset.themeToggle = "true";
    button.textContent = "🌙";
    button.setAttribute("aria-label", "Chuyển sang giao diện tối");
    body.appendChild(button);
  }

  function toggleTheme() {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  }

  function applyStoredTheme() {
    applyTheme(localStorage.getItem(themeKey) === "dark" ? "dark" : "light", false);
  }

  window.ThemeManager = {
    applyStored: applyStoredTheme,
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
  });
})();
