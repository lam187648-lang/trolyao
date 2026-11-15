// Authentication System
class AuthSystem {
  constructor() {
    this.databaseMode = false;
    this.modeReady = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    try {
      const { databaseConfigured } = await window.AuthApi.databaseStatus();
      this.databaseMode = databaseConfigured;
      this.modeReady = true;
      const notice = document.getElementById('auth-mode-notice');
      if (notice && !databaseConfigured) {
        notice.textContent = 'PostgreSQL chưa được cấu hình. Tài khoản hiện tại chỉ lưu trên thiết bị này; dữ liệu cũ không bị xóa.';
        if (window.AuthApi.hasSession()) window.AuthApi.clearSession();
      }
      await this.checkExistingSession();
    } catch (error) {
      this.showMessage(`Không kiểm tra được trạng thái máy chủ: ${error.message}`);
    }
  }

  setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      void this.handleLogin();
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      void this.handleRegister();
    });

    // Tab switching
    window.switchTab = (tab) => this.switchTab(tab);
  }

  async checkExistingSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (this.databaseMode) {
      const user = await window.AuthApi.restoreSession();
      if (user) {
        this.redirectToMain();
      } else if (currentUser) {
        const notice = document.getElementById('auth-mode-notice');
        if (notice) {
          notice.textContent = 'Tài khoản LocalStorage cũ vẫn được giữ trên thiết bị, nhưng cần đăng ký tài khoản server mới để dùng PostgreSQL.';
        }
      }
      return;
    }

    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[currentUser] && !users[currentUser].serverAccount) {
        // User already logged in, redirect to main app
        this.redirectToMain();
      }
    }
  }

  switchTab(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
      tabs[0].classList.add('active');
      document.getElementById('login-form').classList.add('active');
    } else {
      tabs[1].classList.add('active');
      document.getElementById('register-form').classList.add('active');
    }
    
    this.clearMessages();
  }

  showMessage(message, type = 'error') {
    const container = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  clearMessages() {
    document.getElementById('message-container').innerHTML = '';
  }

  setLoading(formType, loading = true) {
    const btn = document.getElementById(`${formType}-btn`);
    const text = document.getElementById(`${formType}-text`);
    
    if (loading) {
      btn.disabled = true;
      text.innerHTML = '<span class="loading"></span> Đang xử lý...';
    } else {
      btn.disabled = false;
      text.textContent = formType === 'login' ? 'Đăng Nhập' : 'Đăng Ký';
    }
  }

  handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      this.showMessage('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (!this.modeReady) {
      this.showMessage('Chưa kết nối được máy chủ xác thực. Vui lòng tải lại trang hoặc thử lại sau.');
      return;
    }

    if (this.databaseMode) {
      return this.handleServerLogin(username, password);
    }
    
    this.setLoading('login', true);
    
    // Simulate processing delay
    setTimeout(async () => {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[username]?.serverAccount) {
        const legacyUsers = JSON.parse(localStorage.getItem('legacyUsers') || '{}');
        if (legacyUsers[username]) {
          users[username] = legacyUsers[username];
          localStorage.setItem('users', JSON.stringify(users));
        }
      }
      
      if (!users[username]) {
        this.setLoading('login', false);
        this.showMessage('Tên đăng nhập không tồn tại!');
        return;
      }
      
      const user = users[username];
      
      // Compare passwords (stored as base64 with UTF-8 support)
      const storedPassword = user.password;
      if (!(await this.passwordMatches(password, storedPassword))) {
        this.setLoading('login', false);
        this.showMessage('Mật khẩu sai!');
        return;
      }
      
      // Check if user is banned
      const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
      const banInfo = bans[username];
      if (banInfo && banInfo.until > Date.now()) {
        const remainingTime = Math.ceil((banInfo.until - Date.now()) / 60000);
        this.setLoading('login', false);
        this.showMessage(`Tài khoản bị khóa! Vui lòng quay lại sau ${remainingTime} phút.`);
        return;
      }
      
      // Login successful
      localStorage.setItem('currentUser', username);
      
      // Set session data for cross-page persistence
      const sessionData = {
        username: username,
        loginTime: Date.now(),
        lastActivity: Date.now()
      };
      sessionStorage.setItem('authSession', JSON.stringify(sessionData));
      
      // Update last login and last active
      user.lastLogin = Date.now();
      user.lastActive = Date.now();
      users[username] = user;
      localStorage.setItem('users', JSON.stringify(users));
      
      this.setLoading('login', false);
      this.showMessage('Đăng nhập thành công!', 'success');
      
      // Redirect to main app
      setTimeout(() => {
        this.redirectToMain();
      }, 1000);
      
    }, 1000);
  }

  handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (!username || !password || !confirmPassword) {
      this.showMessage('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (!this.modeReady) {
      this.showMessage('Chưa kết nối được máy chủ xác thực. Vui lòng tải lại trang hoặc thử lại sau.');
      return;
    }

    if (this.databaseMode) {
      if (password.length < 8) {
        this.showMessage('Mật khẩu cần có ít nhất 8 ký tự khi đăng ký tài khoản server.');
        return;
      }
      return this.handleServerRegister(username, password);
    }
    this.showMessage('Chưa thể tạo tài khoản mới vì PostgreSQL trên máy chủ chưa được cấu hình. Dữ liệu LocalStorage cũ vẫn được giữ nguyên.');
  }

  // Unicode-safe password encoding
  encodePassword(password) {
    // Convert UTF-8 string to base64 safely
    const utf8Bytes = new TextEncoder().encode(password);
    const base64String = btoa(String.fromCharCode(...utf8Bytes));
    return base64String;
  }

  async passwordMatches(password, storedPassword) {
    if (storedPassword === this.encodePassword(password)) return true;
    if (!globalThis.crypto?.subtle) return false;
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
    return storedPassword === `sha256:${hash}`;
  }

  async handleServerLogin(username, password) {
    this.setLoading('login', true);
    try {
      const result = await window.AuthApi.login(username, password);
      await window.AuthApi.storeSession(result);
      this.showMessage('Đăng nhập thành công!', 'success');
      setTimeout(() => this.redirectToMain(), 500);
    } catch (error) {
      this.showMessage(error.message || 'Không thể đăng nhập.');
    } finally {
      this.setLoading('login', false);
    }
  }

  async handleServerRegister(username, password) {
    this.setLoading('register', true);
    try {
      const result = await window.AuthApi.register(username, password);
      await window.AuthApi.storeSession(result);
      this.showMessage('Đăng ký thành công!', 'success');
      setTimeout(() => this.redirectToMain(), 500);
    } catch (error) {
      this.showMessage(error.message || 'Không thể đăng ký.');
    } finally {
      this.setLoading('register', false);
    }
  }

  redirectToMain() {
    // Check if there's a redirect URL
    const redirectUrl = sessionStorage.getItem('redirectUrl') || 'index.html';
    sessionStorage.removeItem('redirectUrl');
    
    window.location.href = redirectUrl;
  }
}

// Session Manager for cross-page persistence
class SessionManager {
  static checkSession() {
    const sessionData = sessionStorage.getItem('authSession');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!sessionData || !currentUser) {
      return false;
    }

    if (window.AuthApi?.hasSession()) {
      return true;
    }
    
    try {
      const session = JSON.parse(sessionData);
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      // Verify user still exists
      if (!users[currentUser]) {
        this.clearSession();
        return false;
      }
      
      // Check session timeout (24 hours)
      const sessionAge = Date.now() - session.loginTime;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        this.clearSession();
        return false;
      }
      
      // Update last activity in session
      session.lastActivity = Date.now();
      sessionStorage.setItem('authSession', JSON.stringify(session));
      
      // Also update lastActive in users data for admin panel tracking
      if (users[currentUser]) {
        users[currentUser].lastActive = Date.now();
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      return true;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }
  
  static clearSession() {
    sessionStorage.removeItem('authSession');
    window.AuthApi?.clearSession();
    localStorage.removeItem('currentUser');
  }
  
  static requireAuth() {
    if (!this.checkSession()) {
      // Store current page for redirect
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      window.location.href = 'auth.html';
      return false;
    }
    return true;
  }
}

// Initialize auth system
document.addEventListener('DOMContentLoaded', () => {
  new AuthSystem();
});

// Export for use in other files
window.SessionManager = SessionManager;
