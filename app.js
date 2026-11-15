// Backend server configuration
const RENDER_SERVER_URL = "https://trolyao-1.onrender.com";
const LOCAL_SERVER_URL = "http://localhost:4000";

// Determine server URL based on environment
const SERVER_URL =
  globalThis.location?.hostname === "localhost" || globalThis.location?.hostname === "127.0.0.1"
    ? LOCAL_SERVER_URL
    : RENDER_SERVER_URL;

// Chat remains available when the optional Socket.IO CDN is unavailable.
const socket = typeof globalThis.io === "function" ? globalThis.io(SERVER_URL) : null;

if (socket) {
  socket.on("connect", () => {
    console.log("✅ Socket connected to server:", SERVER_URL);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  socket.on("users", (users) => {
    if (!Array.isArray(users)) return;
    activeUsers = new Map(users.map(user => [user.username, user]));
    updateOnlineUsersDisplay(users);
  });

  socket.on("kicked", () => {
    alert("Bạn đã bị admin kick!");
    logoutUser();
  });
}

// Pusher real-time admin features are disabled; the backend no longer exposes unauthenticated Pusher routes.

// Backend dùng OPENROUTER_API_KEY (local: npm start; production: Render + env).
const CHAT_API_URL = `${SERVER_URL}/chat`;

const OPENROUTER_MODEL = "openai/gpt-4o-mini";

// Global state
const conversationHistory = [];
let isDeepAnalysisMode = false;
let studyStartTime = Date.now();
let currentTokens = 0;
let currentChatId = null;

// Authentication variables
const authModal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const closeModal = document.getElementById('close-modal');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const switchToRegister = document.getElementById('switch-to-register');
const switchText = document.getElementById('switch-text');

// Admin panel variables
const adminModal = document.getElementById('admin-modal');
const closeAdminModal = document.getElementById('close-admin-modal');
const activeUsersList = document.getElementById('active-users-list');
const timeLimitInput = document.getElementById('time-limit');
const setTimeLimitBtn = document.getElementById('set-time-limit');
const totalUsersSpan = document.getElementById('total-users');
const onlineUsersSpan = document.getElementById('online-users');
const serverTimeSpan = document.getElementById('server-time');

// Admin state
let activeUsers = new Map(); // Track active users (now managed by Socket.IO)
let timeLimit = null; // Time limit in minutes
let serverStartTime = Date.now();

// DOM Elements
const chatBody = document.getElementById("chat-body");
const input = document.getElementById("user-input");
const imageInput = document.getElementById("image-input");
const sendBtn = document.getElementById("send-btn");
const uploadBtn = document.getElementById("upload-btn");
const fileInfo = document.getElementById("file-info");
const fileName = document.getElementById("file-name");
const fileRemove = document.getElementById("file-remove");
const themeToggle = document.getElementById("theme-toggle");
const quickTags = document.getElementById("quick-tags");
const newChatButton = document.getElementById("new-chat-btn");
const chatSearch = document.getElementById("chat-search");
const chatHistoryList = document.getElementById("chat-history-list");

// Sidebar elements
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebar-close");
const overlay = document.getElementById("overlay");
const userAvatar = document.getElementById("user-avatar");
const avatarUpload = document.getElementById("avatar-upload");
const changeAvatarBtn = document.getElementById("change-avatar-btn");
const userAvatarContainer = document.getElementById("user-avatar-container");
const tokenCount = document.getElementById("token-count");
const themeToggleMenu = document.getElementById("theme-toggle-menu");
const logoutBtn = document.getElementById("logout-btn");

// Background color themes data
const colorThemes = [
  // Regular colors - FREE (price: 0)
  { id: 1, name: "Xanh dương", price: 0, primary: "#3B82F6", secondary: "#1E40AF", bg: "#EFF6FF", tier: "basic" },
  { id: 2, name: "Xanh lá", price: 0, primary: "#10B981", secondary: "#047857", bg: "#F0FDF4", tier: "basic" },
  { id: 3, name: "Tím", price: 0, primary: "#8B5CF6", secondary: "#6D28D9", bg: "#F5F3FF", tier: "basic" },
  { id: 4, name: "Hồng", price: 0, primary: "#EC4899", secondary: "#BE185D", bg: "#FDF2F8", tier: "basic" },
  { id: 5, name: "Vàng", price: 0, primary: "#F59E0B", secondary: "#D97706", bg: "#FFFBEB", tier: "basic" },
  { id: 6, name: "Cam", price: 0, primary: "#F97316", secondary: "#EA580C", bg: "#FFF7ED", tier: "basic" },
  { id: 7, name: "Đỏ", price: 0, primary: "#EF4444", secondary: "#DC2626", bg: "#FEF2F2", tier: "basic" },
  { id: 8, name: "Xám", price: 0, primary: "#6B7280", secondary: "#4B5563", bg: "#F9FAFB", tier: "basic" },
  { id: 9, name: "Xanh ngọc", price: 0, primary: "#14B8A6", secondary: "#0F766E", bg: "#F0FDFA", tier: "basic" },
  { id: 10, name: "Xám xanh", price: 0, primary: "#6366F1", secondary: "#4F46E5", bg: "#EEF2FF", tier: "basic" },
  { id: 11, name: "Xám đỏ", price: 0, primary: "#A855F7", secondary: "#9333EA", bg: "#FAF5FF", tier: "basic" },
  { id: 12, name: "Xám hồng", price: 0, primary: "#F472B6", secondary: "#EC4899", bg: "#FDF4FF", tier: "basic" },
  { id: 13, name: "Nâu", price: 0, primary: "#92400E", secondary: "#78350F", bg: "#FEF3C7", tier: "basic" },
  { id: 14, name: "Xanh đậm", price: 50, primary: "#1E40AF", secondary: "#1E3A8A", bg: "#DBEAFE", tier: "premium" },
  { id: 15, name: "Xám đậm", price: 50, primary: "#374151", secondary: "#111827", bg: "#F3F4F6", tier: "premium" },
  { id: 16, name: "Xám nhạt", price: 0, primary: "#D1D5DB", secondary: "#9CA3AF", bg: "#F9FAFB", tier: "basic" },
  // Special exclusive colors - HIGH PRICE with unlock
  { id: 17, name: "Vàng Kim", price: 200, primary: "#FFD700", secondary: "#B8860B", bg: "#FFFAF0", tier: "exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-gold" },
  { id: 18, name: "Bạc", price: 150, primary: "#C0C0C0", secondary: "#808080", bg: "#F5F5F5", tier: "exclusive", unlockRequired: true, icon: "🥈", cssClass: "theme-silver" },
  { id: 19, name: "Đồng", price: 100, primary: "#CD7F32", secondary: "#8B4513", bg: "#FFF8DC", tier: "exclusive", unlockRequired: true, icon: "🥉", cssClass: "theme-bronze" },
  { id: 20, name: "Cầu Vồng", price: 300, primary: "#FF6B6B", secondary: "#4ECDC4", bg: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)", tier: "exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow" },
  // Premium exclusive colors - VERY HIGH PRICE with unlock + special effects
  { id: 25, name: "Holographic", price: 1000, primary: "#FF00FF", secondary: "#00FFFF", bg: "linear-gradient(45deg, #FF00FF, #00FFFF, #FF00FF)", tier: "premium-exclusive", unlockRequired: true, icon: "✨", cssClass: "theme-holographic" },
  { id: 26, name: "Rainbow", price: 1200, primary: "#FF0000", secondary: "#9400D3", bg: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow-premium" },
  { id: 27, name: "Galaxy", price: 1500, primary: "#4B0082", secondary: "#000000", bg: "radial-gradient(ellipse at center, #4B0082, #000000, #191970)", tier: "premium-exclusive", unlockRequired: true, icon: "🌌", cssClass: "theme-galaxy" },
  { id: 28, name: "Aurora", price: 1400, primary: "#39FF14", secondary: "#FF1493", bg: "linear-gradient(135deg, #39FF14, #00CED1, #FF1493)", tier: "premium-exclusive", unlockRequired: true, icon: "🌠", cssClass: "theme-aurora" },
  { id: 29, name: "Phoenix", price: 1300, primary: "#FF4500", secondary: "#FFD700", bg: "linear-gradient(180deg, #FF4500, #FF6347, #FFD700)", tier: "premium-exclusive", unlockRequired: true, icon: "🔥", cssClass: "theme-phoenix" },
  { id: 30, name: "Cyberpunk", price: 1100, primary: "#FFFF00", secondary: "#FF00FF", bg: "linear-gradient(135deg, #000000, #FFFF00, #FF00FF)", tier: "premium-exclusive", unlockRequired: true, icon: "⚡", cssClass: "theme-cyberpunk" },
  // New premium colors - ULTRA HIGH PRICE
  { id: 31, name: "💎 Diamond", price: 2000, primary: "#00CED1", secondary: "#B0E0E6", bg: "linear-gradient(135deg, #E0F7FA, #00CED1, #FFFFFF)", tier: "premium-exclusive", unlockRequired: true, icon: "💎", cssClass: "theme-diamond" },
  { id: 32, name: "🔮 Royal Amethyst", price: 1800, primary: "#9966CC", secondary: "#663399", bg: "linear-gradient(145deg, #E6E6FA, #9966CC, #4B0082)", tier: "premium-exclusive", unlockRequired: true, icon: "🔮", cssClass: "theme-amethyst" },
  { id: 33, name: "🌅 Sunset Gold", price: 1600, primary: "#FF8C00", secondary: "#FF6347", bg: "linear-gradient(180deg, #FFD700, #FF8C00, #FF6347)", tier: "premium-exclusive", unlockRequired: true, icon: "🌅", cssClass: "theme-sunset" },
  { id: 34, name: "🧊 Frozen Ice", price: 1700, primary: "#00FFFF", secondary: "#E0FFFF", bg: "linear-gradient(135deg, #E0FFFF, #00FFFF, #87CEEB)", tier: "premium-exclusive", unlockRequired: true, icon: "🧊", cssClass: "theme-ice" },
  { id: 35, name: "🌊 Ocean Deep", price: 1900, primary: "#006994", secondary: "#003366", bg: "linear-gradient(180deg, #00CED1, #006994, #003366)", tier: "premium-exclusive", unlockRequired: true, icon: "🌊", cssClass: "theme-ocean" },
  { id: 36, name: "🔥 Magma", price: 1750, primary: "#FF4500", secondary: "#8B0000", bg: "linear-gradient(180deg, #FFD700, #FF4500, #8B0000)", tier: "premium-exclusive", unlockRequired: true, icon: "🌋", cssClass: "theme-magma" },
  { id: 37, name: "🌸 Sakura", price: 1650, primary: "#FFB7C5", secondary: "#FF69B4", bg: "linear-gradient(135deg, #FFF0F5, #FFB7C5, #FF69B4)", tier: "premium-exclusive", unlockRequired: true, icon: "🌸", cssClass: "theme-sakura" },
  { id: 38, name: "🌲 Emerald Forest", price: 1550, primary: "#50C878", secondary: "#228B22", bg: "linear-gradient(145deg, #98FB98, #50C878, #228B22)", tier: "premium-exclusive", unlockRequired: true, icon: "🌲", cssClass: "theme-emerald" },
  { id: 39, name: "⭐ Starlight", price: 1850, primary: "#FFD700", secondary: "#C0C0C0", bg: "radial-gradient(ellipse at center, #1a1a2e, #16213e, #0f3460)", tier: "premium-exclusive", unlockRequired: true, icon: "⭐", cssClass: "theme-starlight" },
  { id: 40, name: "🌙 Midnight", price: 1950, primary: "#191970", secondary: "#000080", bg: "linear-gradient(180deg, #2C3E50, #191970, #000000)", tier: "premium-exclusive", unlockRequired: true, icon: "🌙", cssClass: "theme-midnight" },
  { id: 41, name: "⚜️ Golden Royal", price: 2500, primary: "#D4AF37", secondary: "#B8860B", bg: "linear-gradient(145deg, #FFF8DC, #D4AF37, #B8860B)", tier: "premium-exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-royal" },
  { id: 42, name: "🌈 Prism", price: 3000, primary: "#FF1493", secondary: "#00BFFF", bg: "conic-gradient(from 0deg, #FF1493, #FFD700, #00FF00, #00BFFF, #FF1493)", tier: "premium-exclusive", unlockRequired: true, icon: "💫", cssClass: "theme-prism" }
];

// Authentication system functions
function showAuthModal() {
  authModal.classList.add('active');
}

function hideAuthModal() {
  authModal.classList.remove('active');
}

function switchToRegisterMode() {
  modalTitle.textContent = 'Đăng ký';
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  switchText.innerHTML = 'Đã có tài khoản? <a href="#" id="switch-to-login">Đăng nhập</a>';
  document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    switchToLoginMode();
  });
}

function switchToLoginMode() {
  modalTitle.textContent = 'Đăng nhập';
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  switchText.innerHTML = 'Chưa có tài khoản? <a href="#" id="switch-to-register">Đăng ký ngay</a>';
  document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    switchToRegisterMode();
  });
}

async function hashPassword(password) {
  const utf8Binary = encodeURIComponent(password).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  const bytes = Uint8Array.from(utf8Binary, character => character.charCodeAt(0));

  if (!globalThis.crypto?.subtle) {
    return `base64:utf8:${btoa(utf8Binary)}`;
  }

  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
  return `sha256:${hash}`;
}

async function comparePassword(candidatePassword, storedPassword) {
  if (typeof storedPassword !== "string") return false;
  const hashedCandidate = await hashPassword(candidatePassword);
  if (storedPassword === hashedCandidate) return true;

  try {
    const utf8Binary = encodeURIComponent(candidatePassword).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
    const utf8Base64 = btoa(utf8Binary);
    let legacyBase64 = null;
    try {
      legacyBase64 = btoa(candidatePassword);
    } catch {
      // Older accounts could not be created with non-ASCII passwords.
    }
    return storedPassword === legacyBase64
      || storedPassword === `sha256:${legacyBase64}`
      || storedPassword === `sha256:${utf8Base64}`;
  } catch {
    return false;
  }
}

async function registerUser(username, password) {
  let databaseConfigured;
  try {
    databaseConfigured = (await window.AuthApi.databaseStatus()).databaseConfigured;
  } catch (error) {
    return { success: false, message: `Không kết nối được máy chủ xác thực: ${error.message}` };
  }
  if (databaseConfigured) {
    try {
      const result = await window.AuthApi.register(username, password);
      await window.AuthApi.storeSession(result);
      loadUserData(username);
      return { success: true, message: 'Tạo tài khoản server thành công.' };
    } catch (error) {
      return { success: false, message: error.message || 'Không thể tạo tài khoản server.' };
    }
  }

  return {
    success: false,
    message: 'Chưa thể tạo tài khoản mới vì PostgreSQL trên máy chủ chưa được cấu hình. Dữ liệu LocalStorage cũ vẫn được giữ nguyên.'
  };
}

async function loginUser(username, password) {
  let databaseConfigured;
  try {
    databaseConfigured = (await window.AuthApi.databaseStatus()).databaseConfigured;
  } catch (error) {
    return { success: false, message: `Không kết nối được máy chủ xác thực: ${error.message}` };
  }
  if (databaseConfigured) {
    try {
      const result = await window.AuthApi.login(username, password);
      await window.AuthApi.storeSession(result);
      socket?.emit("join", { username });
      loadUserData(username);
      return { success: true, message: 'Đăng nhập server thành công.' };
    } catch (error) {
      return { success: false, message: error.message || 'Không thể đăng nhập.' };
    }
  }

  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[username]?.serverAccount) {
    const legacyUsers = JSON.parse(localStorage.getItem('legacyUsers') || '{}');
    if (legacyUsers[username]) {
      users[username] = legacyUsers[username];
      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  if (!users[username]) {
    return { success: false, message: 'User not found!' };
  }

  const user = users[username];
  if (!(await comparePassword(password, user.password))) {
    return { success: false, message: 'Incorrect password!' };
  }
  if (!user.password.startsWith('sha256:')) {
    user.password = await hashPassword(password);
    users[username] = user;
    localStorage.setItem('users', JSON.stringify(users));
  }

  localStorage.setItem('currentUser', username);

  // Emit join event to server
  socket?.emit("join", { username });

  loadUserData(username);
  return { success: true, message: 'Đăng nhập cục bộ thành công. Token chỉ thay đổi theo dữ liệu đã lưu.' };
}

function logoutUser() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    saveUserData(currentUser);
  }
  if (window.AuthApi?.hasSession()) {
    window.AuthApi.logout().catch(error => {
      console.error("Server logout failed:", error.message);
    });
  }
  currentChatId = null;
  conversationHistory.length = 0;
  chatBody.replaceChildren();
  localStorage.removeItem('currentUser');
  renderChatHistory();
  showAuthModal();
}

function loadUserData(username) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const user = users[username];

  console.log('Loading user data for:', username);
  console.log('User found:', !!user);

  if (user) {
    localStorage.setItem('userAvatar', user.avatar || '');
    localStorage.setItem('userTokens', user.tokens.toString());
    localStorage.setItem('userName', username);
    localStorage.setItem('purchasedColors', JSON.stringify(user.purchasedColors || []));
    localStorage.setItem('selectedColorTheme', user.selectedColorTheme || '0');

    console.log('Setting user name to:', username);

    updateAvatarDisplay();
    updateTokenDisplay();

    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = username;
      console.log('User name element updated to:', username);
    } else {
      console.error('user-name element not found!');
    }

    initColorThemes();

    const selectedTheme = localStorage.getItem('selectedColorTheme');
    if (selectedTheme !== '0') {
      const theme = colorThemes.find(t => t.id === parseInt(selectedTheme));
      if (theme) {
        applyColorTheme(theme);
      }
    }
  }
}

function saveUserData(username) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (users[username]) {
    users[username].avatar = localStorage.getItem('userAvatar') || '';
    if (!users[username].serverAccount) {
      users[username].tokens = parseInt(localStorage.getItem('userTokens') || '0');
      users[username].purchasedColors = JSON.parse(localStorage.getItem('purchasedColors') || '[]');
      users[username].selectedColorTheme = localStorage.getItem('selectedColorTheme') || '0';
    }

    localStorage.setItem('users', JSON.stringify(users));
  }
}

function getCurrentUser() {
  return localStorage.getItem('currentUser');
}

function checkAuthStatus() {
  const savedUser = getCurrentUser();
  if (savedUser) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[savedUser]) {
      if (users[savedUser].serverAccount && !window.AuthApi?.hasSession()) {
        return false;
      }
      // Check if user is banned
      const banStatus = checkUserBan();
      if (banStatus.isBanned) {
        showAuthModal();
        addMessage(`?? Tài khóa?n ?ã b?i khóa! Vui lòng quay la?i sau ${banStatus.remainingTime} phút.`, "bot");
        return false;
      }

      // Load user data from localStorage (not from temporary variable)
      loadUserData(savedUser);
      trackUserActivity(savedUser);
      return true;
    }
  }
  return false;
}

// Admin panel functions
function showAdminPanel() {
  adminModal.classList.add('active');
  updateAdminPanel();
  startAdminUpdates();
}

function hideAdminPanel() {
  adminModal.classList.remove('active');
  stopAdminUpdates();
}

function updateAdminPanel() {
  updateActiveUsersList();
  updateSystemInfo();
}

function trackUserActivity(username) {
  if (!activeUsers.has(username)) {
    activeUsers.set(username, {
      loginTime: Date.now(),
      lastActivity: Date.now(),
      avatar: localStorage.getItem('userAvatar') || ''
    });
  } else {
    const user = activeUsers.get(username);
    user.lastActivity = Date.now();
    activeUsers.set(username, user);
  }
}

function updateActiveUsersList() {
  if (totalUsersSpan) {
    try { totalUsersSpan.textContent = Object.keys(JSON.parse(localStorage.getItem("users") || "{}")).length; }
    catch { totalUsersSpan.textContent = "—"; }
  }
  if (onlineUsersSpan) onlineUsersSpan.textContent = activeUsers.size;
  if (activeUsersList) {
    activeUsersList.replaceChildren();
    const notice = document.createElement("p");
    notice.className = "user-status";
    notice.textContent = "Các thao tác quản trị đang tạm khóa cho đến khi có đăng nhập và phân quyền an toàn phía máy chủ.";
    activeUsersList.appendChild(notice);
  }
}

function kickUser() {
  addMessage("Chức năng quản trị đang tạm khóa để bảo vệ tài khoản.", "bot");
}

// Update online users display from Socket.io
function updateOnlineUsersDisplay(users) {
  if (onlineUsersSpan) onlineUsersSpan.textContent = Array.isArray(users) ? users.length : 0;
  if (!activeUsersList) return;
  activeUsersList.replaceChildren();
  const notice = document.createElement("p");
  notice.className = "user-status";
  notice.textContent = "Danh sách online chỉ dùng để hiển thị; công cụ quản trị đang khóa.";
  activeUsersList.appendChild(notice);
}

function updateSystemInfo() {
  const now = new Date();
  serverTimeSpan.textContent = now.toLocaleTimeString('vi-VN');
}

function setTimeLimit() {
  const limit = parseInt(timeLimitInput.value);
  if (limit > 0 && limit <= 999) {
    timeLimit = limit;
    localStorage.setItem('timeLimit', timeLimit.toString());
    addMessage(`⏰ Đã đặt giới hạn thời gian truy cập: ${limit} phút`, "bot");
  } else {
    addMessage("❌ Vui lòng nhập thời gian hợp lệ (1-999 phút)!", "bot");
  }
}

function checkTimeLimit() {
  const currentUser = getCurrentUser();
  if (timeLimit && currentUser) {
    const userData = activeUsers.get(currentUser);
    if (userData) {
      const onlineTime = Math.floor((Date.now() - userData.loginTime) / 60000);
      if (onlineTime >= timeLimit) {
        addMessage(`⏰ Hết thời gian truy cập (${timeLimit} phút). Bạn sẽ được đăng xuất tự động!`, "bot");
        setTimeout(() => {
          logoutUser();
        }, 3000);
      }
    }
  }
}

let adminUpdateInterval;

function startAdminUpdates() {
  updateAdminPanel();
  adminUpdateInterval = setInterval(() => {
    updateAdminPanel();
    checkTimeLimit();
  }, 5000); // Update every 5 seconds
}

function stopAdminUpdates() {
  if (adminUpdateInterval) {
    clearInterval(adminUpdateInterval);
    adminUpdateInterval = null;
  }
}

// Initialize localStorage data
function initLocalStorage() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
  }

  if (!localStorage.getItem('userBans')) {
    localStorage.setItem('userBans', JSON.stringify({}));
  }

  if (!localStorage.getItem('userAvatar')) {
    localStorage.setItem('userAvatar', '');
  }
  if (!localStorage.getItem('userTokens')) {
    localStorage.setItem('userTokens', '0');
  }
  if (!localStorage.getItem('userName')) {
    localStorage.setItem('userName', 'Người dùng');
  }
  if (!localStorage.getItem('selectedColorTheme')) {
    localStorage.setItem('selectedColorTheme', '0');
  }
  if (!localStorage.getItem('purchasedColors')) {
    localStorage.setItem('purchasedColors', JSON.stringify([]));
  }

}

// Check if current user is banned
function checkUserBan() {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return false;

  const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
  const banInfo = bans[currentUser];

  if (banInfo && banInfo.until > Date.now()) {
    const remainingTime = Math.ceil((banInfo.until - Date.now()) / 60000);
    return {
      isBanned: true,
      remainingTime: remainingTime,
      until: new Date(banInfo.until)
    };
  }

  return { isBanned: false };
}

// Authentication event listeners
closeModal.addEventListener('click', hideAuthModal);
switchToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  switchToRegisterMode();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const submitButton = loginForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await loginUser(username, password);
    if (result.success) {
      hideAuthModal();
      addMessage(result.message, "bot");
      initAI();
      renderChatHistory();
      loginForm.reset();
    } else {
      addMessage(result.message, "bot");
    }
  } catch (error) {
    console.error("Login failed:", error);
    addMessage("Không thể xác thực tài khoản trên trình duyệt này. Hãy thử lại.", "bot");
  } finally {
    submitButton.disabled = false;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;

  if (password !== confirmPassword) {
    addMessage("Mật khẩu xác nhận không khớp.", "bot");
    return;
  }

  if (password.length < 8 || password.length > 128) {
    addMessage("Mật khẩu cần có từ 8 đến 128 ký tự.", "bot");
    return;
  }

  const submitButton = registerForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await registerUser(username, password);
    if (result.success) {
      addMessage(result.message, "bot");
      switchToLoginMode();
      registerForm.reset();
    } else {
      addMessage(result.message, "bot");
    }
  } catch (error) {
    console.error("Registration failed:", error);
    addMessage("Không thể tạo tài khoản trên trình duyệt này. Hãy thử lại.", "bot");
  } finally {
    submitButton.disabled = false;
  }
});

// Sidebar functionality
function updateMenuToggle(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Đóng menu" : "Mở menu");
  menuToggle.title = isOpen ? "Đóng menu" : "Mở menu";
}

function openSidebar() {
  if (window.matchMedia("(min-width: 900px)").matches) {
    const collapsed = document.body.classList.toggle("sidebar-collapsed");
    updateMenuToggle(!collapsed);
    return;
  }
  sidebar.classList.add('open');
  overlay.classList.add('active');
  updateMenuToggle(true);
}

function closeSidebar() {
  if (window.matchMedia("(min-width: 900px)").matches) {
    document.body.classList.add("sidebar-collapsed");
    updateMenuToggle(false);
    return;
  }
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  updateMenuToggle(false);
}

menuToggle.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

function syncSidebarForViewport() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  updateMenuToggle(
    window.matchMedia("(min-width: 900px)").matches &&
    !document.body.classList.contains("sidebar-collapsed")
  );
}

window.addEventListener('resize', syncSidebarForViewport);
syncSidebarForViewport();

// Avatar upload functionality
changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
userAvatarContainer.addEventListener('click', () => avatarUpload.click());

avatarUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      // Resize large images before storing
      resizeAvatarImage(dataUrl, (resizedDataUrl) => {
        localStorage.setItem('userAvatar', resizedDataUrl);
        const currentUser = getCurrentUser();
        if (currentUser) {
          saveUserData(currentUser);
        }
        updateAvatarDisplay();
      });
    };
    reader.readAsDataURL(file);
  }
});

function resizeAvatarImage(dataUrl, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set maximum size for avatar
    const maxSize = 200;
    let width = img.width;
    let height = img.height;

    // Calculate new dimensions
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Draw and resize image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert back to data URL
    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    callback(resizedDataUrl);
  };
  img.src = dataUrl;
}

function updateAvatarDisplay() {
  const savedAvatar = localStorage.getItem('userAvatar');
  if (savedAvatar) {
    userAvatar.src = savedAvatar;
    userAvatar.style.display = 'block';
  } else {
    userAvatar.style.display = 'none';
  }
}

// Color theme system
function initColorThemes() {
  const colorGrid = document.getElementById('color-grid');
  if (!colorGrid) return;

  colorGrid.innerHTML = '';
  const purchasedColors = JSON.parse(localStorage.getItem('purchasedColors') || '[]');
  const selectedTheme = localStorage.getItem('selectedColorTheme');

  colorThemes.forEach(theme => {
    const themeItem = document.createElement('div');
    themeItem.className = 'color-item';
    if (theme.id === parseInt(selectedTheme)) {
      themeItem.classList.add('selected');
    }

    const isPurchased = purchasedColors.includes(theme.id) ||
      (window.AuthApi?.hasSession() && theme.price === 0 && !theme.unlockRequired);
    const canAfford = currentTokens >= theme.price;
    const isLocked = theme.unlockRequired && !isPurchased;

    // Add locked class if not purchased
    if (!isPurchased) {
      themeItem.classList.add('locked');
    }
    // Add tier-based class for exclusive/premium-exclusive colors
    if (theme.tier === 'exclusive' || theme.tier === 'premium-exclusive') {
      themeItem.classList.add(theme.tier);
    }

    // Set CSS variables for preview
    themeItem.style.setProperty('--color-primary', theme.primary);
    themeItem.style.setProperty('--color-secondary', theme.secondary);

    // Determine price display
    let priceDisplay;
    if (isPurchased) {
      priceDisplay = '<div class="color-owned">✅ Đã sở hữu</div>';
    } else if (isLocked) {
      priceDisplay = '<div class="color-price exclusive-price">🔒 Cần mở khóa</div>';
    } else if (theme.price === 0) {
      priceDisplay = '<div class="color-price free">🆓 Miễn phí</div>';
    } else {
      priceDisplay = `<div class="color-price">${theme.price} tokens</div>`;
    }

    // Add icon for exclusive colors only
    const iconDisplay = theme.icon ? `<div class="color-icon">${theme.icon}</div>` : '';

    themeItem.innerHTML = `
      <div class="color-preview ${theme.cssClass || ''}" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});${!isPurchased ? ' opacity: 0.7;' : ''}" title="${theme.name}">
        ${iconDisplay}
      </div>
      <div class="color-name">${theme.name}</div>
      ${priceDisplay}
    `;

    themeItem.addEventListener('click', () => {
      selectColorTheme(theme);
    });
    colorGrid.appendChild(themeItem);
  });
}

async function selectColorTheme(theme) {
  const purchasedColors = JSON.parse(localStorage.getItem('purchasedColors') || '[]');

  if (window.AuthApi?.hasSession()) {
    const alreadyOwned = purchasedColors.includes(theme.id) ||
      (theme.price === 0 && !theme.unlockRequired);
    if (theme.unlockRequired && !purchasedColors.includes(theme.id)) {
      addMessage(`Màu ${theme.name} chỉ Admin mới có thể cấp.`, "bot");
      return;
    }
    try {
      if (!alreadyOwned) {
        await window.AuthApi.request(`/api/themes/${theme.id}/purchase`, { method: "POST" });
        const user = await window.AuthApi.restoreSession();
        if (user) currentTokens = Number(user.tokenBalance) || 0;
        updateTokenDisplay();
      }
      await window.AuthApi.request("/api/themes/selected", {
        method: "PUT",
        body: { themeId: String(theme.id) }
      });
      localStorage.setItem('selectedColorTheme', String(theme.id));
      applyColorTheme(theme);
      initColorThemes();
      addMessage(`Đã áp dụng màu ${theme.name}!`, "bot");
    } catch (error) {
      addMessage(error.message || "Không thể cập nhật màu trên máy chủ.", "bot");
    }
    return;
  }

  if (!purchasedColors.includes(theme.id)) {
    // Check if it's an exclusive color that needs unlocking in token shop
    if (theme.unlockRequired) {
      addMessage(`🔒 Màu ${theme.name} cần được mở khóa trong Cửa Hàng Token trước!`, "bot");
      return;
    }

    // Purchase color theme
    if (currentTokens >= theme.price) {
      // ✅ FIX: Không âm - Math.max(0, ...) đảm bảo token không bao giờ âm
      currentTokens = Math.max(0, currentTokens - theme.price);
      localStorage.setItem('userTokens', currentTokens.toString());
      purchasedColors.push(theme.id);
      localStorage.setItem('purchasedColors', JSON.stringify(purchasedColors));

      const currentUser = getCurrentUser();
      if (currentUser) {
        // Update tokens in users object
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[currentUser]) {
          // ✅ FIX: Đảm bảo token không âm trong users object
          users[currentUser].tokens = Math.max(0, currentTokens);
          users[currentUser].purchasedColors = purchasedColors;
          localStorage.setItem('users', JSON.stringify(users));
        }
        saveUserData(currentUser);
      }

      updateTokenDisplay();
      initColorThemes();
      addMessage(`Bạn đã mua màu ${theme.name} với ${theme.price} tokens!`, "bot");
    } else {
      addMessage(`Bạn cần ${theme.price} tokens để mua màu này. Hiện tại bạn có ${currentTokens} tokens.`, "bot");
    }
  } else {
    // Apply color theme
    localStorage.setItem('selectedColorTheme', theme.id.toString());
    const currentUser = getCurrentUser();
    if (currentUser) {
      // Update selected theme in users object
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[currentUser]) {
        users[currentUser].selectedColorTheme = theme.id.toString();
        localStorage.setItem('users', JSON.stringify(users));
      }
      saveUserData(currentUser);
    }
    applyColorTheme(theme);
    initColorThemes();
    addMessage(`Đã áp dụng màu ${theme.name}!`, "bot");
  }
}

function applyColorTheme(theme) {
  window.ThemeManager?.setColorTheme(String(theme.id));
  document.documentElement.style.setProperty('--ai-primary', theme.primary);
  document.documentElement.style.setProperty('--ai-primary-hover', theme.secondary);
  document.documentElement.style.setProperty('--ai-accent', theme.secondary);
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--primary-hover', theme.secondary);
  document.documentElement.style.setProperty('--primary-light', theme.bg);
  // AI chat box background follows user's purchased theme
  document.documentElement.style.setProperty('--bot-bg', theme.bg);

  // Apply full theme background (for premium themes use full color)
  if (theme.tier === 'premium-exclusive' && theme.bg.includes('gradient')) {
    document.body.style.setProperty('background', theme.bg, 'important');
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.setProperty(
      'background',
      `linear-gradient(145deg, ${theme.bg} 0%, ${theme.primary}15 50%, ${theme.bg} 100%)`,
      'important'
    );
    document.body.style.backgroundAttachment = '';
  }

  // Remove all exclusive theme effect classes
  document.body.classList.remove(
    'theme-gold-active', 'theme-silver-active', 'theme-bronze-active', 'theme-rainbow-active',
    'theme-holographic-active', 'theme-rainbow-premium-active', 'theme-galaxy-active',
    'theme-aurora-active', 'theme-phoenix-active', 'theme-cyberpunk-active',
    // New premium colors
    'theme-diamond-active', 'theme-amethyst-active', 'theme-sunset-active', 'theme-ice-active',
    'theme-ocean-active', 'theme-magma-active', 'theme-sakura-active', 'theme-emerald-active',
    'theme-starlight-active', 'theme-midnight-active', 'theme-royal-active', 'theme-prism-active'
  );

  // Remove wave animation
  removeWaveAnimation();

  // Only add special effect class for EXCLUSIVE colors (tier: exclusive or premium-exclusive)
  if (theme.cssClass && (theme.tier === 'exclusive' || theme.tier === 'premium-exclusive')) {
    const activeClass = theme.cssClass + '-active';
    document.body.classList.add(activeClass);
    // Add wave animation for premium themes
    addWaveAnimation();
  }
}

// ========== WAVE ANIMATION FUNCTIONS ==========
function addWaveAnimation() {
  if (document.getElementById('wave-animation')) return;

  const waveContainer = document.createElement('div');
  waveContainer.id = 'wave-animation';
  waveContainer.className = 'wave-container';

  for (let i = 0; i < 3; i++) {
    const wave = document.createElement('div');
    wave.className = 'wave';
    waveContainer.appendChild(wave);
  }

  document.body.appendChild(waveContainer);
}

function removeWaveAnimation() {
  const waveContainer = document.getElementById('wave-animation');
  if (waveContainer) {
    waveContainer.remove();
  }
}

// Token system
function updateTokenDisplay() {
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (currentUser && users[currentUser]) {
    // ✅ FIX: Đảm bảo token không âm khi đọc từ storage
    currentTokens = Math.max(0, users[currentUser].tokens || 0);
    localStorage.setItem('userTokens', currentTokens.toString());
  } else {
    currentTokens = Math.max(0, parseInt(localStorage.getItem('userTokens') || '0'));
  }

  const tokenElement = document.getElementById('token-count');
  if (tokenElement) {
    tokenElement.textContent = currentTokens;
  }
}

function addTokens(amount) {
  if (window.AuthApi?.hasSession()) {
    throw new Error("Server-backed tokens must be granted by an authenticated API.");
  }
  // ✅ FIX: Không âm + giới hạn MAX_TOKEN = 1 triệu
  const MAX_TOKEN = 1000000;
  currentTokens = Math.min(MAX_TOKEN, Math.max(0, currentTokens) + amount);
  localStorage.setItem('userTokens', currentTokens.toString());

  const currentUser = getCurrentUser();
  if (currentUser) {
    // Update tokens in users object
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser]) {
      users[currentUser].tokens = currentTokens;
      localStorage.setItem('users', JSON.stringify(users));
    }
    saveUserData(currentUser);
  }
  updateTokenDisplay();
}

// Token reward system - 20 tokens every 10 minutes
let lastRewardTime = Date.now();
let totalSessionTime = 0;

function initTokenRewardSystem() {
  // Load last reward time from storage
  const savedRewardTime = localStorage.getItem('lastTokenRewardTime');
  if (savedRewardTime) {
    lastRewardTime = parseInt(savedRewardTime);
  }

  // Start tracking
  setInterval(checkTokenReward, 60000); // Check every minute

  // Track active time
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      totalSessionTime += 1;
    }
  }, 60000); // Add 1 minute every minute when page is visible
}

function checkTokenReward() {
  const currentUser = getCurrentUser();
  if (!currentUser) return; // Only reward logged in users

  const now = Date.now();
  const timeSinceLastReward = now - lastRewardTime;

  // Award 20 tokens every 10 minutes (600000 ms)
  if (timeSinceLastReward >= 10 * 60 * 1000) {
    if (window.AuthApi?.hasSession()) {
      lastRewardTime = now;
      window.AuthApi.request("/api/study-reward", { method: "POST" })
        .then(async (result) => {
          currentTokens = Number(result.tokenBalance) || 0;
          localStorage.setItem('userTokens', String(currentTokens));
          const user = await window.AuthApi.restoreSession();
          if (user) currentTokens = Number(user.tokenBalance) || currentTokens;
          updateTokenDisplay();
          showTokenRewardNotification(20);
        })
        .catch((error) => {
          if (error.status === 429 && Number.isFinite(error.retryAfterSeconds)) {
            lastRewardTime = Date.now() - (10 * 60 * 1000 - error.retryAfterSeconds * 1000);
            return;
          }
          console.error("Server study reward failed:", error.message);
          addMessage("Không thể nhận Token thưởng từ máy chủ. Hãy thử lại sau.", "bot");
        });
      return;
    }

    // Add tokens
    addTokens(20);

    // Update last reward time
    lastRewardTime = now;
    localStorage.setItem('lastTokenRewardTime', lastRewardTime.toString());

    // Show notification
    showTokenRewardNotification(20);

    console.log(`💎 Token reward: +20 tokens awarded to ${currentUser}`);
  }
}

function showTokenRewardNotification(amount) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
    z-index: 10000;
    font-weight: 600;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  notification.innerHTML = `💎 +${amount} Tokens! <span style="font-size: 12px; opacity: 0.9;">Cứ 10 phút nhận thưởng</span>`;

  document.body.appendChild(notification);

  // Update token display in menu
  updateTokenDisplay();

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Study time tracking (legacy - merged with token reward)
function trackStudyTime() {
  // Now handled by checkTokenReward
  checkTokenReward();
}

// Command system
function processCommand(text) {
  const command = text.toLowerCase().trim();

  if (command === '/143') {
    isDeepAnalysisMode = !isDeepAnalysisMode;
    return isDeepAnalysisMode ? "đã kích hoạt chế độ phân tích sâu 143!" : "đã tắt chế độ phân tích sâu 143!";
  } else if (command === '/tambietlop9') {
    return "🔗 Link đặc biệt: https://example.com/special-link";
  } else if (command.startsWith('/admin')) {
    return "🔒 Trang quản trị đang tạm khóa. Cần hoàn tất xác thực và phân quyền phía máy chủ trước khi mở lại.";
  } else if (command.startsWith('/token')) {
    window.location.href = 'token-shop-new.html';
    return '🎨 Đang chuyển đến Cửa Hàng Token...';
  }

  return null;
}

function sendDeviceRequest(url) {
  fetch(url).catch(err => console.log('Device request failed:', err));
}

// Note: Study room removed - now using Garden Game (trongcay.html) only

function toggleTheme() {
  if (window.ThemeManager) {
    window.ThemeManager.toggle();
    return;
  }
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  // Safe DOM access with null checks
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleMenu = document.getElementById("theme-toggle-menu");

  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀️": "🌙";
  }
  if (themeToggleMenu) {
    const menuIcon = themeToggleMenu.querySelector('.menu-icon');
    if (menuIcon) {
      menuIcon.textContent = isDark ? "☀️": "🌙";
    }
  }
}

function applyThemeFromStorage() {
  if (window.ThemeManager) {
    window.ThemeManager.applyStored();
    return;
  }
  let isDark = localStorage.getItem("theme") === "dark";
  if (!isDark) {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.body.classList.toggle("dark", isDark);

  // Safe DOM access with null checks
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleMenu = document.getElementById("theme-toggle-menu");

  if (themeToggle) {
    themeToggle.textContent = isDark ? "☀️": "🌙";
  }
  if (themeToggleMenu) {
    const menuIcon = themeToggleMenu.querySelector('.menu-icon');
    if (menuIcon) {
      menuIcon.textContent = isDark ? "☀️": "🌙";
    }
  }
}

// Message functions
function createMessageWrapper(sender) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${sender}-wrapper`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";

  if (sender === "bot") {
    avatar.textContent = "🤖";
  } else {
    const userAvatarSrc = localStorage.getItem('userAvatar');
    if (typeof userAvatarSrc === "string" && userAvatarSrc.startsWith("data:image/")) {
      const img = document.createElement("img");
      img.alt = "Ảnh đại diện";
      img.src = userAvatarSrc;
      img.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover;";
      avatar.appendChild(img);
    } else {
      avatar.textContent = "👤";
    }
  }

  wrapper.appendChild(avatar);
  return wrapper;
}

function addMessage(text, sender, isHtml = false) {
  if (sender === "user") document.body.classList.add("chat-started");
  const wrapper = createMessageWrapper(sender);

  const div = document.createElement("div");
  div.className = `message ${sender}`;

  // Always render untrusted content as text. Rich content is built with DOM APIs.
  div.textContent = String(text ?? "");

  wrapper.appendChild(div);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;

  if (globalThis.MathJax?.typesetPromise) {
    globalThis.MathJax.typesetPromise([div]).catch(() => {});
  }
  return wrapper;
}

function addTypingIndicator() {
  const wrapper = createMessageWrapper("bot");
  wrapper.id = "typing-indicator";

  const div = document.createElement("div");
  div.className = "message bot typing-indicator";
  div.innerHTML = "<span></span><span></span><span></span>";

  wrapper.appendChild(div);
  chatBody.appendChild(wrapper);
  chatBody.scrollTop = chatBody.scrollHeight;
  return wrapper;
}

function removeTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}

function setSendingState(isSending) {
  sendBtn.disabled = isSending;
  uploadBtn.disabled = isSending;
  input.disabled = isSending;
  imageInput.disabled = isSending;
  if (newChatButton) newChatButton.disabled = isSending;
  const sendLabel = document.getElementById("send-label");
  if (sendLabel) sendLabel.textContent = isSending ? "Đang gửi" : "Gửi";
  sendBtn.setAttribute("aria-label", isSending ? "Đang gửi tin nhắn" : "Gửi tin nhắn");
}

function normalizeAssistantContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text") return item.text || "";
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

async function initAI() {
  const systemInstruction = isDeepAnalysisMode ? `
Bạn là trợ lý học tập có tư duy logic cao, ưu tiên tiếng Việt. Bạn đang trong chế độ phân tích sâu 143.

Nguyên tắc trả lời:
1) Phân tích CỰC KÌ CHI TIẾT, không bỏ sót bất kì khía cạnh nào.
2) Giải thích từng bước một cách rõ ràng, có lý do luận logic.
3) Với bài tập, trình bày các bước liền mạch, có công thức rõ ràng.
4) So sánh các phương án nếu là trắc nghiệm, nêu rõ đúng/sai.
5) Luôn kết thúc với kết luận chính xác và dạy dỗ.
6) Trả lời bằng văn phong chuyên nghiệp, mạch lạc, không chia mục cứng.
` : `
Bạn là trợ lý học tập có tư duy logic cao, ưu tiên tiếng Việt.

Nguyên tắc trả lời:
1) Luôn phân tích kĩ trong nội bộ trước khi trả lời, nhất KHÔNG được lộ quá trình suy luận thô.
2) Nếu đề mơ hồ hoặc thiếu dữ liệu, chỉ hỏi lại tối đa 1-2 câu ngắn, đúng trọng tâm.
3) Trả lời bằng văn phong tự nhiên, mạch lạc, không chia mục cứng kiểu "Hiểu đề", "Phân tích", "Kiểm tra nhanh" trừ khi người dùng yêu cầu.
4) Giải thích ngắn gọn nhất đủ logic; ưu tiên kết luận rõ ràng, sau đó nêu lý do chính.
5) Với bài tập cần từng bước, trình bày các bước gọn và liền mạch, tránh lặp ý.
6) Không dùng câu rời rạc gây ngắt quãng; giữ nhịp đọc trôn tru, dễ hiểu.

Quy tắc theo loại câu hỏi:
- Toán/Lý/Hóa: giữ từng bước, có công thức và diễn giải.
- Lập trình: nêu nguyên nhân lỗi, cách sửa, ví dụ ngắn, cách test lại.
- Câu hỏi kiến thức: trả lời có cấu trúc, ngắn gọn nhất đủ ý.
`;

  conversationHistory.length = 0;
  currentChatId = null;
  conversationHistory.push({
    role: "system",
    content: systemInstruction
  });

  // Welcome message
  document.body.classList.remove("chat-started");
  addMessage("Chào bạn! Mình là trợ lý AI. Bạn có thể hỏi bài tập, nhờ giải thích khái niệm, hoặc gửi ảnh để phân tích. Hãy thử chọn một chủ đề phía trên nhé!", "bot");
}

function getChatHistoryKey() {
  const username = getCurrentUser();
  return username ? `chatHistory:${username}` : null;
}

function readChatHistory() {
  const key = getChatHistoryKey();
  if (!key) return [];

  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    const chats = JSON.parse(stored);
    if (!Array.isArray(chats)) throw new TypeError("Chat history must be an array.");
    return chats.filter(chat => chat && typeof chat.id === "string" && Array.isArray(chat.messages));
  } catch (error) {
    console.error("Could not read saved chat history:", error);
    return [];
  }
}

function chatContentToText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  const text = content
    .filter(part => part?.type === "text" && typeof part.text === "string")
    .map(part => part.text);
  if (content.some(part => part?.type === "image_url")) text.push("[Đã gửi kèm ảnh]");
  return text.join("\n").trim();
}

function persistCurrentChat() {
  const key = getChatHistoryKey();
  if (!key) return;

  const messages = conversationHistory
    .filter(message => message.role === "user" || message.role === "assistant")
    .map(message => ({ role: message.role, content: chatContentToText(message.content) }))
    .filter(message => message.content);
  const firstUserMessage = messages.find(message => message.role === "user");
  if (!firstUserMessage) return;

  currentChatId = currentChatId || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const chats = readChatHistory().filter(chat => chat.id !== currentChatId);
  chats.unshift({
    id: currentChatId,
    title: firstUserMessage.content.slice(0, 54),
    updatedAt: new Date().toISOString(),
    messages
  });
  localStorage.setItem(key, JSON.stringify(chats.slice(0, 20)));
  renderChatHistory();
}

function renderChatHistory() {
  if (!chatHistoryList) return;
  const filter = (chatSearch?.value || "").trim().toLocaleLowerCase();
  const chats = readChatHistory().filter(chat =>
    !filter || String(chat.title || "").toLocaleLowerCase().includes(filter)
  );
  chatHistoryList.replaceChildren();

  if (!chats.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = filter ? "Không tìm thấy cuộc trò chuyện phù hợp." : "Chưa có cuộc trò chuyện nào.";
    chatHistoryList.appendChild(empty);
    return;
  }

  chats.forEach(chat => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.textContent = chat.title || "Cuộc trò chuyện";
    button.setAttribute("aria-current", chat.id === currentChatId ? "true" : "false");
    button.addEventListener("click", () => openSavedChat(chat));
    chatHistoryList.appendChild(button);
  });
}

function openSavedChat(chat) {
  const systemMessage = conversationHistory.find(message => message.role === "system");
  conversationHistory.length = 0;
  if (systemMessage) conversationHistory.push(systemMessage);
  chatBody.replaceChildren();

  chat.messages.forEach(message => {
    if (!["user", "assistant"].includes(message.role) || typeof message.content !== "string") return;
    conversationHistory.push(message);
    addMessage(message.content, message.role === "assistant" ? "bot" : "user");
  });

  currentChatId = chat.id;
  renderChatHistory();
  closeSidebar();
}

function startNewChat() {
  if (sendBtn.disabled) return;
  currentChatId = null;
  chatBody.replaceChildren();
  input.value = "";
  input.style.height = "";
  imageInput.value = "";
  fileInfo.classList.add("hidden");
  fileName.textContent = "";
  initAI();
  renderChatHistory();
  closeSidebar();
}

async function updateServerStatus() {
  const statusText = document.getElementById("header-status-text");
  if (!statusText) return;

  const statusDot = statusText.closest(".header-status")?.querySelector(".status-dot");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Health check returned ${response.status}.`);
    statusText.textContent = "Máy chủ đã kết nối";
    statusDot?.classList.remove("offline");
  } catch (error) {
    console.warn("Chat server health check failed:", error);
    statusText.textContent = "Máy chủ chưa kết nối";
    statusDot?.classList.add("offline");
  } finally {
    clearTimeout(timeoutId);
  }
}

// File upload handling
uploadBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file && (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 5 * 1024 * 1024)) {
    imageInput.value = "";
    fileInfo.classList.add("hidden");
    fileName.textContent = "";
    addMessage("Ảnh không hợp lệ hoặc vượt quá 5 MB. Hãy chọn PNG, JPG, WEBP hoặc GIF nhỏ hơn.", "bot");
    return;
  }
  if (file) {
    fileName.textContent = file.name;
    fileInfo.classList.remove("hidden");
  } else {
    fileInfo.classList.add("hidden");
  }
});

fileRemove.addEventListener("click", () => {
  imageInput.value = "";
  fileInfo.classList.add("hidden");
  fileName.textContent = "";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
});

sendBtn.addEventListener("click", sendMessage);

if (quickTags) {
  quickTags.addEventListener("click", (event) => {
    const target = event.target.closest(".tag-btn");
    if (!target) return;
    const preset = target.dataset.text || "";
    input.value = preset;
    input.focus();
  });
}

async function sendMessage() {
  // Check if user is authenticated
  const currentUser = getCurrentUser();
  if (!currentUser) {
    addMessage("⚠️ Bạn cần đăng nhập để sử dụng chatbot!", "bot");
    showAuthModal();
    return;
  }

  const originalText = input.value;
  let text = originalText.trim();
  const file = imageInput.files?.[0] ?? null;

  if (!text && !file) return;

  // Check for commands
  if (text.startsWith('/')) {
    const commandResponse = processCommand(text);
    if (commandResponse !== null) {
      addMessage(text, "user");
      addMessage(commandResponse, "bot");
      input.value = '';
      input.style.height = "";
      return;
    }
  }

  text = text.replace(/\^/g, " mũ ");

  const outgoingMessages = [];
  if (text) outgoingMessages.push(addMessage(text, "user"));

  if (file) {
    const url = URL.createObjectURL(file);
    if (typeof url === "string" && url.startsWith("blob:")) {
      const imageWrapper = createMessageWrapper("user");
      const imageMessage = document.createElement("div");
      imageMessage.className = "message user";
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Ảnh người dùng tải lên";
      image.style.maxWidth = "min(100%, 420px)";
      image.style.borderRadius = "12px";
      imageMessage.appendChild(image);
      imageWrapper.appendChild(imageMessage);
      chatBody.appendChild(imageWrapper);
      chatBody.scrollTop = chatBody.scrollHeight;
      outgoingMessages.push(imageWrapper);
    }
  }

  input.value = "";
  input.style.height = "";
  setSendingState(true);

  addTypingIndicator();
  trackStudyTime(); // Track study time

  try {
    let userContent;
    if (file) {
      const base64 = await getBase64(file);
      userContent = [
        {
          type: "text",
          text: text || "Phân tích nội dung trong ảnh và trả lời theo cấu trúc logic."
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${base64}`
          }
        }
      ];
    } else {
      userContent = text;
    }

    const userMessage = {
      role: "user",
      content: userContent
    };

    const recentHistory = conversationHistory.length > 39
      ? [conversationHistory[0], ...conversationHistory.slice(-38)]
      : conversationHistory;
    const messages = [...recentHistory, userMessage];
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: isDeepAnalysisMode ? 0.3 : 0.5,
        max_tokens: isDeepAnalysisMode ? 2000 : 1500
      })
    });

    if (!response.ok) {
      let errorCode = "";
      try {
        const errorData = await response.json();
        errorCode = errorData?.error || "";
      } catch (parseError) {
        console.warn("Could not parse chat API error response:", parseError);
      }
      const requestError = new Error(errorCode || `HTTP_${response.status}`);
      requestError.status = response.status;
      throw requestError;
    }

    const data = await response.json();
    const rawReply = data?.choices?.[0]?.message?.content;
    const reply = normalizeAssistantContent(rawReply);
    if (!reply) throw new Error("AI_INVALID_RESPONSE");

    conversationHistory.push(userMessage);
    conversationHistory.push({
      role: "assistant",
      content: reply
    });
    if (conversationHistory.length > 39) {
      conversationHistory.splice(1, conversationHistory.length - 39);
    }

    removeTypingIndicator();
    addMessage(reply, "bot");
    imageInput.value = "";
    fileInfo.classList.add("hidden");
    fileName.textContent = "";
    persistCurrentChat();

  } catch (err) {
    console.error(err);
    removeTypingIndicator();
    outgoingMessages.forEach(message => message.remove());
    input.value = originalText;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;

    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("load failed")) {
      addMessage(
        `Không kết nối được máy chủ trò chuyện tại ${CHAT_API_URL}. Hãy kiểm tra kết nối mạng hoặc thử lại sau.`,
        "bot"
      );
    } else if (msg.includes("ai_not_configured")) {
      addMessage("Chưa cấu hình OPENROUTER_API_KEY trên server (Render → Environment hoặc biến môi trường khi chạy npm start).", "bot");
    } else if (msg.includes("ai_rate_limited")) {
      addMessage("Máy chủ AI đang giới hạn tần suất. Bạn thử lại sau ít phút nhé.", "bot");
    } else if (msg.includes("ai_timeout")) {
      addMessage("Máy chủ AI phản hồi quá lâu. Bạn thử gửi lại câu hỏi nhé.", "bot");
    } else if (msg.includes("ai_upstream_failed") || msg.includes("ai_connection_failed") || msg.includes("ai_invalid_response")) {
      addMessage("Máy chủ AI hiện chưa thể xử lý yêu cầu. Bạn thử lại sau nhé.", "bot");
    } else {
      addMessage(`Không gửi được câu hỏi (${err?.status || "lỗi không xác định"}). Hãy thử lại sau.`, "bot");
    }
  } finally {
    setSendingState(false);
  }
}

// Initialize everything
async function init() {
  // Fast initialization - only critical stuff first
  initLocalStorage();
  applyThemeFromStorage();
  menuToggle.setAttribute("aria-expanded", String(window.matchMedia("(min-width: 900px)").matches));
  renderChatHistory();
  updateServerStatus();

  let authenticated = false;
  let authStatusError = null;
  try {
    const { databaseConfigured } = await window.AuthApi.databaseStatus();
    const securityNote = document.querySelector(".auth-security-note");
    if (securityNote) {
      securityNote.textContent = databaseConfigured
        ? "Tài khoản và Token được xác thực trên máy chủ. Dữ liệu LocalStorage cũ được giữ riêng trên thiết bị."
        : "PostgreSQL chưa cấu hình; tài khoản chỉ lưu trên thiết bị này. Không dùng mật khẩu quan trọng.";
    }
    if (databaseConfigured) {
      authenticated = Boolean(await window.AuthApi.restoreSession());
    } else {
      if (window.AuthApi.hasSession()) window.AuthApi.clearSession();
      authenticated = checkAuthStatus();
    }
  } catch (error) {
    authStatusError = error;
  }

  if (!authenticated) {
    showAuthModal();
    if (authStatusError) {
      addMessage(`Không kiểm tra được máy chủ xác thực: ${authStatusError.message}`, "bot");
    } else if (getCurrentUser()) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[getCurrentUser()]?.serverAccount) {
        addMessage("Phiên server không còn hợp lệ. Dữ liệu LocalStorage cũ vẫn được giữ trên thiết bị.", "bot");
      }
    }
    // Defer heavy operations until after login
    setTimeout(() => {
      updateAvatarDisplay();
      updateTokenDisplay();
      initColorThemes();
    }, 100);
  } else {
    // User is logged in, load all data
    updateAvatarDisplay();
    updateTokenDisplay();
    initColorThemes();

    // Update user name display
    const currentUser = getCurrentUser();
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && currentUser) {
      userNameEl.textContent = currentUser;
    }

    // Apply saved color theme if any
    const selectedTheme = localStorage.getItem('selectedColorTheme');
    if (selectedTheme !== '0') {
      const theme = colorThemes.find(t => t.id === parseInt(selectedTheme));
      if (theme) {
        applyColorTheme(theme);
      }
    }
    // Pusher was removed with the disabled legacy admin endpoints.
}

  // Load time limit if exists
  const savedTimeLimit = localStorage.getItem('timeLimit');
  if (savedTimeLimit) {
    timeLimit = parseInt(savedTimeLimit);
    timeLimitInput.value = timeLimit;
  }

  // Initialize AI last (non-blocking)
  setTimeout(initAI, 50);

  // Start time limit checking
  setInterval(checkTimeLimit, 30000); // Check every 30 seconds

  // Initialize token reward system (20 tokens every 10 minutes)
  initTokenRewardSystem();

  // Start periodic lastActive updater for admin panel online tracking
  setInterval(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[currentUser]) {
        users[currentUser].lastActive = Date.now();
        localStorage.setItem('users', JSON.stringify(users));
      }
    }
  }, 60000); // Update every minute
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Setup event listeners that need DOM elements
  const themeToggleMenu = document.getElementById('theme-toggle-menu');
  const logoutBtn = document.getElementById('logout-btn');
  const closeAdminModal = document.getElementById('close-admin-modal');
  const setTimeLimitBtn = document.getElementById('set-time-limit');

  // Safe event listener attachment with null checks
  const safeAddListener = (element, event, handler) => {
    if (element && typeof handler === 'function') {
      element.addEventListener(event, handler);
    }
  };

  safeAddListener(themeToggleMenu, 'click', toggleTheme);
  safeAddListener(newChatButton, 'click', startNewChat);
  safeAddListener(chatSearch, 'input', renderChatHistory);
  safeAddListener(logoutBtn, 'click', logoutUser);
  safeAddListener(closeAdminModal, 'click', hideAdminPanel);
  safeAddListener(setTimeLimitBtn, 'click', setTimeLimit);

  // Initialize the application
  void init();
});