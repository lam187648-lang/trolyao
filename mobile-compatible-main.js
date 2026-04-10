// Mobile Compatible Main Application System
class MobileMainApp {
  constructor() {
    this.currentUser = null;
    this.currentTokens = 0;
    this.conversationHistory = [];
    this.isTyping = false;
    this.isDeepAnalysisMode = false;
    this.init();
  }

  init() {
    // Check authentication first
    if (!this.checkAuth()) {
      return;
    }
    
    this.loadUserData();
    this.setupEventListeners();
    this.updateUI();
    this.startHeartbeat();
  }

  checkAuth() {
    // Load MobileSessionManager
    const script = document.createElement('script');
    script.src = 'mobile-compatible-auth.js';
    script.onload = () => {
      if (typeof MobileSessionManager !== 'undefined') {
        const isValid = MobileSessionManager.checkSession();
        if (!isValid) {
          this.redirectToAuth();
          return false;
        }
        this.currentUser = MobileSessionManager.getStorageItem('currentUser');
        return true;
      }
    };
    document.head.appendChild(script);
    
    // Fallback check
    this.currentUser = this.getStorageItem('currentUser');
    if (!this.currentUser) {
      this.redirectToAuth();
      return false;
    }
    return true;
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

  redirectToAuth() {
    // Handle mobile file:// URL issues
    const currentUrl = window.location.href;
    if (currentUrl.startsWith('file://')) {
      window.location.href = 'auth.html';
    } else {
      window.location.href = 'auth.html';
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
        
        // Apply saved theme
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
        // Apply theme colors with proper text colors
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
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    
    // Message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
    
    // Command processing
    window.processCommand = (text) => this.processCommand(text);
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
        } else {
          // Default avatar with first letter
          userAvatarElement.style.display = 'none';
          const avatarContainer = userAvatarElement.parentElement;
          if (avatarContainer) {
            const textAvatar = document.createElement('div');
            textAvatar.className = 'text-avatar';
            textAvatar.textContent = this.currentUser.charAt(0).toUpperCase();
            textAvatar.style.cssText = `
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
            avatarContainer.appendChild(textAvatar);
          }
        }
      }
    } catch (error) {
      console.log('Update avatar display error:', error);
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
      return "?? Special link: https://example.com/special-link";
    } else if (command.startsWith('/admin')) {
      this.openNewWindow('admin-simple.html');
      return "?? Redirecting to admin panel...";
    } else if (command.startsWith('/token')) {
      this.openNewWindow('token-shop-new.html');
      return "?? Redirecting to token shop...";
    } else if (command.startsWith('/study')) {
      this.openNewWindow('study-room.html');
      return "?? Redirecting to study room...";
    }
    
    return null;
  }

  openNewWindow(url) {
    try {
      // Handle mobile file:// URL issues
      const currentUrl = window.location.href;
      if (currentUrl.startsWith('file://')) {
        // For local files, try to open in same window
        window.location.href = url;
      } else {
        // For web server, open in new tab
        window.open(url, '_blank');
      }
    } catch (error) {
      console.log('Open window error:', error);
      // Fallback to same window
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
    
    // Add to conversation history
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
    // Simulate AI response (replace with actual API call)
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

  startHeartbeat() {
    // Update last activity every 30 seconds
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
    if (typeof MobileSessionManager !== 'undefined') {
      MobileSessionManager.clearSession();
    }
    this.redirectToAuth();
  }
}

// Initialize main app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing mobile compatible main app...');
  new MobileMainApp();
});

// Export for global access
window.MobileMainApp = MobileMainApp;
