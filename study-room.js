// Study Room Management System
class StudyRoom {
  constructor() {
    this.users = new Map(); // userId -> user data
    this.studyTimer = null;
    this.totalStudyTime = 0;
    this.sessionStartTime = null;
    this.maxUsers = 50;
    this.gridSlots = [];
    
    this.init();
  }

  init() {
    // Check authentication first
    if (!this.checkAuthentication()) {
      this.redirectToLogin();
      return;
    }
    
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.renderGrid();
    this.startHeartbeat();
    this.updateStats();
    
    // Check if user was already joined
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.joinStudyRoom(currentUser);
    }
  }

  getCurrentUser() {
    return localStorage.getItem('currentUser');
  }

  checkAuthentication() {
    const currentUser = this.getCurrentUser();
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Debug logging
    console.log('Study Room Auth Check:');
    console.log('- currentUser from localStorage:', currentUser);
    console.log('- users object keys:', Object.keys(users));
    console.log('- user exists:', currentUser && users[currentUser]);
    
    return currentUser && users[currentUser];
  }

  redirectToLogin() {
    // Show authentication required message
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); font-family: Inter, sans-serif;">
        <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
          <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
          <h2 style="color: #1e40af; margin-bottom: 16px;">Yêu Cầu Đăng Nhập</h2>
          <p style="color: #64748b; margin-bottom: 24px;">Bạn cần đăng nhập tài khoản để tham gia phòng học trực tuyến!</p>
          <button onclick="window.location.href='index.html'" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    `;
  }

  loadFromLocalStorage() {
    // Get current authenticated user
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = users[currentUser];
      if (userData) {
        // Check for existing study room session first
        const savedStudyUser = localStorage.getItem('studyRoomUser');
        if (savedStudyUser) {
          const savedData = JSON.parse(savedStudyUser);
          if (savedData.name === currentUser) {
            // Restore existing session
            this.currentUser = { ...savedData };
            this.currentUser.lastSeen = Date.now();
          } else {
            // Create new study room user data
            this.currentUser = {
              id: 'user_' + currentUser,
              name: currentUser,
              avatar: userData.avatar || this.generateAvatar(currentUser),
              joinTime: Date.now(),
              lastSeen: Date.now(),
              studyTime: 0,
              status: 'studying'
            };
          }
        } else {
          // Create new study room user data
          this.currentUser = {
            id: 'user_' + currentUser,
            name: currentUser,
            avatar: userData.avatar || this.generateAvatar(currentUser),
            joinTime: Date.now(),
            lastSeen: Date.now(),
            studyTime: 0,
            status: 'studying'
          };
        }
      }
    }
    
    const savedUsers = localStorage.getItem('studyRoomUsers');
    if (savedUsers) {
      const usersData = JSON.parse(savedUsers);
      // Filter out inactive users (last seen more than 5 minutes ago)
      const now = Date.now();
      usersData.forEach(userData => {
        if (now - userData.lastSeen < 5 * 60 * 1000) {
          this.users.set(userData.id, userData);
        }
      });
    }
    
    const savedStudyTime = localStorage.getItem('totalStudyTime');
    if (savedStudyTime) {
      this.totalStudyTime = parseInt(savedStudyTime);
    }
  }

  saveToLocalStorage() {
    if (this.currentUser) {
      localStorage.setItem('studyRoomUser', JSON.stringify(this.currentUser));
    }
    
    const usersArray = Array.from(this.users.values());
    localStorage.setItem('studyRoomUsers', JSON.stringify(usersArray));
    
    localStorage.setItem('totalStudyTime', this.totalStudyTime.toString());
  }

  setupEventListeners() {
    // Display authenticated user info
    this.displayUserInfo();

    // Join button - make sure it exists and is properly bound
    const joinBtn = document.getElementById('join-room-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Join button clicked');
        this.handleJoin();
      });
    } else {
      console.error('Join button not found!');
    }

    // Leave button (when joined)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('leave-btn')) {
        this.leaveStudyRoom();
      }
    });
  }

  displayUserInfo() {
    if (!this.currentUser) return;

    const userNameDisplay = document.getElementById('user-name-display');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const avatarPlaceholder = document.querySelector('.user-avatar-display .avatar-placeholder');

    if (userNameDisplay) {
      userNameDisplay.textContent = this.currentUser.name;
    }

    if (userAvatarImg && this.currentUser.avatar) {
      userAvatarImg.src = this.currentUser.avatar;
      userAvatarImg.style.display = 'block';
      if (avatarPlaceholder) {
        avatarPlaceholder.style.display = 'none';
      }
    }
  }

  handleJoin() {
    console.log('handleJoin called');
    
    if (!this.currentUser) {
      this.showMessage('Bạn cần đăng nhập để tham gia phòng học!', 'error');
      this.redirectToLogin();
      return;
    }

    if (this.users.size >= this.maxUsers) {
      this.showMessage('Phòng học đã đầy! Vui lòng quay lại sau.', 'error');
      return;
    }

    // Check if user already exists in the room
    if (this.users.has(this.currentUser.id)) {
      this.showMessage('Bạn đã có trong phòng học!', 'info');
      return;
    }

    // Update user data for joining
    this.currentUser.joinTime = Date.now();
    this.currentUser.lastSeen = Date.now();
    this.currentUser.status = 'studying';

    console.log('Joining with authenticated user data:', this.currentUser);
    this.joinStudyRoom(this.currentUser);
  }

  joinStudyRoom(userData) {
    this.users.set(userData.id, userData);
    this.sessionStartTime = Date.now();
    this.startStudyTimer();
    
    // Save user info to main app storage
    this.saveUserInfoToMainApp(userData);
    
    // Hide join section
    const joinSection = document.getElementById('join-section');
    joinSection.style.display = 'none';
    
    this.renderGrid();
    this.saveToLocalStorage();
    this.showMessage(`Chào mừng ${userData.name} đã tham gia phòng học!`, 'success');
  }

  saveUserInfoToMainApp(userData) {
    // Save to main app's user system
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      // Update last activity and study room info
      users[currentUser].lastStudyRoomVisit = Date.now();
      users[currentUser].studyRoomSessions = (users[currentUser].studyRoomSessions || 0) + 1;
      users[currentUser].totalStudyTime = (users[currentUser].totalStudyTime || 0) + 0;
      
      localStorage.setItem('users', JSON.stringify(users));
      console.log('Saved user info to main app:', currentUser);
    }
  }

  leaveStudyRoom() {
    if (!this.currentUser) return;
    
    // Update study time
    if (this.sessionStartTime) {
      const sessionTime = Date.now() - this.sessionStartTime;
      this.currentUser.studyTime += sessionTime;
      this.totalStudyTime += Math.floor(sessionTime / 60000); // Convert to minutes
    }
    
    this.users.delete(this.currentUser.id);
    this.stopStudyTimer();
    
    // Show join section
    const joinSection = document.getElementById('join-section');
    joinSection.style.display = 'flex';
    
    // Refresh user info display
    this.displayUserInfo();
    
    this.renderGrid();
    this.saveToLocalStorage();
    this.showMessage('Bạn đã rời khỏi phòng học!', 'info');
  }

  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateAvatar(name) {
    // Generate a simple avatar based on name
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const color = colors[name.charCodeAt(0) % colors.length];
    const initial = name.charAt(0).toUpperCase();
    
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 80, 80);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, 40, 40);
    
    return canvas.toDataURL();
  }

  renderGrid() {
    const grid = document.getElementById('study-grid');
    grid.innerHTML = '';
    
    // Create 50 slots
    for (let i = 0; i < this.maxUsers; i++) {
      const slot = document.createElement('div');
      slot.className = 'grid-slot';
      
      const user = this.getUserBySlot(i);
      if (user) {
        slot.classList.add('occupied');
        slot.innerHTML = `
          <img src="${user.avatar}" alt="${user.name}" class="slot-avatar">
          <div class="slot-name">${user.name}</div>
          <div class="slot-timer">${this.formatTime(user.studyTime + (Date.now() - user.joinTime))}</div>
          <div class="slot-status"></div>
          ${user.id === this.currentUser?.id ? '<button class="leave-btn" style="position: absolute; top: 4px; left: 4px; background: rgba(239,68,68,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">×</button>' : ''}
        `;
      } else {
        slot.classList.add('empty');
        slot.innerHTML = `
          <div class="empty-slot-icon">+</div>
          <div class="empty-slot-text">Trống</div>
        `;
      }
      
      grid.appendChild(slot);
      this.gridSlots.push(slot);
    }
    
    this.updateUserCount();
  }

  getUserBySlot(slotIndex) {
    const usersArray = Array.from(this.users.values());
    return usersArray[slotIndex];
  }

  updateUserCount() {
    const currentUsersSpan = document.getElementById('current-users');
    const activeUsersSpan = document.getElementById('active-users');
    
    currentUsersSpan.textContent = this.users.size;
    activeUsersSpan.textContent = this.users.size;
  }

  startStudyTimer() {
    this.stopStudyTimer(); // Clear any existing timer
    
    this.studyTimer = setInterval(() => {
      if (this.currentUser && this.sessionStartTime) {
        const elapsed = Date.now() - this.sessionStartTime;
        document.getElementById('study-timer').textContent = this.formatTime(elapsed);
        
        // Update user's study time
        this.currentUser.studyTime = elapsed;
        this.users.set(this.currentUser.id, this.currentUser);
        
        // Update grid display
        this.updateGridTimers();
      }
    }, 1000);
  }

  stopStudyTimer() {
    if (this.studyTimer) {
      clearInterval(this.studyTimer);
      this.studyTimer = null;
    }
  }

  updateGridTimers() {
    const slots = document.querySelectorAll('.grid-slot.occupied');
    slots.forEach((slot, index) => {
      const user = this.getUserBySlot(index);
      if (user) {
        const timerElement = slot.querySelector('.slot-timer');
        if (timerElement) {
          timerElement.textContent = this.formatTime(user.studyTime + (Date.now() - user.joinTime));
        }
      }
    });
  }

  startHeartbeat() {
    // Update last seen time every 30 seconds
    setInterval(() => {
      if (this.currentUser) {
        this.currentUser.lastSeen = Date.now();
        this.users.set(this.currentUser.id, this.currentUser);
        this.cleanupInactiveUsers();
        this.saveToLocalStorage();
      }
    }, 30000);
  }

  cleanupInactiveUsers() {
    const now = Date.now();
    const inactiveUsers = [];
    
    for (let [id, user] of this.users) {
      if (now - user.lastSeen > 5 * 60 * 1000) { // 5 minutes
        inactiveUsers.push(id);
      }
    }
    
    inactiveUsers.forEach(id => {
      this.users.delete(id);
    });
    
    if (inactiveUsers.length > 0) {
      this.renderGrid();
    }
  }

  updateStats() {
    setInterval(() => {
      document.getElementById('total-study-time').textContent = this.totalStudyTime;
      
      // Calculate study streak (simplified - just for demo)
      const streak = parseInt(localStorage.getItem('studyStreak') || '0');
      document.getElementById('study-streak').textContent = streak;
    }, 1000);
  }

  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const displaySeconds = seconds % 60;
    const displayMinutes = minutes % 60;
    const displayHours = hours;
    
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
  }

  showMessage(message, type = 'info') {
    // Create enhanced toast notification with icon
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Icon mapping for different message types
    const icons = {
      'error': '❌',
      'success': '✅', 
      'info': 'ℹ️',
      'warning': '⚠️'
    };
    
    // Color mapping for different message types
    const colors = {
      'error': { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', border: '#b91c1c' },
      'success': { bg: 'linear-gradient(135deg, #34d399, #10b981)', border: '#059669' },
      'info': { bg: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: '#3730a3' },
      'warning': { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '#b45309' }
    };
    
    const color = colors[type] || colors.info;
    const icon = icons[type] || icons.info;
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: ${color.bg};
      color: white;
      border: 2px solid ${color.border};
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      z-index: 10000;
      animation: slideInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      max-width: 400px;
      min-width: 300px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;
    
    // Add icon and message content
    toast.innerHTML = `
      <span style="font-size: 20px; flex-shrink: 0;">${icon}</span>
      <span style="flex: 1; line-height: 1.4;">${message}</span>
      <span style="font-size: 16px; opacity: 0.8; cursor: pointer;" onclick="this.parentElement.remove()">×</span>
    `;
    
    // Add hover effects
    toast.addEventListener('mouseenter', () => {
      toast.style.transform = 'scale(1.02)';
      toast.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2)';
    });
    
    toast.addEventListener('mouseleave', () => {
      toast.style.transform = 'scale(1)';
      toast.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)';
    });
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.style.animation = 'slideOutScale 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentElement) {
          document.body.removeChild(toast);
        }
      }, 300);
    });
    
    document.body.appendChild(toast);
    
    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOutScale 0.3s ease-out';
        setTimeout(() => {
          if (toast.parentElement) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);
    
    // Clear timer if manually dismissed
    toast.addEventListener('click', () => {
      clearTimeout(dismissTimer);
    });
  }
}

// Add enhanced animations for toast notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes slideInBounce {
    0% { transform: translateX(100%) scale(0.8); opacity: 0; }
    50% { transform: translateX(-10px) scale(1.05); opacity: 1; }
    70% { transform: translateX(5px) scale(0.98); opacity: 1; }
    100% { transform: translateX(0) scale(1); opacity: 1; }
  }
  @keyframes slideOutScale {
    0% { transform: translateX(0) scale(1); opacity: 1; }
    100% { transform: translateX(100%) scale(0.8); opacity: 0; }
  }
  
  /* Toast notification styles */
  .toast-notification {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .toast-error {
    background: linear-gradient(135deg, #ef4444, #dc2626) !important;
    border-color: #b91c1c !important;
  }
  
  .toast-success {
    background: linear-gradient(135deg, #34d399, #10b981) !important;
    border-color: #059669 !important;
  }
  
  .toast-info {
    background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
    border-color: #3730a3 !important;
  }
  
  .toast-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706) !important;
    border-color: #b45309 !important;
  }
`;
document.head.appendChild(style);

// Initialize the study room when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Quick check before initializing
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (!currentUser || !users[currentUser]) {
    console.log('No authenticated user found, redirecting to login...');
    window.location.href = 'index.html';
    return;
  }
  
  new StudyRoom();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // User left the page - update last seen
    const studyRoom = window.studyRoom;
    if (studyRoom && studyRoom.currentUser) {
      studyRoom.currentUser.lastSeen = Date.now();
      studyRoom.saveToLocalStorage();
    }
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  const studyRoom = window.studyRoom;
  if (studyRoom && studyRoom.currentUser) {
    studyRoom.currentUser.lastSeen = Date.now();
    studyRoom.saveToLocalStorage();
  }
});
