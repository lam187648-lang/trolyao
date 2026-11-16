(() => {
  const byId = (id) => document.getElementById(id);
  const RECORDS_KEY = "legacyImportRecords";
  const statusElement = byId("import-status");
  let serverUser = null;
  let submitting = false;

  function setStatus(message, isError = false) {
    statusElement.textContent = message;
    statusElement.classList.toggle("error", isError);
  }

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value && typeof value === "object" ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function findLocalAccounts() {
    const accounts = new Map();
    for (const source of [readJson("users", {}), readJson("legacyUsers", {})]) {
      for (const [username, profile] of Object.entries(source)) {
        if (!profile || typeof profile !== "object" || profile.serverAccount || accounts.has(username)) continue;
        const tokens = Number(profile.tokens);
        accounts.set(username, {
          username,
          tokens: Number.isSafeInteger(tokens) && tokens > 0 ? Math.min(tokens, 1000000) : 0,
          themeIds: Array.isArray(profile.purchasedColors)
            ? [...new Set(profile.purchasedColors.map(String).filter((id) => /^[1-9][0-9]{0,2}$/.test(id)))].slice(0, 100)
            : [],
          selectedThemeId: /^[1-9][0-9]{0,2}$/.test(String(profile.selectedColorTheme))
            ? String(profile.selectedColorTheme)
            : null
        });
      }
    }
    return [...accounts.values()];
  }

  function list(title, items) {
    const fragment = document.createDocumentFragment();
    const heading = document.createElement("strong");
    heading.textContent = title;
    const ul = document.createElement("ul");
    ul.className = "result-list";
    for (const text of items.length ? items : ["Không có"]) {
      const li = document.createElement("li");
      li.textContent = text;
      ul.appendChild(li);
    }
    fragment.append(heading, ul);
    return fragment;
  }

  const STATUS_TEXT = {
    completed: "Đã hoàn tất (không có mục cần duyệt).",
    pending_review: "Đang chờ quản trị viên duyệt.",
    approved: "Đã được duyệt.",
    rejected: "Đã bị từ chối."
  };

  function showExistingImport(record) {
    byId("accounts-card").hidden = true;
    byId("result-card").hidden = false;
    const body = byId("result-body");
    body.replaceChildren();
    const summary = document.createElement("p");
    summary.textContent = `Tài khoản server này đã gửi yêu cầu từ tài khoản cũ "${record.localUsername}". Trạng thái: ${STATUS_TEXT[record.status] || record.status}`;
    body.appendChild(summary);
    if (record.status === "approved") {
      body.appendChild(list("Đã được duyệt:", [
        `${record.approvedTokens} Token`,
        ...record.approvedThemeIds.map((id) => `Màu ${id}`)
      ]));
    }
    if (record.reviewNote) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = `Ghi chú của quản trị viên: ${record.reviewNote}`;
      body.appendChild(note);
    }
    setStatus("Mỗi tài khoản server chỉ được chuyển dữ liệu một lần.");
  }

  function showResult(result) {
    byId("accounts-card").hidden = true;
    byId("result-card").hidden = false;
    const body = byId("result-body");
    body.replaceChildren(
      list("Đã chuyển ngay:", result.applied.map((entry) => `${entry.item}: ${entry.reason}`)),
      list("Chờ quản trị viên duyệt:", [
        ...(result.pendingReview.tokens > 0 ? [`${result.pendingReview.tokens} Token`] : []),
        ...result.pendingReview.themeIds.map((id) => `Màu ${id}`)
      ]),
      list("Không chuyển:", result.notEligible.map((entry) => `${entry.item}: ${entry.reason}`))
    );
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = "Dữ liệu tài khoản cũ trên trình duyệt này vẫn được giữ nguyên.";
    body.appendChild(note);
  }

  function renderAccounts() {
    const accounts = findLocalAccounts();
    const container = byId("account-list");
    container.replaceChildren();
    byId("server-user-label").textContent = `Đang đăng nhập server: ${serverUser.username}`;
    byId("accounts-card").hidden = false;
    if (!accounts.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Không tìm thấy tài khoản cũ nào trên trình duyệt này.";
      container.appendChild(empty);
      byId("submit-btn").disabled = true;
      return;
    }
    const records = readJson(RECORDS_KEY, {});
    for (const account of accounts) {
      const label = document.createElement("label");
      label.className = "account-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "local-account";
      input.value = account.username;
      input.addEventListener("change", () => { byId("submit-btn").disabled = false; });
      const text = document.createElement("span");
      const previous = records[account.username];
      text.textContent = `${account.username} · ${account.tokens} Token · ${account.themeIds.length} màu đã mua` +
        (previous ? ` · đã gửi cho "${previous.serverUsername}"` : "");
      label.append(input, text);
      container.appendChild(label);
    }
  }

  async function loadServerState() {
    const { import: record } = await window.AuthApi.request("/api/legacy-import");
    if (record) {
      showExistingImport(record);
      return;
    }
    setStatus("Chọn tài khoản cũ cần chuyển rồi gửi yêu cầu.");
    renderAccounts();
  }

  async function submitImport() {
    if (submitting) return;
    const selected = document.querySelector('input[name="local-account"]:checked');
    const account = findLocalAccounts().find((item) => item.username === selected?.value);
    if (!account) return;
    if (!confirm(`Gửi yêu cầu chuyển dữ liệu từ "${account.username}" sang tài khoản server "${serverUser.username}"? Mỗi tài khoản server chỉ chuyển được một lần.`)) return;

    submitting = true;
    byId("submit-btn").disabled = true;
    setStatus("Đang gửi yêu cầu...");
    try {
      const result = await window.AuthApi.request("/api/legacy-import", {
        method: "POST",
        body: {
          localUsername: account.username,
          claimedTokens: account.tokens,
          claimedThemeIds: account.themeIds,
          selectedThemeId: account.selectedThemeId
        }
      });
      const records = readJson(RECORDS_KEY, {});
      records[account.username] = { serverUsername: serverUser.username, status: result.import.status, at: new Date().toISOString() };
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
      setStatus("Đã gửi yêu cầu.");
      showResult(result);
    } catch (error) {
      if (error.status === 409 && error.code === "LEGACY_IMPORT_EXISTS") {
        await loadServerState();
        return;
      }
      setStatus(`${error.message} Dữ liệu cũ vẫn được giữ nguyên. Nếu mất kết nối, hãy tải lại trang để kiểm tra trạng thái trước khi gửi lại.`, true);
      byId("submit-btn").disabled = false;
    } finally {
      submitting = false;
    }
  }

  async function init() {
    byId("submit-btn").addEventListener("click", () => { void submitImport(); });
    byId("login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = byId("login-btn");
      button.disabled = true;
      try {
        const result = await window.AuthApi.login(byId("login-username").value.trim(), byId("login-password").value);
        await window.AuthApi.storeSession(result);
        serverUser = result.user;
        byId("login-card").hidden = true;
        await loadServerState();
      } catch (error) {
        setStatus(`${error.message} Dữ liệu cũ không bị thay đổi.`, true);
      } finally {
        button.disabled = false;
      }
    });

    try {
      serverUser = await window.AuthApi.restoreSession();
      if (!serverUser) {
        byId("login-card").hidden = false;
        setStatus("Hãy đăng nhập tài khoản server sẽ nhận dữ liệu.");
        return;
      }
      await loadServerState();
    } catch (error) {
      setStatus(error.message || "Không thể kết nối máy chủ.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", () => { void init(); }, { once: true });
})();
