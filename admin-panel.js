(() => {
  const pageSize = 25;
  const state = { page: 1, total: 0, searchTimer: null };
  const byId = (id) => document.getElementById(id);
  const statusElement = byId("admin-status");

  function setStatus(message, isError = false, linkText, linkHref) {
    statusElement.replaceChildren(document.createTextNode(message));
    statusElement.classList.toggle("error", isError);
    if (linkText && linkHref) {
      const link = document.createElement("a");
      link.href = linkHref;
      link.textContent = linkText;
      link.style.marginLeft = "8px";
      statusElement.appendChild(link);
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "—"
      : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function cell(row, value) {
    const td = document.createElement("td");
    td.textContent = value == null ? "—" : String(value);
    row.appendChild(td);
    return td;
  }

  function actionButton(label, action, isDanger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (isDanger) button.classList.add("danger");
    button.addEventListener("click", () => {
      void action().catch((error) => setStatus(error.message, true));
    });
    return button;
  }

  async function loadUsers() {
    const search = byId("user-search").value.trim();
    const status = byId("user-status").value;
    const query = new URLSearchParams({ page: String(state.page), pageSize: String(pageSize) });
    if (search) query.set("q", search);
    if (status) query.set("status", status);

    byId("users-body").replaceChildren();
    const loadingRow = document.createElement("tr");
    cell(loadingRow, "Đang tải...");
    byId("users-body").appendChild(loadingRow);

    const result = await window.AuthApi.request(`/admin/users?${query}`);
    state.total = result.total;
    byId("users-body").replaceChildren();
    if (!result.users.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = cell(emptyRow, "Không tìm thấy tài khoản.");
      emptyCell.colSpan = 7;
      byId("users-body").appendChild(emptyRow);
    }

    for (const user of result.users) {
      const row = document.createElement("tr");
      const identity = cell(row, `${user.id}\n${user.username}`);
      identity.style.whiteSpace = "pre-line";
      cell(row, user.email || "—");
      cell(row, formatDate(user.created_at));
      cell(row, formatDate(user.last_login_at));
      cell(row, Number(user.token_balance).toLocaleString("vi-VN"));
      const accountState = document.createElement("td");
      accountState.textContent = user.role;
      const pill = document.createElement("span");
      pill.className = `status-pill${user.status === "locked" ? " locked" : ""}`;
      pill.textContent = user.status === "locked" ? "Đã khóa" : "Hoạt động";
      accountState.appendChild(document.createElement("br"));
      accountState.appendChild(pill);
      row.appendChild(accountState);

      const actions = document.createElement("td");
      actions.className = "admin-actions";
      actions.append(
        actionButton("Cộng Token", async () => {
          const amountText = prompt(`Số Token muốn cộng cho ${user.username}:`);
          if (amountText === null) return;
          const amount = Number(amountText);
          if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000) {
            throw new Error("Số Token phải là số nguyên từ 1 đến 1.000.000.");
          }
          const note = prompt("Lý do (tối đa 200 ký tự):") || "";
          if (!confirm(`Xác nhận cộng ${amount} Token cho ${user.username}?`)) return;
          await window.AuthApi.request(`/admin/users/${user.id}/tokens`, {
            method: "POST",
            body: { amount, note }
          });
          setStatus(`Đã cộng ${amount} Token cho ${user.username}.`);
          await reload();
        }),
        actionButton("Cấp màu", async () => {
          const themeId = prompt(`Mã màu đặc biệt cần cấp cho ${user.username}:`);
          if (themeId === null) return;
          const normalizedId = themeId.trim();
          if (!/^[A-Za-z0-9_-]{1,40}$/.test(normalizedId)) throw new Error("Mã màu không hợp lệ.");
          if (!confirm(`Cấp màu ${normalizedId} cho ${user.username}?`)) return;
          await window.AuthApi.request(`/admin/users/${user.id}/themes/${encodeURIComponent(normalizedId)}`, {
            method: "POST"
          });
          setStatus(`Đã cấp màu ${normalizedId} cho ${user.username}.`);
          await loadAudit();
        }),
        actionButton("Thu hồi màu", async () => {
          const themeId = prompt(`Mã màu cần thu hồi của ${user.username}:`);
          if (themeId === null) return;
          const normalizedId = themeId.trim();
          if (!/^[A-Za-z0-9_-]{1,40}$/.test(normalizedId)) throw new Error("Mã màu không hợp lệ.");
          if (!confirm(`Thu hồi màu ${normalizedId} của ${user.username}?`)) return;
          await window.AuthApi.request(`/admin/users/${user.id}/themes/${encodeURIComponent(normalizedId)}`, {
            method: "DELETE"
          });
          setStatus(`Đã thu hồi màu ${normalizedId} của ${user.username}.`);
          await loadAudit();
        }),
        actionButton(user.status === "locked" ? "Mở khóa" : "Khóa", async () => {
          const nextStatus = user.status === "locked" ? "active" : "locked";
          if (!confirm(`${nextStatus === "locked" ? "Khóa" : "Mở khóa"} tài khoản ${user.username}?`)) return;
          await window.AuthApi.request(`/admin/users/${user.id}/status`, {
            method: "PATCH",
            body: { status: nextStatus }
          });
          setStatus(`Đã cập nhật trạng thái ${user.username}.`);
          await reload();
        }, user.status !== "locked"),
        actionButton("Kick phiên", async () => {
          if (!confirm(`Thu hồi toàn bộ phiên đăng nhập của ${user.username}?`)) return;
          const result = await window.AuthApi.request(`/admin/users/${user.id}/sessions/revoke`, {
            method: "POST"
          });
          setStatus(`Đã thu hồi ${result.revokedSessions} phiên của ${user.username}.`);
          await loadAudit();
        }, true)
      );
      row.appendChild(actions);
      byId("users-body").appendChild(row);
    }

    const pageCount = Math.max(1, Math.ceil(state.total / pageSize));
    byId("page-label").textContent = `Trang ${state.page}/${pageCount} · ${state.total} tài khoản`;
    byId("previous-page").disabled = state.page <= 1;
    byId("next-page").disabled = state.page >= pageCount;
  }

  async function loadAudit() {
    const { logs } = await window.AuthApi.request("/admin/audit?page=1&pageSize=15");
    const list = byId("audit-list");
    list.replaceChildren();
    if (!logs.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Chưa có hoạt động quản trị.";
      list.appendChild(empty);
      return;
    }
    for (const log of logs) {
      const item = document.createElement("div");
      item.className = "audit-item";
      for (const value of [
        log.action,
        `${log.actor_username} → ${log.target_username || "—"}`,
        formatDate(log.created_at),
        JSON.stringify(log.details || {})
      ]) {
        const detail = document.createElement("span");
        detail.textContent = value;
        item.appendChild(detail);
      }
      list.appendChild(item);
    }
  }

  async function loadImports() {
    const body = byId("imports-body");
    const status = byId("import-status").value;
    let imports;
    try {
      ({ imports } = await window.AuthApi.request(`/admin/legacy-imports?status=${encodeURIComponent(status)}`));
    } catch (error) {
      body.replaceChildren();
      const row = document.createElement("tr");
      cell(row, error.message).colSpan = 7;
      body.appendChild(row);
      return;
    }
    body.replaceChildren();
    if (!imports.length) {
      const row = document.createElement("tr");
      cell(row, "Không có yêu cầu nào.").colSpan = 7;
      body.appendChild(row);
      return;
    }
    for (const item of imports) {
      const row = document.createElement("tr");
      cell(row, item.username);
      const local = cell(row, item.local_username);
      if (item.same_local_username_count > 1) {
        local.textContent += `\n⚠ ${item.same_local_username_count} yêu cầu cùng tên cũ`;
        local.style.whiteSpace = "pre-line";
      }
      cell(row, Number(item.claimed_tokens).toLocaleString("vi-VN"));
      cell(row, item.claimed_theme_ids.length ? item.claimed_theme_ids.join(", ") : "—");
      cell(row, formatDate(item.created_at));
      cell(row, item.status === "approved"
        ? `${Number(item.approved_tokens).toLocaleString("vi-VN")} Token · màu ${item.approved_theme_ids.join(", ") || "—"}`
        : item.review_note || "—");
      const actions = document.createElement("td");
      actions.className = "admin-actions";
      if (item.status === "pending_review") {
        actions.append(
          actionButton("Duyệt", async () => {
            const tokenText = prompt(`Số Token duyệt cho ${item.username} (0–${item.claimed_tokens}):`, String(item.claimed_tokens));
            if (tokenText === null) return;
            const tokens = Number(tokenText);
            if (!Number.isSafeInteger(tokens) || tokens < 0 || tokens > Number(item.claimed_tokens)) {
              throw new Error("Số Token duyệt không hợp lệ.");
            }
            const themeText = prompt("Mã màu duyệt (cách nhau bằng dấu phẩy, để trống nếu không):", item.claimed_theme_ids.join(","));
            if (themeText === null) return;
            const themeIds = themeText.split(",").map((value) => value.trim()).filter(Boolean);
            const note = prompt("Ghi chú (tối đa 200 ký tự):") || "";
            if (!confirm(`Duyệt ${tokens} Token và ${themeIds.length} màu cho ${item.username}?`)) return;
            await window.AuthApi.request(`/admin/legacy-imports/${item.id}/approve`, {
              method: "POST",
              body: { tokens, themeIds, note }
            });
            setStatus(`Đã duyệt yêu cầu của ${item.username}.`);
            await reload();
          }),
          actionButton("Từ chối", async () => {
            const note = prompt("Lý do từ chối (tối đa 200 ký tự):");
            if (note === null) return;
            await window.AuthApi.request(`/admin/legacy-imports/${item.id}/reject`, {
              method: "POST",
              body: { note }
            });
            setStatus(`Đã từ chối yêu cầu của ${item.username}.`);
            await reload();
          }, true)
        );
      } else {
        actions.textContent = "—";
      }
      row.appendChild(actions);
      body.appendChild(row);
    }
  }

  async function reload() {
    await Promise.all([loadUsers(), loadAudit(), loadImports()]);
  }

  async function init() {
    byId("back-btn").addEventListener("click", () => {
      if (history.length > 1 && document.referrer.startsWith(location.origin)) history.back();
      else location.href = "index.html";
    });
    byId("previous-page").addEventListener("click", () => {
      state.page -= 1;
      void loadUsers().catch((error) => setStatus(error.message, true));
    });
    byId("next-page").addEventListener("click", () => {
      state.page += 1;
      void loadUsers().catch((error) => setStatus(error.message, true));
    });
    byId("import-status").addEventListener("change", () => {
      void loadImports().catch((error) => setStatus(error.message, true));
    });
    byId("user-status").addEventListener("change", () => {
      state.page = 1;
      void loadUsers().catch((error) => setStatus(error.message, true));
    });
    byId("user-search").addEventListener("input", () => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => {
        state.page = 1;
        void loadUsers().catch((error) => setStatus(error.message, true));
      }, 250);
    });

    try {
      const { databaseConfigured } = await window.AuthApi.databaseStatus();
      if (!databaseConfigured) {
        setStatus("PostgreSQL chưa được cấu hình. Bảng quản trị không khả dụng.", true);
        return;
      }
      const user = await window.AuthApi.restoreSession();
      if (!user) {
        setStatus("Vui lòng đăng nhập bằng tài khoản Admin.", true, "Đăng nhập", "auth.html");
        return;
      }
      if (user.role !== "admin") {
        setStatus("Tài khoản này không có quyền Admin.", true);
        return;
      }
      byId("admin-content").hidden = false;
      setStatus(`Đã xác thực Admin: ${user.username}.`);
      await reload();
    } catch (error) {
      setStatus(error.message || "Không thể tải dữ liệu quản trị.", true);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    void init();
  }, { once: true });
})();
