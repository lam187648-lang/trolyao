// Backend server configuration
const RENDER_SERVER_URL = "https://trolyao-51sj.onrender.com";
const LOCAL_SERVER_URL = "http://localhost:4000";

function resolveServerUrl() {
  const hostname = globalThis.location?.hostname || "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_SERVER_URL;
  }
  return RENDER_SERVER_URL;
}

// Determine server URL based on environment
const SERVER_URL = resolveServerUrl();

// Socket.io connection (safe when the script is absent or the page is not the app shell)
const socket = globalThis.io ? globalThis.io(SERVER_URL) : null;

// Socket.IO event handlers
if (socket) {
  socket.on("connect", () => {
    console.log("✅ Socket connected to server:", SERVER_URL);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
  });

  socket.on("users", (users) => {
    console.log("👥 Users online:", users);
    activeUsers = new Map(users.map(u => [u.username, u]));
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

// Global state
const conversationHistory = [];
let isDeepAnalysisMode = false;
let studyStartTime = Date.now();
let currentTokens = 0;

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
  { id: 21, name: "Holographic", price: 800, primary: "#8B5CF6", secondary: "#06B6D4", bg: "linear-gradient(135deg, #8B5CF6, #06B6D4, #F472B6)", tier: "exclusive", unlockRequired: true, icon: "✨", cssClass: "theme-holographic" },
  { id: 22, name: "Sunset", price: 600, primary: "#FF784E", secondary: "#FFB703", bg: "linear-gradient(135deg, #FF784E, #FFB703, #F59E0B)", tier: "exclusive", unlockRequired: true, icon: "🌅", cssClass: "theme-sunset" },
  { id: 23, name: "Neon", price: 700, primary: "#00F5D4", secondary: "#00BBF9", bg: "linear-gradient(135deg, #00F5D4, #00BBF9, #9B5DE5)", tier: "exclusive", unlockRequired: true, icon: "⚡", cssClass: "theme-neon" },
  { id: 24, name: "Forest", price: 500, primary: "#2E8B57", secondary: "#16A34A", bg: "linear-gradient(135deg, #2E8B57, #16A34A, #86EFAC)", tier: "exclusive", unlockRequired: true, icon: "🌿", cssClass: "theme-forest" },
  // Premium exclusive colors - VERY HIGH PRICE with unlock + special effects
  { id: 25, name: "Holographic", price: 1000, primary: "#FF00FF", secondary: "#00FFFF", bg: "linear-gradient(45deg, #FF00FF, #00FFFF, #FF00FF)", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-holographic" },
  { id: 26, name: "Rainbow", price: 1200, primary: "#FF0000", secondary: "#9400D3", bg: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow-premium" },
  { id: 27, name: "Galaxy", price: 1500, primary: "#4B0082", secondary: "#000000", bg: "radial-gradient(ellipse at center, #4B0082, #000000, #191970)", tier: "premium-exclusive", unlockRequired: true, icon: "🌌", cssClass: "theme-galaxy" },
  { id: 28, name: "Aurora", price: 1400, primary: "#39FF14", secondary: "#FF1493", bg: "linear-gradient(135deg, #39FF14, #00CED1, #FF1493)", tier: "premium-exclusive", unlockRequired: true, icon: "✨", cssClass: "theme-aurora" },
  { id: 29, name: "Phoenix", price: 1300, primary: "#FF4500", secondary: "#FFD700", bg: "linear-gradient(180deg, #FF4500, #FF6347, #FFD700)", tier: "premium-exclusive", unlockRequired: true, icon: "🔥", cssClass: "theme-phoenix" },
  { id: 30, name: "Cyberpunk", price: 1100, primary: "#FFFF00", secondary: "#FF00FF", bg: "linear-gradient(135deg, #000000, #FFFF00, #FF00FF)", tier: "premium-exclusive", unlockRequired: true, icon: "💡", cssClass: "theme-cyberpunk" },
  // New premium colors - ULTRA HIGH PRICE
  { id: 31, name: "💎 Diamond", price: 2000, primary: "#00CED1", secondary: "#B0E0E6", bg: "linear-gradient(135deg, #E0F7FA, #00CED1, #FFFFFF)", tier: "premium-exclusive", unlockRequired: true, icon: "💎", cssClass: "theme-diamond" },
  { id: 32, name: "🔮 Royal Amethyst", price: 1800, primary: "#9966CC", secondary: "#663399", bg: "linear-gradient(145deg, #E6E6FA, #9966CC, #4B0082)", tier: "premium-exclusive", unlockRequired: true, icon: "🔮", cssClass: "theme-amethyst" },
  { id: 33, name: "🌅 Sunset Gold", price: 1600, primary: "#FF8C00", secondary: "#FF6347", bg: "linear-gradient(180deg, #FFD700, #FF8C00, #FF6347)", tier: "premium-exclusive", unlockRequired: true, icon: "🌅", cssClass: "theme-sunset-gold" },
  { id: 34, name: "🧊 Frozen Ice", price: 1700, primary: "#00FFFF", secondary: "#E0FFFF", bg: "linear-gradient(135deg, #E0FFFF, #00FFFF, #87CEEB)", tier: "premium-exclusive", unlockRequired: true, icon: "🧊", cssClass: "theme-ice" },
  { id: 35, name: "🌊 Ocean Deep", price: 1900, primary: "#006994", secondary: "#003366", bg: "linear-gradient(180deg, #00CED1, #006994, #003366)", tier: "premium-exclusive", unlockRequired: true, icon: "🌊", cssClass: "theme-ocean" },
  { id: 36, name: "🔥 Magma", price: 1750, primary: "#FF4500", secondary: "#8B0000", bg: "linear-gradient(180deg, #FFD700, #FF4500, #8B0000)", tier: "premium-exclusive", unlockRequired: true, icon: "🔥", cssClass: "theme-magma" },
  { id: 37, name: "🌸 Sakura", price: 1650, primary: "#FFB7C5", secondary: "#FF69B4", bg: "linear-gradient(135deg, #FFF0F5, #FFB7C5, #FF69B4)", tier: "premium-exclusive", unlockRequired: true, icon: "🌸", cssClass: "theme-sakura" },
  { id: 38, name: "🌲 Emerald Forest", price: 1550, primary: "#50C878", secondary: "#228B22", bg: "linear-gradient(145deg, #98FB98, #50C878, #228B22)", tier: "premium-exclusive", unlockRequired: true, icon: "🌲", cssClass: "theme-emerald" },
  { id: 39, name: "⭐ Starlight", price: 1850, primary: "#FFD700", secondary: "#C0C0C0", bg: "radial-gradient(ellipse at center, #1a1a2e, #16213e, #0f3460)", tier: "premium-exclusive", unlockRequired: true, icon: "⭐", cssClass: "theme-starlight" },
  { id: 40, name: "🌙 Midnight", price: 1950, primary: "#191970", secondary: "#000080", bg: "linear-gradient(180deg, #2C3E50, #191970, #000000)", tier: "premium-exclusive", unlockRequired: true, icon: "🌙", cssClass: "theme-midnight" },
  { id: 41, name: "⚜️ Golden Royal", price: 2500, primary: "#D4AF37", secondary: "#B8860B", bg: "linear-gradient(145deg, #FFF8DC, #D4AF37, #B8860B)", tier: "premium-exclusive", unlockRequired: true, icon: "⚜️", cssClass: "theme-royal" },
  { id: 42, name: "🌈 Prism", price: 3000, primary: "#FF1493", secondary: "#00BFFF", bg: "conic-gradient(from 0deg, #FF1493, #FFD700, #00FF00, #00BFFF, #FF1493)", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-prism" },
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

function registerUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');

  if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) {
    return { success: false, message: 'Tên đăng nhập cần dài 2–24 ký tự, chỉ gồm chữ, số, dấu gạch dưới hoặc gạch ngang.' };
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return { success: false, message: 'Mật khẩu cần có từ 8 đến 128 ký tự.' };
  }

  if (users[username]) {
    return { success: false, message: 'Tên này already exists!' };
  }
  
  users[username] = {
    password: btoa(password), // Simple encoding (not secure for production)
    avatar: '',
    tokens: 100,
    purchasedColors: [],
    selectedColorTheme: '0',
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem('users', JSON.stringify(users));
  return { success: true, message: 'Registration successful!' };
}

function loginUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (!users[username]) {
    return { success: false, message: 'User not found!' };
  }
  
  const user = users[username];
  if (user.password !== btoa(password)) {
    return { success: false, message: 'Incorrect password!' };
  }
  
  localStorage.setItem('currentUser', username);
  
  // Emit join event to server
  if (socket) {
    socket.emit("join", {
      username: username,
      isAdmin: username === "admin" // tài khoản admin
    });
  }
  
  // Check if first time login
  if (!user.hasReceivedFirstBonus) {
    user.tokens = (user.tokens || 0) + 100;
    user.hasReceivedFirstBonus = true;
    users[username] = user;
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUserData(username);
    return { success: true, message: 'Login successful! 🎉 Bạn nhận được 100 tokens thưởng cho lần đăng nhập đầu tiên!' };
  } else {
    loadUserData(username);
    return { success: true, message: 'Login successful!' };
  }
}

function logoutUser() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    saveUserData(currentUser);
  }
  localStorage.removeItem('currentUser');
  showAuthModal();
}

// [rest of file unchanged]
