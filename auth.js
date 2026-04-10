// Authentication System
class AuthSystem {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Tab switching
    window.switchTab = (tab) => this.switchTab(tab);
  }

  checkExistingSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[currentUser]) {
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
      text.innerHTML = '<span class="loading"></span> ??ang x? lý...';
    } else {
      btn.disabled = false;
      text.textContent = formType === 'login' ? '??ng Nh?p' : '??ng Ký';
    }
  }

  handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      this.showMessage('Vui lòng nh?p ??y ? thông tin!');
      return;
    }
    
    this.setLoading('login', true);
    
    // Simulate processing delay
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (!users[username]) {
        this.setLoading('login', false);
        this.showMessage('Tên ??ng nh?p không t?n t?i!');
        return;
      }
      
      const user = users[username];
      
      // Compare passwords (stored as base64)
      const storedPassword = user.password;
      const inputPassword = btoa(password);
      
      if (storedPassword !== inputPassword) {
        this.setLoading('login', false);
        this.showMessage('M?t kh?u sai!');
        return;
      }
      
      // Check if user is banned
      const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
      const banInfo = bans[username];
      if (banInfo && banInfo.until > Date.now()) {
        const remainingTime = Math.ceil((banInfo.until - Date.now()) / 60000);
        this.setLoading('login', false);
        this.showMessage(`Tài kho?n b? khóa! Vui lòng quay l?i sau ${remainingTime} phút.`);
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
      
      // Update last login
      user.lastLogin = Date.now();
      users[username] = user;
      localStorage.setItem('users', JSON.stringify(users));
      
      this.setLoading('login', false);
      this.showMessage('??ng nh?p thành công!', 'success');
      
      // Redirect to main app
      setTimeout(() => {
        this.redirectToMain();
      }, 1000);
      
    }, 1000);
  }

  handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (!username || !password || !confirmPassword) {
      this.showMessage('Vui lòng nh?p ??y ? thông tin!');
      return;
    }
    
    if (password !== confirmPassword) {
      this.showMessage('M?t kh?u xác nh?n không kh?p!');
      return;
    }
    
    if (password.length < 6) {
      this.showMessage('M?t kh?u ph?i có ít nh?t 6 ký t?!');
      return;
    }
    
    this.setLoading('register', true);
    
    // Simulate processing delay
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      
      if (users[username]) {
        this.setLoading('register', false);
        this.showMessage('Tên ??ng nh?p ?? t?n t?i!');
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
      localStorage.setItem('users', JSON.stringify(users));
      
      // Auto-login after registration
      localStorage.setItem('currentUser', username);
      
      // Set session data
      const sessionData = {
        username: username,
        loginTime: Date.now(),
        lastActivity: Date.now()
      };
      sessionStorage.setItem('authSession', JSON.stringify(sessionData));
      
      this.setLoading('register', false);
      this.showMessage('??ng ký thành công! ??ang chuy?n ??n...', 'success');
      
      // Redirect to main app
      setTimeout(() => {
        this.redirectToMain();
      }, 1500);
      
    }, 1000);
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
      
      // Update last activity
      session.lastActivity = Date.now();
      sessionStorage.setItem('authSession', JSON.stringify(session));
      
      return true;
    } catch (error) {
      this.clearSession();
      return false;
    }
  }
  
  static clearSession() {
    sessionStorage.removeItem('authSession');
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
