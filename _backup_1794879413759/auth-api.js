(() => {
  const RENDER_SERVER_URL = "https://trolyao-1.onrender.com";
  const LOCAL_SERVER_URL = "http://localhost:4000";
  const SERVER_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
    ? LOCAL_SERVER_URL
    : RENDER_SERVER_URL;
  const TOKEN_KEY = "serverAuthToken";

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${SERVER_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const contentType = response.headers.get("content-type") || "";
    if (response.status !== 204 && !contentType.includes("application/json")) {
      const error = new Error(
        response.status === 404
          ? "Backend Render chưa có API xác thực. Hãy triển khai thư mục server làm Root Directory trên Render."
          : `Backend trả về phản hồi không phải JSON (HTTP ${response.status}).`
      );
      error.status = response.status;
      error.code = "AUTH_API_UNAVAILABLE";
      throw error;
    }

    let data = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        const error = new Error("Backend trả về JSON không hợp lệ.");
        error.status = response.status;
        error.code = "AUTH_API_INVALID_RESPONSE";
        throw error;
      }
    }
    if (!response.ok) {
      const error = new Error(data?.error || `Yêu cầu thất bại (${response.status}).`);
      error.status = response.status;
      error.code = data?.code;
      error.retryAfterSeconds = data?.retryAfterSeconds;
      throw error;
    }
    return data;
  }

  function saveUserSnapshot(user) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    const previous = users[user.username] && typeof users[user.username] === "object"
      ? users[user.username]
      : {};
    if (!previous.serverAccount && Object.keys(previous).length) {
      const legacyUsers = JSON.parse(localStorage.getItem("legacyUsers") || "{}");
      if (!legacyUsers[user.username]) {
        legacyUsers[user.username] = previous;
        localStorage.setItem("legacyUsers", JSON.stringify(legacyUsers));
      }
    }
    const profile = {
      username: user.username,
      avatar: typeof previous.avatar === "string" ? previous.avatar : "",
      tokens: Number(user.tokenBalance) || 0,
      purchasedColors: Array.isArray(user.themeIds) ? user.themeIds.map(Number) : [],
      selectedColorTheme: String(user.selectedThemeId || "1"),
      createdAt: user.createdAt || previous.createdAt || new Date().toISOString(),
      lastLogin: user.lastLoginAt || Date.now(),
      serverAccount: true
    };
    if (previous.studyStats && typeof previous.studyStats === "object") {
      profile.studyStats = previous.studyStats;
    }
    users[user.username] = profile;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", user.username);
    localStorage.setItem("userTokens", String(profile.tokens));
    localStorage.setItem("selectedColorTheme", profile.selectedColorTheme);
  }

  async function storeSession(result) {
    if (!result?.accessToken || !result.user?.username) {
      throw new Error("Máy chủ trả về dữ liệu đăng nhập không hợp lệ.");
    }
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    saveUserSnapshot(result.user);
    sessionStorage.setItem("authSession", JSON.stringify({
      username: result.user.username,
      loginTime: Date.now(),
      lastActivity: Date.now()
    }));
    try {
      await refreshUserSnapshot(result.user);
    } catch (error) {
      clearSession();
      throw error;
    }
    window.dispatchEvent(new CustomEvent("auth:server-session", { detail: { user: result.user } }));
  }

  async function refreshUserSnapshot(user) {
    let themeIds = [];
    try {
      const entitlements = await request("/api/themes/entitlements");
      themeIds = entitlements.themeIds || [];
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    saveUserSnapshot({ ...user, themeIds });
    return user;
  }

  async function databaseStatus() {
    return request("/auth/status");
  }

  async function restoreSession() {
    if (!getToken()) return null;
    try {
      const { user } = await request("/auth/me");
      await refreshUserSnapshot(user);
      return user;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        clearSession();
        return null;
      }
      throw error;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem("authSession");
  }

  async function logout() {
    try {
      if (getToken()) await request("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  }

  window.AuthApi = {
    serverUrl: SERVER_URL,
    hasSession: () => Boolean(getToken()),
    request,
    databaseStatus,
    login: (username, password) => request("/auth/login", {
      method: "POST",
      body: { username, password }
    }),
    register: (username, password, email) => request("/auth/register", {
      method: "POST",
      body: { username, password, ...(email ? { email } : {}) }
    }),
    storeSession,
    refreshUserSnapshot,
    restoreSession,
    clearSession,
    logout
  };
})();
