// Main App with Authentication Check
class MainAppWithAuth {
  constructor() {
    this.currentUser = null;
    this.currentTokens = 0;
    this.conversationHistory = [];
    this.isTyping = false;
    this.isDeepAnalysisMode = false;
    this.init();
  }

  init() {
    this.checkAuthentication();
  }

  checkAuthentication() {
    try {
      const currentUser = this.getStorageItem('currentUser');
      const users = JSON.parse(this.getStorageItem('users') || '{}');
      
      if (currentUser && users[currentUser]) {
        // User is logged in, initialize app
        this.currentUser = currentUser;
        this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        this.startHeartbeat();
        this.showMainApp();
      } else {
        // User not logged in, show auth options
        this.showAuthOptions();
      }
    } catch (error) {
      console.log('Auth check error:', error);
      this.showAuthOptions();
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

  showMainApp() {
    const authContainer = document.getElementById('auth-check-container');
    const mainContainer = document.getElementById('main-app-container');
    
    if (authContainer) authContainer.style.display = 'none';
    if (mainContainer) mainContainer.style.display = 'block';
    
    // Enable input and send button
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (messageInput) {
      messageInput.disabled = false;
      messageInput.placeholder = 'Nhập tin nhắn của bạn...';
    }
    if (sendBtn) sendBtn.disabled = false;
  }

  showAuthOptions() {
    const authContainer = document.getElementById('auth-check-container');
    const mainContainer = document.getElementById('main-app-container');
    
    if (authContainer) authContainer.style.display = 'flex';
    if (mainContainer) mainContainer.style.display = 'none';
    
    // Update auth container content
    if (authContainer) {
      authContainer.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
            <h2 style="color: #1e40af; margin-bottom: 16px;">Authentication Required</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Vui lòng đăng nhập để sử dụng chatbot!</p>
            
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <button onclick="window.location.href='login.html'" style="background: #3b82f6; color: white; border: none; padding: 16px 32px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    📱 Đăng Nhập
                </button>
                <button onclick="window.location.href='register.html'" style="background: #10b981; color: white; border: none; padding: 16px 32px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease;">
                    📝 Đăng Ký
                </button>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; border: 1px solid #bfdbfe;">
                <h3 style="color: #1e40af; margin-bottom: 10px;">Mobile Users:</h3>
                <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">Nếu bạn đang dùng điện thoại, hãy sử dụng các trang trên để có trải nghiệm tốt nhất.</p>
                <p style="color: #64748b; font-size: 14px;">Desktop users có thể sử dụng trang này để đăng nhập nhanh.</p>
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="window.location.href='login.html'" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 14px 28px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.3s ease; width: 100%;">
                    Đăng Nhập (Desktop)
                </button>
            </div>
        </div>
      `;
    }
  }

  loadUserData() {
    try {
      const users = JSON.parse(this.getStorageItem('users') || '{}');
      const user = users[this.currentUser];
      
      if (user) {
        this.currentTokens = user.tokens || 0;
        this.setStorageItem('userTokens', this.currentTokens.toString());
        this.setStorageItem('userAvatar', user.avatar || '');
        this.setStorageItem('userName', user.username);
        this.setStorageItem('selectedColorTheme', user.selectedColorTheme || '0');
        this.setStorageItem('purchasedColors', JSON.stringify(user.purchasedColors || []));
        
        this.applySavedTheme();
      }
    } catch (error) {
      console.log('Load user data error:', error);
    }
  }

  applySavedTheme() {
    try {
      const selectedTheme = this.getStorageItem('selectedColorTheme');
      if (selectedTheme && selectedTheme !== '0') {
        const colors = this.getThemeColors(selectedTheme);
        if (colors) {
          const root = document.documentElement;
          root.style.setProperty('--primary', colors.primary);
          root.style.setProperty('--primary-hover', colors.secondary);
          root.style.setProperty('--primary-light', colors.bg);
          root.style.setProperty('--text-primary', colors.textColor || '#000000');
          
          if (document.body) {
            document.body.style.background = `linear-gradient(145deg, ${colors.bg} 0%, ${colors.primary}15 50%, ${colors.bg} 100%)`;
          }
        }
      }
    } catch (error) {
      console.log('Apply theme error:', error);
    }
  }

  getThemeColors(themeId) {
    const themes = {
      '1': { primary: '#3B82F6', secondary: '#1E40AF', bg: '#EFF6FF', textColor: '#1E3A8A' },
      '2': { primary: '#10B981', secondary: '#047857', bg: '#F0FDF4', textColor: '#064E3B' },
      '3': { primary: '#8B5CF6', secondary: '#6D28D9', bg: '#F5F3FF', textColor: '#581C87' },
      '4': { primary: '#EC4899', secondary: '#BE185D', bg: '#FDF2F8', textColor: '#831843' },
      '5': { primary: '#F59E0B', secondary: '#D97706', bg: '#FFFBEB', textColor: '#78350F' },
      '6': { primary: '#F97316', secondary: '#EA580C', bg: '#FFF7ED', textColor: '#7C2D12' },
      '7': { primary: '#EF4444', secondary: '#DC2626', bg: '#FEF2F2', textColor: '#7F1D1D' },
      '8': { primary: '#6B7280', secondary: '#4B5563', bg: '#F9FAFB', textColor: '#374151' },
      '9': { primary: '#14B8A6', secondary: '#0F766E', bg: '#F0FDFA', textColor: '#134E4A' },
      '10': { primary: '#6366F1', secondary: '#4F46E5', bg: '#EEF2FF', textColor: '#312E81' },
      '11': { primary: '#A855F7', secondary: '#9333EA', bg: '#FAF5FF', textColor: '#581C87' },
      '12': { primary: '#F472B6', secondary: '#EC4899', bg: '#FDF4FF', textColor: '#831843' },
      '13': { primary: '#92400E', secondary: '#78350F', bg: '#FEF3C7', textColor: '#451A03' },
      '14': { primary: '#1E40AF', secondary: '#1E3A8A', bg: '#DBEAFE', textColor: '#1E3A8A' },
      '15': { primary: '#374151', secondary: '#111827', bg: '#F3F4F6', textColor: '#111827' },
      '16': { primary: '#D1D5DB', secondary: '#9CA3AF', bg: '#F9FAFB', textColor: '#6B7280' },
      '17': { primary: '#FFD700', secondary: '#FFA500', bg: '#FFFBEB', textColor: '#78350F' },
      '18': { primary: '#C0C0C0', secondary: '#808080', bg: '#F8F9FA', textColor: '#374151' },
      '19': { primary: '#B87333', secondary: '#8B4513', bg: '#FEF5E7', textColor: '#451A03' },
      '20': { primary: '#7851A9', secondary: '#6A1B9A', bg: '#F3E5F5', textColor: '#581C87' },
      '21': { primary: '#1F2937', secondary: '#111827', bg: '#111827', textColor: '#FFFFFF' },
      '22': { primary: '#1E3A8A', secondary: '#1E40AF', bg: '#1E3A8A', textColor: '#FFFFFF' },
      '23': { primary: '#581C87', secondary: '#6B21A8', bg: '#581C87', textColor: '#FFFFFF' },
      '24': { primary: '#7F1D1D', secondary: '#991B1B', bg: '#7F1D1D', textColor: '#FFFFFF' }
    };
    return themes[themeId];
  }

  setupEventListeners() {
    // Send message button
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Sidebar menu items
    this.setupMenuListeners();
    
    // Command processing
    window.processCommand = (text) => this.processCommand(text);
  }

  setupMenuListeners() {
    // Study room button
    const studyBtn = document.getElementById('study-room-btn');
    if (studyBtn) {
      studyBtn.addEventListener('click', () => {
        this.openNewWindow('study-room.html');
      });
    }

    // Token shop button
    const tokenBtn = document.getElementById('token-shop-btn');
    if (tokenBtn) {
      tokenBtn.addEventListener('click', () => {
        this.openNewWindow('token-shop-new.html');
      });
    }

    // Admin button
    const adminBtn = document.getElementById('admin-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        this.openNewWindow('admin-simple.html');
      });
    }

    // Theme toggle button
    const themeBtn = document.getElementById('theme-toggle-menu');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Sidebar controls
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const overlay = document.getElementById('overlay');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
      });
    }

    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    }

    // Avatar upload
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    
    if (changeAvatarBtn && avatarUpload) {
      changeAvatarBtn.addEventListener('click', () => {
        avatarUpload.click();
      });
      
      avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleAvatarUpload(file);
        }
      });
    }
  }

  updateUI() {
    // Update user info
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = this.currentUser;
    }
    
    // Update tokens
    this.updateTokenDisplay();
    
    // Update avatar
    this.updateAvatarDisplay();
    
    // Setup color themes
    this.setupColorThemes();
  }

  updateTokenDisplay() {
    try {
      const users = JSON.parse(this.getStorageItem('users') || '{}');
      if (this.currentUser && users[this.currentUser]) {
        this.currentTokens = users[this.currentUser].tokens || 0;
        this.setStorageItem('userTokens', this.currentTokens.toString());
      }
      
      const tokenElement = document.getElementById('token-count');
      if (tokenElement) {
        tokenElement.textContent = this.currentTokens;
      }
    } catch (error) {
      console.log('Update token display error:', error);
    }
  }

  updateAvatarDisplay() {
    try {
      const avatar = this.getStorageItem('userAvatar');
      const userAvatarElement = document.getElementById('user-avatar');
      
      if (userAvatarElement) {
        if (avatar && avatar !== '') {
          userAvatarElement.src = avatar;
          userAvatarElement.style.display = 'block';
        } else {
          userAvatarElement.style.display = 'none';
          const avatarContainer = userAvatarElement.parentElement;
          if (avatarContainer) {
            const textAvatar = avatarContainer.querySelector('.text-avatar');
            if (!textAvatar) {
              const textAvatarDiv = document.createElement('div');
              textAvatarDiv.className = 'text-avatar';
              textAvatarDiv.textContent = this.currentUser.charAt(0).toUpperCase();
              textAvatarDiv.style.cssText = `
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
              `;
              avatarContainer.appendChild(textAvatarDiv);
            }
          }
        }
      }
    } catch (error) {
      console.log('Update avatar display error:', error);
    }
  }

  setupColorThemes() {
    const colorGrid = document.getElementById('color-grid');
    if (!colorGrid) return;
    
    const themes = [
      { id: 1, name: 'Xanh dương', price: 100, primary: '#3B82F6', secondary: '#1E40AF', bg: '#EFF6FF' },
      { id: 2, name: 'Xanh lá', price: 150, primary: '#10B981', secondary: '#047857', bg: '#F0FDF4' },
      { id: 3, name: 'Tím', price: 200, primary: '#8B5CF6', secondary: '#6D28D9', bg: '#F5F3FF' },
      { id: 4, name: 'Hồng', price: 250, primary: '#EC4899', secondary: '#BE185D', bg: '#FDF2F8' },
      { id: 5, name: 'Vàng', price: 300, primary: '#F59E0B', secondary: '#D97706', bg: '#FFFBEB' },
      { id: 6, name: 'Cam', price: 350, primary: '#F97316', secondary: '#EA580C', bg: '#FFF7ED' },
      { id: 7, name: 'Đỏ', price: 400, primary: '#EF4444', secondary: '#DC2626', bg: '#FEF2F2' },
      { id: 8, name: 'Xám', price: 180, primary: '#6B7280', secondary: '#4B5563', bg: '#F9FAFB' },
      { id: 9, name: 'Xanh ngọc', price: 220, primary: '#14B8A6', secondary: '#0F766E', bg: '#F0FDFA' },
      { id: 10, name: 'Xanh xanh', price: 160, primary: '#6366F1', secondary: '#4F46E5', bg: '#EEF2FF' },
      { id: 11, name: 'Xám đỏ', price: 280, primary: '#A855F7', secondary: '#9333EA', bg: '#FAF5FF' },
      { id: 12, name: 'Xám hồng', price: 320, primary: '#F472B6', secondary: '#EC4899', bg: '#FDF4FF' },
      { id: 13, name: 'Nâu', price: 190, primary: '#92400E', secondary: '#78350F', bg: '#FEF3C7' },
      { id: 14, name: 'Xanh đậm', price: 240, primary: '#1E40AF', secondary: '#1E3A8A', bg: '#DBEAFE' },
      { id: 15, name: 'Xám đậm', price: 170, primary: '#374151', secondary: '#111827', bg: '#F3F4F6' },
      { id: 16, name: 'Xám nhạt', price: 140, primary: '#D1D5DB', secondary: '#9CA3AF', bg: '#F9FAFB' }
    ];
    
    colorGrid.innerHTML = '';
    
    themes.forEach(theme => {
      const colorItem = document.createElement('div');
      colorItem.className = 'color-item';
      
      const purchasedColors = JSON.parse(this.getStorageItem('purchasedColors') || '[]');
      const isPurchased = purchasedColors.includes(theme.id);
      const canAfford = this.currentTokens >= theme.price;
      
      if (isPurchased) {
        colorItem.classList.add('purchased');
      }
      
      if (!isPurchased && !canAfford) {
        colorItem.classList.add('locked');
      }
      
      colorItem.innerHTML = `
        <div class="color-preview" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary});"></div>
        <div class="color-name">${theme.name}</div>
        ${isPurchased 
          ? '<div class="color-owned">✅ Đã sở hữu</div>' 
          : `<div class="color-price">${theme.price} tokens</div>`
        }
        ${!isPurchased && !canAfford ? '<div class="lock-icon">🔒</div>' : ''}
      `;
      
      colorItem.addEventListener('click', () => this.selectColor(theme));
      colorGrid.appendChild(colorItem);
    });
  }

  selectColor(theme) {
    const purchasedColors = JSON.parse(this.getStorageItem('purchasedColors') || '[]');
    const isPurchased = purchasedColors.includes(theme.id);
    
    if (!isPurchased) {
      if (this.currentTokens < theme.price) {
        this.addMessage(`Bạn cần ${theme.price} tokens để mua màu này! Hiện tại bạn có ${this.currentTokens} tokens.`, 'bot');
        return;
      }
      
      if (confirm(`Mua màu "${theme.name}" với ${theme.price} tokens?`)) {
        this.purchaseColor(theme);
      }
    } else {
      this.applyColor(theme);
    }
  }

  purchaseColor(theme) {
    this.currentTokens -= theme.price;
    purchasedColors.push(theme.id);
    
    this.updateUserData();
    this.setupColorThemes();
    this.updateTokenDisplay();
    
    this.addMessage(`✅ Đã mua màu "${theme.name}"!`, 'bot');
  }

  applyColor(theme) {
    const selectedTheme = theme.id.toString();
    this.updateUserData();
    this.setupColorThemes();
    
    const colors = this.getThemeColors(selectedTheme);
    if (colors) {
      const root = document.documentElement;
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-hover', colors.secondary);
      root.style.setProperty('--primary-light', colors.bg);
      root.style.setProperty('--text-primary', colors.textColor || '#000000');
      
      if (document.body) {
        document.body.style.background = `linear-gradient(145deg, ${colors.bg} 0%, ${colors.primary}15 50%, ${colors.bg} 100%)`;
      }
    }
    
    this.addMessage(`✅ Đã áp dụng màu "${theme.name}"!`, 'bot');
  }

  updateUserData() {
    const users = JSON.parse(this.getStorageItem('users') || '{}');
    if (this.currentUser && users[this.currentUser]) {
      users[this.currentUser].tokens = this.currentTokens;
      users[this.currentUser].purchasedColors = purchasedColors;
      users[this.currentUser].selectedColorTheme = selectedTheme;
      
      this.setStorageItem('users', JSON.stringify(users));
      this.setStorageItem('userTokens', this.currentTokens.toString());
      this.setStorageItem('purchasedColors', JSON.stringify(purchasedColors));
      this.setStorageItem('selectedColorTheme', selectedTheme);
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Check for commands
    if (message.startsWith('/')) {
      const commandResponse = this.processCommand(message);
      if (commandResponse) {
        this.addMessage(commandResponse, 'bot');
      }
      messageInput.value = '';
      return;
    }
    
    // Add user message
    this.addMessage(message, 'user');
    messageInput.value = '';
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      this.addMessage(response, 'bot');
    } catch (error) {
      this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
      this.hideTypingIndicator();
    }
  }

  processCommand(text) {
    const command = text.toLowerCase().trim();
    
    if (command === '/143') {
      this.isDeepAnalysisMode = !this.isDeepAnalysisMode;
      return this.isDeepAnalysisMode ? "Deep analysis mode activated!" : "Deep analysis mode deactivated!";
    } else if (command === '/tambietlop9') {
      return "🔗 Special link: https://example.com/special-link";
    } else if (command.startsWith('/admin')) {
      this.openNewWindow('admin-simple.html');
      return "🔐 Đang chuyển đến trang quản lý người dùng...";
    } else if (command.startsWith('/token')) {
      this.openNewWindow('token-shop-new.html');
      return "🛍️ Đang chuyển đến cửa hàng token...";
    } else if (command.startsWith('/study')) {
      this.openNewWindow('study-room.html');
      return "📚 Đang chuyển đến phòng học...";
    }
    
    return null;
  }

  openNewWindow(url) {
    try {
      const currentUrl = window.location.href;
      if (currentUrl.startsWith('file://')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.log('Open window error:', error);
      window.location.href = url;
    }
  }

  addMessage(message, sender) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'user') {
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text">${message}</div>
          <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text">${message}</div>
          <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    this.conversationHistory.push({ role: sender, content: message });
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async getAIResponse(message) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      "That's interesting! Tell me more about that.",
      "I understand. How can I help you with this?",
      "Great question! Let me think about that...",
      "I see what you mean. Here's my perspective...",
      "That's a good point. Have you considered...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.style.getPropertyValue('--text-primary');
    
    if (currentTheme === '#000000') {
      // Switch to light theme
      root.style.setProperty('--text-primary', '#000000');
      document.body.style.background = 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)';
    } else {
      // Switch to dark theme
      root.style.setProperty('--text-primary', '#ffffff');
      document.body.style.background = 'linear-gradient(145deg, #1a202c 0%, #0f172a 50%, #1a202c 100%)';
    }
  }

  handleAvatarUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.setStorageItem('userAvatar', dataUrl);
      this.updateAvatarDisplay();
      this.addMessage('✅ Avatar đã được cập nhật!', 'bot');
    };
    reader.readAsDataURL(file);
  }

  startHeartbeat() {
    setInterval(() => {
      const sessionData = this.getStorageItem('authSession');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          session.lastActivity = Date.now();
          this.setStorageItem('authSession', JSON.stringify(session));
        } catch (error) {
          console.log('Heartbeat error:', error);
        }
      }
    }, 30000);
  }

  logout() {
    this.setStorageItem('currentUser', null);
    this.setStorageItem('authSession', null);
    window.location.reload();
  }
}

// Initialize main app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing main app with authentication check...');
  new MainAppWithAuth();
});

// Export for global access
window.MainAppWithAuth = MainAppWithAuth;
