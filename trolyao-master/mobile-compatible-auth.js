// Mobile Compatible Authentication System
class MobileAuthSystem {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }

    // Tab switching
    window.switchTab = (tab) => this.switchTab(tab);
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
      console.log('localStorage error, trying sessionStorage:', error);
      try {
        return sessionStorage.getItem(key);
      } catch (sessionError) {
        console.log('sessionStorage also failed:', sessionError);
        return null;
      }
    }
  }

  setStorageItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.log('localStorage error, trying sessionStorage:', error);
      try {
        sessionStorage.setItem(key, value);
      } catch (sessionError) {
        console.log('sessionStorage also failed:', sessionError);
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
      const loginForm = document.getElementById('login-form');
      if (loginForm) loginForm.classList.add('active');
    } else {
      tabs[1].classList.add('active');
      const registerForm = document.getElementById('register-form');
      if (registerForm) registerForm.classList.add('active');
    }
    
    this.clearMessages();
  }

  showMessage(message, type = 'error') {
    const container = document.getElementById('message-container');
    if (!container) return;
    
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
    const container = document.getElementById('message-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  setLoading(formType, loading = true) {
    const btn = document.getElementById(`${formType}-btn`);
    const text = document.getElementById(`${formType}-text`);
    
    if (!btn || !text) return;
    
    if (loading) {
      btn.disabled = true;
      text.innerHTML = '<span class="loading"></span> Processing...';
    } else {
      btn.disabled = false;
      text.textContent = formType === 'login' ? 'Login' : 'Register';
    }
  }

  handleLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    if (!usernameInput || !passwordInput) {
      this.showMessage('Form elements not found!');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      this.showMessage('Please enter all information!');
      return;
    }
    
    this.setLoading('login', true);
    
    setTimeout(() => {
      try {
        const users = JSON.parse(this.getStorageItem('users') || '{}');
        
        if (!users[username]) {
          this.setLoading('login', false);
          this.showMessage('Username does not exist!');
          return;
        }
        
        const user = users[username];
        
        // Compare passwords (stored as base64)
        const storedPassword = user.password;
        const inputPassword = btoa(password);
        
        if (storedPassword !== inputPassword) {
          this.setLoading('login', false);
          this.showMessage('Incorrect password!');
          return;
        }
        
        // Check if user is banned
        const bans = JSON.parse(this.getStorageItem('userBans') || '{}');
        const banInfo = bans[username];
        if (banInfo && banInfo.until > Date.now()) {
          const remainingTime = Math.ceil((banInfo.until - Date.now()) / 60000);
          this.setLoading('login', false);
          this.showMessage(`Account banned! Please come back after ${remainingTime} minutes.`);
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
        
        this.setLoading('login', false);
        this.showMessage('Login successful!', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          this.redirectToMain();
        }, 1000);
        
      } catch (error) {
        console.log('Login error:', error);
        this.setLoading('login', false);
        this.showMessage('Login failed! Please try again.');
      }
    }, 1000);
  }

  handleRegister() {
    const usernameInput = document.getElementById('register-username');
    const passwordInput = document.getElementById('register-password');
    const confirmInput = document.getElementById('register-confirm');
    
    if (!usernameInput || !passwordInput || !confirmInput) {
      this.showMessage('Form elements not found!');
      return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    
    if (!username || !password || !confirmPassword) {
      this.showMessage('Please enter all information!');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('Password confirmation does not match!');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('Password must be at least 6 characters!');
      return;
    }
    
    this.setLoading('register', true);
    
    setTimeout(() => {
      try {
        const users = JSON.parse(this.getStorageItem('users') || '{}');
        
        if (users[username]) {
          this.setLoading('register', false);
          this.showMessage('Username already exists!');
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
        
        this.setLoading('register', false);
        this.showMessage('Registration successful! Redirecting...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          this.redirectToMain();
        }, 1500);
        
      } catch (error) {
        console.log('Registration error:', error);
        this.setLoading('register', false);
        this.showMessage('Registration failed! Please try again.');
      }
    }, 1000);
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

// Mobile Compatible Session Manager
class MobileSessionManager {
  static getStorageItem(key) {
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

  static setStorageItem(key, value) {
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

  static checkSession() {
    try {
      const sessionData = this.getStorageItem('authSession');
      const currentUser = this.getStorageItem('currentUser');
      
      if (!sessionData || !currentUser) {
        return false;
      }
      
      const session = JSON.parse(sessionData);
      const users = JSON.parse(this.getStorageItem('users') || '{}');
      
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
      
      // Update last activity
      session.lastActivity = Date.now();
      this.setStorageItem('authSession', JSON.stringify(session));
      
      return true;
    } catch (error) {
      console.log('Session check error:', error);
      this.clearSession();
      return false;
    }
  }
  
  static clearSession() {
    try {
      localStorage.removeItem('authSession');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('authSession');
      sessionStorage.removeItem('currentUser');
    } catch (error) {
      console.log('Clear session error:', error);
    }
  }
  
  static requireAuth() {
    if (!this.checkSession()) {
      // Store current page for redirect
      const currentPath = window.location.pathname;
      this.setStorageItem('redirectUrl', currentPath);
      
      // Handle mobile file:// URL issues
      const currentUrl = window.location.href;
      if (currentUrl.startsWith('file://')) {
        window.location.href = 'auth.html';
      } else {
        window.location.href = 'auth.html';
      }
      return false;
    }
    return true;
  }
}

// Initialize auth system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing mobile compatible auth system...');
  new MobileAuthSystem();
});

// Export for use in other files
window.MobileSessionManager = MobileSessionManager;
window.MobileAuthSystem = MobileAuthSystem;
