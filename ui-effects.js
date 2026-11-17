/* =====================================================================
   UI EFFECTS — Trợ Lý Ảo
   Hiệu ứng giao diện nhẹ, thuần vanilla JS, không phụ thuộc thư viện.
   Không đọc/ghi dữ liệu tài khoản, không thay đổi logic nghiệp vụ.
   Tôn trọng prefers-reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  if (window.UIEffects) return;

  var root = document.documentElement;
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    reduceMotion = false;
  }

  var bootTime = Date.now();
  var toastStack = null;

  root.classList.add("ui-js");

  /* -------------------------------------------------------------------
     Atmosphere layers (ánh sáng nền, không ghi đè theme người dùng)
     ------------------------------------------------------------------- */
  function mountAtmosphere() {
    if (!document.body || document.getElementById("ui-atmosphere")) return;
    var layer = document.createElement("div");
    layer.id = "ui-atmosphere";
    layer.setAttribute("aria-hidden", "true");
    layer.innerHTML =
      '<span class="ui-aura ui-aura-1"></span>' +
      '<span class="ui-aura ui-aura-2"></span>' +
      '<span class="ui-aura ui-aura-3"></span>';
    document.body.insertBefore(layer, document.body.firstChild);
  }

  /* -------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------- */
  var ICONS = {
    success: "✓",
    error: "!",
    warn: "!",
    info: "i"
  };

  function ensureToastStack() {
    if (toastStack && document.body.contains(toastStack)) return toastStack;
    toastStack = document.createElement("div");
    toastStack.className = "ui-toast-stack";
    toastStack.setAttribute("role", "status");
    toastStack.setAttribute("aria-live", "polite");
    document.body.appendChild(toastStack);
    return toastStack;
  }

  function toast(message, options) {
    var opts = options || {};
    var type = ICONS[opts.type] ? opts.type : "info";
    var stack = ensureToastStack();

    var el = document.createElement("div");
    el.className = "ui-toast ui-toast--" + type;

    var icon = document.createElement("span");
    icon.className = "ui-toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = ICONS[type];

    var body = document.createElement("div");
    body.className = "ui-toast-body";

    if (opts.title) {
      var title = document.createElement("strong");
      title.className = "ui-toast-title";
      title.textContent = String(opts.title);
      body.appendChild(title);
    }

    var text = document.createElement("span");
    text.className = "ui-toast-text";
    text.textContent = String(message == null ? "" : message);
    body.appendChild(text);

    var close = document.createElement("button");
    close.type = "button";
    close.className = "ui-toast-close";
    close.setAttribute("aria-label", "Đóng thông báo");
    close.textContent = "✕";

    el.appendChild(icon);
    el.appendChild(body);
    el.appendChild(close);
    stack.appendChild(el);

    var timer = null;

    function dismiss() {
      if (!el.isConnected) return;
      if (timer) window.clearTimeout(timer);
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, reduceMotion ? 0 : 260);
    }

    close.addEventListener("click", dismiss);

    var duration = Number(opts.duration) || 4200;
    if (duration > 0) timer = window.setTimeout(dismiss, duration);

    while (stack.children.length > 4) {
      stack.removeChild(stack.firstChild);
    }

    return { dismiss: dismiss, element: el };
  }

  /* -------------------------------------------------------------------
     Ripple phản hồi khi nhấn
     ------------------------------------------------------------------- */
  var RIPPLE_SELECTOR = [
    ".ui-button",
    ".admin-button",
    ".auth-btn",
    ".token-btn",
    ".join-room-btn",
    ".join-btn",
    ".kick-btn",
    ".back-btn",
    ".new-chat-btn",
    ".change-avatar-btn",
    ".upload-avatar-btn",
    ".gift-btn",
    ".tag-btn"
  ].join(",");

  function attachRipple(event) {
    if (reduceMotion) return;
    var target = event.target && event.target.closest ? event.target.closest(RIPPLE_SELECTOR) : null;
    if (!target || target.disabled) return;

    var rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var size = Math.max(rect.width, rect.height);
    var span = document.createElement("span");
    span.className = "ui-ripple";
    span.style.width = size + "px";
    span.style.height = size + "px";
    span.style.left = (event.clientX - rect.left - size / 2) + "px";
    span.style.top = (event.clientY - rect.top - size / 2) + "px";

    target.classList.add("ui-ripple-host");
    target.appendChild(span);
    window.setTimeout(function () {
      if (span.parentNode) span.parentNode.removeChild(span);
    }, 640);
  }

  /* -------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------- */
  var REVEAL_SELECTOR = [
    ".game-card",
    ".settings-panel",
    ".admin-card",
    ".join-card",
    ".stat-item",
    ".token-section",
    ".color-section",
    ".study-header",
    ".garden-page .setup",
    ".garden-page .garden",
    ".garden-page .garden-history",
    ".games-intro",
    ".settings-intro",
    ".admin-heading",
    ".garden-page .intro",
    ".token-card",
    ".player-stats",
    ".instruction-item"
  ].join(",");

  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;

    var nodes = Array.prototype.slice.call(document.querySelectorAll(REVEAL_SELECTOR));
    if (!nodes.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    nodes.forEach(function (node, index) {
      if (node.dataset.uiReveal === "off") return;
      var siblingIndex = index % 6;
      node.style.setProperty("--ui-reveal-delay", (siblingIndex * 55) + "ms");
      node.classList.add("ui-reveal");
      observer.observe(node);
    });

    // Trường hợp phần tử đã nằm trong khung nhìn ngay khi tải
    window.setTimeout(function () {
      nodes.forEach(function (node) {
        var rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          node.classList.add("is-visible");
        }
      });
    }, 60);
  }

  /* -------------------------------------------------------------------
     Chuyển trang mượt
     ------------------------------------------------------------------- */
  function initPageTransitions() {
    document.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.dataset.noTransition !== undefined) return;

      var href = anchor.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (/^(javascript:|mailto:|tel:|data:)/i.test(href)) return;

      var url;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

      event.preventDefault();
      root.classList.add("ui-leaving");

      window.setTimeout(function () {
        window.location.href = url.href;
      }, reduceMotion ? 0 : 165);

      // Nếu điều hướng không xảy ra (bị chặn), phục hồi giao diện
      window.setTimeout(function () {
        root.classList.remove("ui-leaving");
      }, 2400);
    }, true);

    window.addEventListener("pageshow", function (event) {
      if (event.persisted) root.classList.remove("ui-leaving");
    });
  }

  /* -------------------------------------------------------------------
     Chuyển Dark/Light mượt + thông báo
     ------------------------------------------------------------------- */
  function initThemeFeedback() {
    var animTimer = null;

    window.addEventListener("app:themechange", function (event) {
      var mode = event && event.detail ? event.detail.theme : root.dataset.theme;
      var isDark = mode === "dark";

      if (!reduceMotion) {
        root.classList.add("ui-theme-anim");
        if (animTimer) window.clearTimeout(animTimer);
        animTimer = window.setTimeout(function () {
          root.classList.remove("ui-theme-anim");
        }, 520);
      }

      syncModeLabel(isDark);
      if (Date.now() - bootTime < 1500) return;

      toast(isDark ? "Đã chuyển sang giao diện tối." : "Đã chuyển sang giao diện sáng.", {
        type: "info",
        title: "Giao diện",
        duration: 2600
      });
    });

    window.addEventListener("app:colorthemechange", function () {
      if (Date.now() - bootTime < 1500) return;
      toast("Đã cập nhật bảng màu giao diện.", {
        type: "success",
        title: "Màu sắc",
        duration: 2400
      });
    });
  }

  /* -------------------------------------------------------------------
     Trang chủ: lời chào + thẻ thống kê thật
     ------------------------------------------------------------------- */
  function readUsername() {
    try {
      return window.localStorage.getItem("currentUser") || "";
    } catch (error) {
      return "";
    }
  }

  function greetingText(name) {
    var hour = new Date().getHours();
    var part = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
    return name ? part + ", " + name + "!" : part + "!";
  }

  function syncGreeting() {
    var greetingEl = document.getElementById("ui-greeting");
    if (!greetingEl) return;
    greetingEl.textContent = greetingText(readUsername());
  }

  function syncModeLabel(isDark) {
    var modeEl = document.getElementById("home-stat-mode");
    if (modeEl) modeEl.textContent = isDark ? "Tối" : "Sáng";
  }

  function syncHomeStats() {
    var tokenTarget = document.getElementById("home-stat-tokens");
    if (tokenTarget) {
      var counter = document.getElementById("token-count");
      tokenTarget.textContent = counter ? (counter.textContent || "0").trim() : "0";
    }

    var serverTarget = document.getElementById("home-stat-server");
    if (serverTarget) {
      var status = document.getElementById("header-status-text");
      var text = status ? (status.textContent || "").trim() : "";
      var pending = !text || /đang kết nối|đang kiểm tra/i.test(text);
      var offline = !pending && /chưa|không|fail|error|lỗi/i.test(text);
      serverTarget.textContent = pending ? "Đang kiểm tra" : offline ? "Chưa kết nối" : "Đã kết nối";
      var stat = serverTarget.closest(".home-stat");
      if (stat) {
        stat.classList.toggle("is-online", !pending && !offline);
        stat.classList.toggle("is-offline", offline);
      }
    }

    syncModeLabel(root.dataset.theme === "dark");
  }

  function observeHomeStats() {
    var counter = document.getElementById("token-count");
    if (counter && "MutationObserver" in window) {
      new MutationObserver(syncHomeStats).observe(counter, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    var status = document.getElementById("header-status-text");
    if (status && "MutationObserver" in window) {
      new MutationObserver(syncHomeStats).observe(status, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    window.addEventListener("auth:server-session", function () {
      syncGreeting();
      syncHomeStats();
    });

    window.addEventListener("storage", function (event) {
      if (event.key === "currentUser") syncGreeting();
    });
  }

  /* -------------------------------------------------------------------
     Phản hồi thành công / thất bại
     ------------------------------------------------------------------- */
  function flash(element, type) {
    if (!element) return;
    var cls = type === "error" ? "ui-flash-error" : "ui-flash-success";
    element.classList.remove("ui-flash-success", "ui-flash-error");
    // ép trình duyệt tính lại animation
    void element.offsetWidth;
    element.classList.add(cls);
    window.setTimeout(function () {
      element.classList.remove(cls);
    }, 1000);
  }

  function initStatusFeedback() {
    var settingsStatus = document.getElementById("settings-status");
    if (settingsStatus && "MutationObserver" in window) {
      var lastText = settingsStatus.textContent;
      new MutationObserver(function () {
        var text = (settingsStatus.textContent || "").trim();
        if (!text || text === lastText) return;
        lastText = text;
        if (settingsStatus.classList.contains("error")) {
          flash(settingsStatus, "error");
          toast(text, { type: "error", title: "Không thể áp dụng" });
        } else if (settingsStatus.classList.contains("success")) {
          flash(settingsStatus, "success");
          toast(text, { type: "success", title: "Đã cập nhật" });
        }
      }).observe(settingsStatus, { childList: true, characterData: true, subtree: true });
    }

    // Khu vườn: khi khung phần thưởng hiện ra -> phản hồi hoàn thành
    var reward = document.getElementById("reward");
    if (reward && "MutationObserver" in window) {
      new MutationObserver(function () {
        var visible = reward.offsetParent !== null &&
          window.getComputedStyle(reward).display !== "none";
        if (!visible) return;
        var amount = document.getElementById("tokenReward");
        flash(reward, "success");
        toast(amount ? amount.textContent.trim() : "Bạn đã hoàn thành phiên tập trung.", {
          type: "success",
          title: "Hoàn thành nhiệm vụ",
          duration: 5200
        });
      }).observe(reward, { attributes: true, attributeFilter: ["style", "class"] });
    }
  }

  /* -------------------------------------------------------------------
     Skeleton tiện ích
     ------------------------------------------------------------------- */
  function skeleton(container, rows) {
    if (!container) return function () {};
    var count = Math.max(1, Math.min(12, Number(rows) || 3));
    var lines = [];
    for (var i = 0; i < count; i++) {
      lines.push('<div class="ui-skeleton ui-skeleton-line"></div>');
    }
    container.innerHTML = "";
    var holder = document.createElement("div");
    holder.className = "ui-skeleton-block";
    holder.innerHTML = lines.join("");
    container.appendChild(holder);
    return function clear() {
      if (holder.parentNode) holder.parentNode.removeChild(holder);
    };
  }

  /* -------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------- */
  function boot() {
    mountAtmosphere();
    ensureToastStack();
    syncGreeting();
    syncHomeStats();
    observeHomeStats();
    initThemeFeedback();
    initPageTransitions();
    initStatusFeedback();
    initReveal();

    document.addEventListener("pointerdown", attachRipple, { passive: true });

    root.classList.add("ui-ready");

    window.setTimeout(function () {
      root.classList.remove("ui-ready");
    }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  window.UIEffects = {
    toast: toast,
    flash: flash,
    skeleton: skeleton,
    syncGreeting: syncGreeting,
    syncHomeStats: syncHomeStats,
    reducedMotion: function () {
      return reduceMotion;
    }
  };
})();
