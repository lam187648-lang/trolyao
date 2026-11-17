// Login Page JavaScript
class LoginPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Password input validation
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.clearError(passwordInput);
      });
    }

    // Toggle password visibility
    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn && passwordInput) {
      const eyeIconSvg = `
        <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
      const eyeOffIconSvg = `
        <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      `;
      const toggle = () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = isPassword ? eyeOffIconSvg : eyeIconSvg;
        toggleBtn.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleBtn.setAttribute('title', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        toggleBtn.setAttribute('aria-pressed', String(isPassword));
      };
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });
      toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      });
    }

    // Username input validation
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.addEventListener('input', () => {
        this.clearError(usernameInput);
      });
    }
  }

  checkExistingSession() {
    try {
      const currentUser = this.getStorageItem('currentUser');
      if (currentUser) {
        const users = JSON.parse(this.getStorageItem('users') || '{}');
        if (users[currentUser]) {
          // User already logged in, redirect to main app
          this.redirectToMain();
          return;
        }
      }
    } catch (error) {
      console.log('Session check error:', error);
    }
  }

  // Mobile compatible storage methods
  getStorageItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      try {
        return sessionStorage.getItem(key);
      } catch (sessionError) {
        return null;
      }
    }
  }

  setStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      try {
        sessionStorage.setItem(key, value);
      } catch (sessionError) {
        console.log('Storage failed:', sessionError);
      }
    }
  }

  async handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) {
      this.showMessage('Form elements not found!', 'error');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validation
    if (!username) {
      this.showError(usernameInput, 'Vui lòng nhập tên đăng nhập!');
      return;
    }
    
    if (!password) {
      this.showError(passwordInput, 'Vui lòng nhập mật khẩu!');
      return;
    }
    
    if (username.length < 3) {
      this.showError(usernameInput, 'Tên đăng nhập cần có ít nhất 3 ký tự!');
      return;
    }
    
    if (!window.AuthApi) {
      this.showMessage('Không tải được API xác thực. Vui lòng tải lại trang.', 'error');
      return;
    }

    this.setLoading(true);
    try {
      const { databaseConfigured } = await window.AuthApi.databaseStatus();
      if (databaseConfigured) {
        const result = await window.AuthApi.login(username, password);
        await window.AuthApi.storeSession(result);
        this.setLoading(false);
        this.showMessage('Đăng nhập thành công! Đang chuyển...', 'success');
        setTimeout(() => this.redirectToMain(), 500);
        return;
      }
    } catch (error) {
      this.setLoading(false);
      this.showMessage(error.message || 'Không thể xác thực với máy chủ.', 'error');
      return;
    }
    this.setLoading(false);

    this.setLoading(true);
    setTimeout(() => {
      try {
        const users = JSON.parse(this.getStorageItem('users') || '{}');
        
        if (!users[username]) {
          this.setLoading(false);
          this.showMessage('Tên đăng nhập không tồn tại. Hãy đăng ký tài khoản server mới.', 'error');
          return;
        }
        
        const user = users[username];
        
        // Compare passwords (stored as base64)
        const storedPassword = user.password;
        const inputPassword = btoa(password);
        
        if (storedPassword !== inputPassword) {
          this.setLoading(false);
          this.showMessage('Mật khẩu không đúng. Vui lòng thử lại.', 'error');
          return;
        }
        
        // Check if user is banned
        const bans = JSON.parse(this.getStorageItem('userBans') || '{}');
        const banInfo = bans[username];
        if (banInfo && banInfo.until > Date.now()) {
          const remainingTime = Math.ceil((banInfo.until - Date.now()) / 60000);
          this.setLoading(false);
          this.showMessage(`Tài khoản bị khóa. Vui lòng thử lại sau ${remainingTime} phút.`, 'error');
          return;
        }
        
        // Login successful
        this.setStorageItem('currentUser', username);
        
        // Set session data for cross-page persistence
        const sessionData = {
          username: username,
          loginTime: Date.now(),
          lastActivity: Date.now()
        };
        this.setStorageItem('authSession', JSON.stringify(sessionData));
        
        // Update last login
        user.lastLogin = Date.now();
        users[username] = user;
        this.setStorageItem('users', JSON.stringify(users));
        
        this.setLoading(false);
        this.showMessage('Đăng nhập thành công! Đang chuyển...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          this.redirectToMain();
        }, 1500);
        
      } catch (error) {
        console.log('Login error:', error);
        this.setLoading(false);
        this.showMessage('Đăng nhập thất bại. Vui lòng thử lại.', 'error');
      }
    }, 1000);
  }

  showError(input, message) {
    input.classList.add('error');
    input.focus();
    
    // Create or update error message
    let errorDiv = input.parentNode.querySelector('.field-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.style.cssText = `
        color: #dc2626;
        font-size: 12px;
        margin-top: 4px;
        display: block;
      `;
      input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  clearError(input) {
    input.classList.remove('error');
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  setLoading(loading) {
    const btn = document.getElementById('login-btn');
    const text = document.getElementById('login-text');
    
    if (!btn || !text) return;
    
    if (loading) {
      btn.disabled = true;
      text.innerHTML = '<span class="loading"></span> Đang xử lý...';
    } else {
      btn.disabled = false;
      text.textContent = 'Đăng nhập';
    }
  }

  showMessage(message, type = 'error') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    if (type === 'success') {
      // Auto-dismiss success messages
      setTimeout(() => {
        container.innerHTML = '';
      }, 3000);
    }
  }

  redirectToMain() {
    // Handle mobile file:// URL issues
    const currentUrl = window.location.href;
    
    if (currentUrl.startsWith('file://')) {
      // For local file access, try to use relative path
      window.location.href = 'index.html';
    } else {
      // For web server access
      window.location.href = 'index.html';
    }
  }
}

// Initialize login page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing login page...');
  new LoginPage();
});

// Export for global access
window.LoginPage = LoginPage;
