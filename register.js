// Register Page JavaScript
class RegisterPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Password strength checker
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.checkPasswordStrength();
        this.clearError(passwordInput);
      });
    }

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

    const bindToggle = (btnId, inputId) => {
      const btn = document.getElementById(btnId);
      const input = document.getElementById(inputId);
      if (!btn || !input) return;
      const toggle = () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? eyeOffIconSvg : eyeIconSvg;
        btn.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        btn.setAttribute('title', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
        btn.setAttribute('aria-pressed', String(isPassword));
      };
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggle();
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      });
    };

    bindToggle('toggle-password', 'password');
    bindToggle('toggle-confirm-password', 'confirm-password');

    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirm-password');
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', () => {
        this.validatePasswordMatch();
        this.clearError(confirmPasswordInput);
      });
    }

    // Username validation
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

  checkPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthDiv = document.getElementById('password-strength');
    
    if (!passwordInput || !strengthDiv) return;
    
    const password = passwordInput.value;
    let strength = 0;
    let message = '';
    let className = '';
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    switch (strength) {
      case 0:
      case 1:
        message = 'Mật khẩu yếu';
        className = 'strength-weak';
        break;
      case 2:
      case 3:
        message = 'Mật khẩu trung bình';
        className = 'strength-medium';
        break;
      case 4:
      case 5:
        message = 'Mật khẩu mạnh';
        className = 'strength-strong';
        break;
    }
    
    strengthDiv.textContent = message;
    strengthDiv.className = `password-strength ${className}`;
  }

  validatePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (!passwordInput || !confirmPasswordInput) return;
    
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
      this.showError(confirmPasswordInput, 'Mật khẩu không khớp!');
      return false;
    }
    
    return true;
  }

  async handleRegister() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (!usernameInput || !passwordInput || !confirmPasswordInput) {
      this.showMessage('Form elements not found!', 'error');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (!username) {
      this.showError(usernameInput, 'Vui lòng nhập tên đăng nhập!');
      return;
    }
    
    if (username.length < 3) {
      this.showError(usernameInput, 'Tên đăng nhập phải có ít nhất 3 ký tự!');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showError(usernameInput, 'Tên đăng nhập chỉ chứa ký tự, số và gạch dưới!');
      return;
    }
    
    if (!password) {
      this.showError(passwordInput, 'Vui lòng nhập mật khẩu!');
      return;
    }
    
    if (password.length < 8) {
      this.showError(passwordInput, 'Mật khẩu cần có ít nhất 8 ký tự!');
      return;
    }
    
    if (!confirmPassword) {
      this.showError(confirmPasswordInput, 'Vui lòng xác nhận mật khẩu!');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showError(confirmPasswordInput, 'Mật khẩu xác nhận không khớp!');
      return;
    }
    
    if (!window.AuthApi) {
      this.showMessage('Không tải được API xác thực. Vui lòng tải lại trang.', 'error');
      return;
    }

    this.setLoading(true);
    try {
      const { databaseConfigured } = await window.AuthApi.databaseStatus();
      if (!databaseConfigured) {
        this.showMessage('Chưa thể tạo tài khoản mới vì PostgreSQL trên máy chủ chưa được cấu hình.');
        return;
      }

      const result = await window.AuthApi.register(username, password);
      await window.AuthApi.storeSession(result);
      this.showMessage('Đăng ký thành công! Đang chuyển đến...', 'success');
      setTimeout(() => this.redirectToMain(), 500);
    } catch (error) {
      this.showMessage(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      this.setLoading(false);
    }
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
    const btn = document.getElementById('register-btn');
    const text = document.getElementById('register-text');
    
    if (!btn || !text) return;
    
    if (loading) {
      btn.disabled = true;
      text.innerHTML = '<span class="loading"></span> Đang xử lý...';
    } else {
      btn.disabled = false;
      text.textContent = 'Đăng Ký';
    }
  }

  showMessage(message, type = 'error') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    if (type === 'error') {
      messageDiv.innerHTML = `<span>❌</span> ${message}`;
    } else if (type === 'success') {
      messageDiv.innerHTML = `<span>✅</span> ${message}`;
    }
    
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

// Initialize register page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing register page...');
  new RegisterPage();
});

// Export for global access
window.RegisterPage = RegisterPage;
