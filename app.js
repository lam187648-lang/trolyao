// Backend server configuration
const RENDER_SERVER_URL = "https://trolyao-51sj.onrender.com";
const LOCAL_SERVER_URL = "http://localhost:4000";

// Determine server URL based on environment
const SERVER_URL =
  globalThis.location?.hostname === "localhost" || globalThis.location?.hostname === "127.0.0.1"
    ? LOCAL_SERVER_URL
    : RENDER_SERVER_URL;

// Socket.io connection
const socket = io(SERVER_URL);

// Socket.IO event handlers
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

// Backend dùng OPENROUTER_API_KEY (local: npm start; production: Render + env).
const CHAT_API_URL = `${SERVER_URL}/chat`;

const OPENROUTER_MODEL = "openai/gpt-4o-mini";

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
  { id: 1, name: "Xanh dương", price: 100, primary: "#3B82F6", secondary: "#1E40AF", bg: "#EFF6FF" },
  { id: 2, name: "Xanh lá", price: 100, primary: "#10B981", secondary: "#047857", bg: "#F0FDF4" },
  { id: 3, name: "Tím", price: 100, primary: "#8B5CF6", secondary: "#6D28D9", bg: "#F5F3FF" },
  { id: 4, name: "Hồng", price: 100, primary: "#EC4899", secondary: "#BE185D", bg: "#FDF2F8" },
  { id: 5, name: "Vàng", price: 100, primary: "#F59E0B", secondary: "#D97706", bg: "#FFFBEB" },
  { id: 6, name: "Cam", price: 100, primary: "#F97316", secondary: "#EA580C", bg: "#FFF7ED" },
  { id: 7, name: "Đỏ", price: 100, primary: "#EF4444", secondary: "#DC2626", bg: "#FEF2F2" },
  { id: 8, name: "Xám", price: 100, primary: "#6B7280", secondary: "#4B5563", bg: "#F9FAFB" },
  { id: 9, name: "Xanh ngọc", price: 100, primary: "#14B8A6", secondary: "#0F766E", bg: "#F0FDFA" },
  { id: 10, name: "Xám xanh", price: 100, primary: "#6366F1", secondary: "#4F46E5", bg: "#EEF2FF" },
  { id: 11, name: "Xám đỏ", price: 100, primary: "#A855F7", secondary: "#9333EA", bg: "#FAF5FF" },
  { id: 12, name: "Xám hồng", price: 100, primary: "#F472B6", secondary: "#EC4899", bg: "#FDF4FF" },
  { id: 13, name: "Nâu", price: 100, primary: "#92400E", secondary: "#78350F", bg: "#FEF3C7" },
  { id: 14, name: "Xanh đậm", price: 100, primary: "#1E40AF", secondary: "#1E3A8A", bg: "#DBEAFE" },
  { id: 15, name: "Xám đậm", price: 100, primary: "#374151", secondary: "#111827", bg: "#F3F4F6" },
  { id: 16, name: "Xám nhạt", price: 100, primary: "#D1D5DB", secondary: "#9CA3AF", bg: "#F9FAFB" }
];

// Authentication system functions
function showAuthModal() {
  authModal.classList.add('active');
}

function hideAuthModal() {
  authModal.classList.remove('active');
}

function switchToRegisterMode() {
  modalTitle.textContent = 'Register';
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  switchText.innerHTML = 'Already have an account? <a href="#" id="switch-to-login">Login</a>';
  document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    switchToLoginMode();
  });
}

function switchToLoginMode() {
  modalTitle.textContent = 'Login';
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
  switchText.innerHTML = "Don't have an account? <a href=\"#\" id=\"switch-to-register\">Register now</a>";
  document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    switchToRegisterMode();
  });
}

function registerUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
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
  socket.emit("join", {
    username: username,
    isAdmin: username === "admin" // tài khoản admin
  });
  
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
    users[username].tokens = parseInt(localStorage.getItem('userTokens') || '0');
    users[username].purchasedColors = JSON.parse(localStorage.getItem('purchasedColors') || '[]');
    users[username].selectedColorTheme = localStorage.getItem('selectedColorTheme') || '0';
    
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
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const totalUsers = Object.keys(users).length;
  
  if (totalUsersSpan) totalUsersSpan.textContent = totalUsers;
  if (onlineUsersSpan) onlineUsersSpan.textContent = activeUsers.size;
  
  if (activeUsersList) activeUsersList.innerHTML = '';
  
  activeUsers.forEach((userData, username) => {
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    
    const loginTime = new Date(userData.loginTime).toLocaleTimeString('vi-VN');
    const duration = Math.floor((Date.now() - userData.loginTime) / 60000); // minutes
    
    userItem.innerHTML = `
      <div class="user-info">
        <div class="user-avatar-small">${username.charAt(0).toUpperCase()}</div>
        <div class="user-details">
          <div class="user-name-small">${username}</div>
          <div class="user-status">Online ${duration} phút</div>
        </div>
      </div>
      <button class="kick-btn" onclick="kickUser('${username}')">Kick</button>
    `;
    
    activeUsersList.appendChild(userItem);
  });
}

function kickUser(username) {
  if (confirm(`Bạn có chắc muốn kick người dùng "${username}"?`)) {
    socket.emit("kick", username);
  }
}

// Update online users display from Socket.io
function updateOnlineUsersDisplay(users) {
  // Update the online users count (use global onlineUsersSpan)
  if (onlineUsersSpan) {
    onlineUsersSpan.textContent = users.length;
  }
  
  // Also update the admin panel list
  if (activeUsersList) {
    activeUsersList.innerHTML = '';
    users.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name-small">${user.username}</div>
            <div class="user-status">${user.isAdmin ? '👑 Admin' : '👤 User'}</div>
          </div>
        </div>
        <button class="kick-btn" onclick="kickUser('${user.username}')">Kick</button>
      `;
      activeUsersList.appendChild(userItem);
    });
  }
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
    localStorage.setItem('userTokens', '100'); // New users get 100 tokens
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
  
  // Clean up old schedule data
  localStorage.removeItem('userSchedule');
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

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  
  const result = loginUser(username, password);
  if (result.success) {
    hideAuthModal();
    addMessage(result.message, "bot");
    loginForm.reset();
  } else {
    addMessage(result.message, "bot");
  }
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  if (password !== confirmPassword) {
    addMessage("Mât khâu không khop!", "bot");
    return;
  }
  
  if (password.length < 4) {
    addMessage("Mât khâu phai co it nhat 4 ky tu!", "bot");
    return;
  }
  
  const result = registerUser(username, password);
  if (result.success) {
    addMessage(result.message, "bot");
    switchToLoginMode();
    registerForm.reset();
  } else {
    addMessage(result.message, "bot");
  }
});

// Sidebar functionality
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  menuToggle.style.display = 'none'; // Hide hamburger icon
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuToggle.style.display = 'block'; // Show hamburger icon
}

menuToggle.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

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
    
    const isPurchased = purchasedColors.includes(theme.id);
    const canAfford = currentTokens >= theme.price;
    
    // Add locked class if not purchased
    if (!isPurchased) {
      themeItem.classList.add('locked');
    }
    
    // Set CSS variables for preview
    themeItem.style.setProperty('--color-primary', theme.primary);
    themeItem.style.setProperty('--color-secondary', theme.secondary);
    
    themeItem.innerHTML = `
      <div class="color-preview" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});${!isPurchased ? ' opacity: 0.7;' : ''}" title="${theme.name}"></div>
      <div class="color-name">${theme.name}</div>
      ${!isPurchased ? `<div class="color-price">${theme.price} tokens</div>` : '<div class="color-owned">✅ Đã sở hữu</div>'}
    `;
    
    themeItem.addEventListener('click', () => selectColorTheme(theme));
    colorGrid.appendChild(themeItem);
  });
}

function selectColorTheme(theme) {
  const purchasedColors = JSON.parse(localStorage.getItem('purchasedColors') || '[]');
  
  if (!purchasedColors.includes(theme.id)) {
    // Purchase color theme
    if (currentTokens >= theme.price) {
      currentTokens -= theme.price;
      localStorage.setItem('userTokens', currentTokens.toString());
      purchasedColors.push(theme.id);
      localStorage.setItem('purchasedColors', JSON.stringify(purchasedColors));
      
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Update tokens in users object
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[currentUser]) {
          users[currentUser].tokens = currentTokens;
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
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--primary-hover', theme.secondary);
  document.documentElement.style.setProperty('--primary-light', theme.bg);
  // AI chat box background follows user's purchased theme
  document.documentElement.style.setProperty('--bot-bg', theme.bg);
  document.body.style.background = `linear-gradient(145deg, ${theme.bg} 0%, ${theme.primary}15 50%, ${theme.bg} 100%)`;
}

// Token system
function updateTokenDisplay() {
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (currentUser && users[currentUser]) {
    currentTokens = users[currentUser].tokens || 0;
    localStorage.setItem('userTokens', currentTokens.toString());
  } else {
    currentTokens = parseInt(localStorage.getItem('userTokens') || '0');
  }
  
  const tokenElement = document.getElementById('token-count');
  if (tokenElement) {
    tokenElement.textContent = currentTokens;
  }
}

function addTokens(amount) {
  currentTokens += amount;
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
    // Redirect to simple admin page
    window.location.href = 'admin-simple.html';
    return "🔐 Đang chuyển đến trang quản lý người dùng...";
  } else if (command.startsWith('/token')) {
    // Redirect to new token shop page
    window.location.href = 'token-shop-new.html';
    return "?? ??ang chuy?n ??n c?a h?ng token m?i...";
  }
  
  return null;
}

function sendDeviceRequest(url) {
  fetch(url).catch(err => console.log('Device request failed:', err));
}

// Study room button
const studyRoomBtn = document.getElementById("study-room-btn");
if (studyRoomBtn) {
  studyRoomBtn.addEventListener('click', () => {
    window.location.href = 'study-room.html';
  });
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  
  // Safe DOM access with null checks
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleMenu = document.getElementById("theme-toggle-menu");
  
  if (themeToggle) {
    themeToggle.textContent = isDark ? "??": "??";
  }
  if (themeToggleMenu) {
    const menuIcon = themeToggleMenu.querySelector('.menu-icon');
    if (menuIcon) {
      menuIcon.textContent = isDark ? "??": "??";
    }
  }
}

function applyThemeFromStorage() {
  let isDark = localStorage.getItem("theme") === "dark";
  if (!isDark) {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.body.classList.toggle("dark", isDark);
  
  // Safe DOM access with null checks
  const themeToggle = document.getElementById("theme-toggle");
  const themeToggleMenu = document.getElementById("theme-toggle-menu");
  
  if (themeToggle) {
    themeToggle.textContent = isDark ? "??": "??";
  }
  if (themeToggleMenu) {
    const menuIcon = themeToggleMenu.querySelector('.menu-icon');
    if (menuIcon) {
      menuIcon.textContent = isDark ? "??": "??";
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
    if (userAvatarSrc) {
      avatar.innerHTML = `<img src="${userAvatarSrc}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    } else {
      avatar.textContent = "👤";
    }
  }

  wrapper.appendChild(avatar);
  return wrapper;
}

function addMessage(text, sender, isHtml = false) {
  const wrapper = createMessageWrapper(sender);

  const div = document.createElement("div");
  div.className = `message ${sender}`;

  if (isHtml) {
    div.innerHTML = text;
  } else {
    div.textContent = text;
  }

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
  sendBtn.textContent = isSending ? "..." : "Gửi >";
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
  conversationHistory.push({
    role: "system",
    content: systemInstruction
  });

  // Welcome message
  addMessage("Chào bạn! Mình là trợ lý AI. Bạn có thể hỏi bài tập, nhờ giải thích khái niệm, hoặc gửi ảnh để phân tích. Hãy thử chọn một chủ đề phía trên nhé!", "bot");
}

// File upload handling
uploadBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
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
  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }
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
  
  let text = input.value.trim();
  const file = imageInput.files?.[0] ?? null;

  if (!text && !file) return;

  // Check for commands
  if (text.startsWith('/')) {
    const commandResponse = processCommand(text);
    if (commandResponse !== null) {
      addMessage(text, "user");
      addMessage(commandResponse, "bot");
      input.value = '';
      return;
    }
  }

  text = text.replace(/\^/g, " mũ ");

  if (text) addMessage(text, "user");

  if (file) {
    const url = URL.createObjectURL(file);
    addMessage(`<img src="${url}" alt="Ảnh người dùng tải lên">`, "user", true);
  }

  input.value = "";
  imageInput.value = "";
  fileInfo.classList.add("hidden");
  fileName.textContent = "";
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

    const messages = [...conversationHistory, userMessage];
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
      const errorText = await response.text();
      throw new Error(`OPENROUTER_${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawReply = data?.choices?.[0]?.message?.content;
    const reply = normalizeAssistantContent(rawReply) || "Mình chưa tạo được câu trả lời. Bạn thử lại nhé.";

    conversationHistory.push(userMessage);
    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    removeTypingIndicator();
    addMessage(reply, "bot");

  } catch (err) {
    console.error(err);
    removeTypingIndicator();

    const msg = String(err?.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
      addMessage(
        "Không kết nối được server. Nếu đang test local: chạy npm start (cổng 3000). Nếu dùng web: kiểm tra URL Render trong app.js (RENDER_CHAT_URL) và service đang chạy.",
        "bot"
      );
    } else if (msg.includes("missing") && msg.includes("openrouter")) {
      addMessage("Chưa cấu hình OPENROUTER_API_KEY trên server (Render → Environment hoặc biến môi trường khi chạy npm start).", "bot");
    } else if (msg.includes("401") || msg.includes("api key") || msg.includes("permission")) {
      addMessage("API key OpenRouter không hợp lệ hoặc chưa có quyền truy cập model.", "bot");
    } else if (msg.includes("quota") || msg.includes("429")) {
      addMessage("Đã hết quota hoặc bị giới hạn tần suất từ OpenRouter. Bạn thử lại sau.", "bot");
    } else {
      addMessage("Không gửi được câu hỏi. Mở F12 (Console) để xem lỗi chi tiết.", "bot");
    }
  } finally {
    setSendingState(false);
  }
}

// Initialize everything
function init() {
  // Fast initialization - only critical stuff first
  initLocalStorage();
  applyThemeFromStorage();
  
  // Check authentication status immediately
  if (!checkAuthStatus()) {
    showAuthModal();
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
    document.getElementById('user-name').textContent = currentUser;
    
    // Apply saved color theme if any
    const selectedTheme = localStorage.getItem('selectedColorTheme');
    if (selectedTheme !== '0') {
      const theme = colorThemes.find(t => t.id === parseInt(selectedTheme));
      if (theme) {
        applyColorTheme(theme);
      }
    }
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
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Setup event listeners that need DOM elements
  const themeToggleMenu = document.getElementById('theme-toggle-menu');
  const logoutBtn = document.getElementById('logout-btn');
  const closeAdminModal = document.getElementById('close-admin-modal');
  const setTimeLimitBtn = document.getElementById('set-time-limit');
  
  if (themeToggleMenu) {
    themeToggleMenu.addEventListener('click', toggleTheme);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }
  
  if (closeAdminModal) {
    closeAdminModal.addEventListener('click', hideAdminPanel);
  }
  
  if (setTimeLimitBtn) {
    setTimeLimitBtn.addEventListener('click', setTimeLimit);
  }
  
  // Initialize the application
  init();
});