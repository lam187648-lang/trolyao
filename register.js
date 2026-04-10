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
        message = 'M?t kh?u y?u';
        className = 'strength-weak';
        break;
      case 2:
      case 3:
        message = 'M?t kh?u trung bình';
        className = 'strength-medium';
        break;
      case 4:
      case 5:
        message = 'M?t kh?u m?nh';
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
      this.showError(confirmPasswordInput, 'M?t kh?u không kh?p!');
      return false;
    }
    
    return true;
  }

  handleRegister() {
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
      this.showError(usernameInput, 'Vui lòng nh?p tên ??ng nh?p!');
      return;
    }
    
    if (username.length < 3) {
      this.showError(usernameInput, 'Tên ??ng nh?p ph?i có ít nh?t 3 ký t?!');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showError(usernameInput, 'Tên ??ng nh?p ch? ch?a ký t?, s? và g?ch d??!');
      return;
    }
    
    if (!password) {
      this.showError(passwordInput, 'Vui lòng nh?p m?t kh?u!');
      return;
    }
    
    if (password.length < 6) {
      this.showError(passwordInput, 'M?t kh?u ph?i có ít nh?t 6 ký t?!');
      return;
    }
    
    if (!confirmPassword) {
      this.showError(confirmPasswordInput, 'Vui lòng xác nh?n m?t kh?u!');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showError(confirmPasswordInput, 'M?t kh?u xác nh?n không kh?p!');
      return;
    }
    
    this.setLoading(true);
    
    setTimeout(() => {
      try {
        const users = JSON.parse(this.getStorageItem('users') || '{}');
        
        if (users[username]) {
          this.setLoading(false);
          this.showMessage('Tên ??ng nh?p ?? t?n t?i! <a href="login.html">??ng nh?p ngay</a>', 'error');
          return;
        }
        
        // Create new user
        const newUser = {
          username: username,
          password: btoa(password), // Store as base64
          tokens: 100, // Initial tokens
          avatar: '',
          purchasedColors: [],
          selectedColorTheme: '0',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          hasReceivedFirstBonus: true, // Already got initial tokens
          studyStats: {
            totalMinutes: 0,
            totalDays: 0,
            sessions: 0,
            lastStudyDate: null
          }
        };
        
        users[username] = newUser;
        this.setStorageItem('users', JSON.stringify(users));
        
        // Auto-login after registration
        this.setStorageItem('currentUser', username);
        
        // Set session data
        const sessionData = {
          username: username,
          loginTime: Date.now(),
          lastActivity: Date.now()
        };
        this.setStorageItem('authSession', JSON.stringify(sessionData));
        
        this.setLoading(false);
        this.showMessage('??ng ký thành công! Nh?n 100 tokens và ??ang chuy?n...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          this.redirectToMain();
        }, 2000);
        
      } catch (error) {
        console.log('Registration error:', error);
        this.setLoading(false);
        this.showMessage('??ng ký th?t b?i! Vui lòng th? l?i.', 'error');
      }
    }, 1500);
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
      text.innerHTML = '<span class="loading"></span> ??ang x? lý...';
    } else {
      btn.disabled = false;
      text.textContent = '??ng Ký';
    }
  }

  showMessage(message, type = 'error') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    if (type === 'error') {
      messageDiv.innerHTML = `<span>??</span> ${message}`;
    } else if (type === 'success') {
      messageDiv.innerHTML = `<span>??</span> ${message}`;
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
