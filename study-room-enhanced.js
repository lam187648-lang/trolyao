// Enhanced Study Room with Study Time Tracking
class EnhancedStudyRoom {
  constructor() {
    this.users = new Map();
    this.currentUser = null;
    this.sessionStartTime = null;
    this.totalStudyTime = 0;
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.loadFromLocalStorage();
    this.setupEventListeners();
    this.renderGrid();
    this.startHeartbeat();
    this.updateStats();
    
    // Check if user was already joined
    if (this.currentUser) {
      this.joinStudyRoom(this.currentUser);
    }
  }

  checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
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
          <div style="font-size: 48px; margin-bottom: 20px;">??</div>
          <h2 style="color: #1e40af; margin-bottom: 16px;">Yêu Càu ??ng Nh?p</h2>
          <p style="color: #64748b; margin-bottom: 24px;">B?n ph?i ??ng nh?p ?? tham gia phòng h?c!</p>
          <button onclick="window.location.href='auth.html'" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
            ??ng Nh?p Ngay
          </button>
        </div>
      </div>
    `;
  }

  loadFromLocalStorage() {
    const savedUsers = localStorage.getItem('studyRoomUsers');
    if (savedUsers) {
      this.users = new Map(JSON.parse(savedUsers));
    }
    
    const savedCurrentUser = localStorage.getItem('studyRoomCurrentUser');
    if (savedCurrentUser) {
      this.currentUser = JSON.parse(savedCurrentUser);
    }
    
    const savedTotalTime = localStorage.getItem('totalStudyTime');
    if (savedTotalTime) {
      this.totalStudyTime = parseInt(savedTotalTime);
    }
  }

  saveToLocalStorage() {
    localStorage.setItem('studyRoomUsers', JSON.stringify(Array.from(this.users.entries())));
    if (this.currentUser) {
      localStorage.setItem('studyRoomCurrentUser', JSON.stringify(this.currentUser));
    }
    localStorage.setItem('totalStudyTime', this.totalStudyTime.toString());
  }

  setupEventListeners() {
    // Setup join button
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => this.handleJoin());
    }

    // Setup leave button
    const leaveBtn = document.getElementById('leave-btn');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', () => this.leaveStudyRoom());
    }

    // Display authenticated user info
    this.displayUserInfo();
  }

  displayUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      const user = users[currentUser];
      const userInfoDiv = document.getElementById('user-info');
      
      if (userInfoDiv) {
        userInfoDiv.innerHTML = `
          <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: var(--primary-light); border-radius: 12px; margin-bottom: 20px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">
              ${currentUser.charAt(0).toUpperCase()}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--text-primary); font-size: 16px;">${currentUser}</div>
              <div style="font-size: 14px; color: var(--text-secondary);">
                Tokens: ${user.tokens || 0}
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  handleJoin() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!currentUser || !users[currentUser]) {
      this.showMessage('B?n ph?i ??ng nh?p ?? tham gia phòng h?c!', 'error');
      return;
    }

    // Create user data for study room
    const userData = {
      id: currentUser,
      name: currentUser,
      avatar: users[currentUser].avatar || '',
      joinTime: Date.now(),
      studyTime: 0,
      tokens: users[currentUser].tokens || 0,
      studyStats: users[currentUser].studyStats || {
        totalMinutes: 0,
        totalDays: 0,
        sessions: 0,
        lastStudyDate: null
      }
    };

    console.log('Joining with authenticated user data:', userData);
    this.joinStudyRoom(userData);
  }

  joinStudyRoom(userData) {
    this.users.set(userData.id, userData);
    this.sessionStartTime = Date.now();
    this.startStudyTimer();
    
    // Save user info to main app storage
    this.saveUserInfoToMainApp(userData);
    
    // Hide join section
    const joinSection = document.getElementById('join-section');
    if (joinSection) {
      joinSection.style.display = 'none';
    }
    
    this.renderGrid();
    this.saveToLocalStorage();
    this.showMessage(`Chào m?ng ${userData.name} ?? tham gia phòng h?c!`, 'success');
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
      
      // Update user's study stats
      this.updateStudyStats(sessionTime);
    }
    
    this.users.delete(this.currentUser.id);
    this.stopStudyTimer();
    
    // Show join section
    const joinSection = document.getElementById('join-section');
    if (joinSection) {
      joinSection.style.display = 'flex';
    }
    
    // Keep currentUser but clear session data
    this.sessionStartTime = null;
    
    this.renderGrid();
    this.saveToLocalStorage();
    this.showMessage('B?n ?? r?i khoi phòng h?c!', 'info');
  }

  updateStudyStats(sessionTime) {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      const sessionMinutes = Math.floor(sessionTime / 60000);
      const today = new Date().toDateString();
      
      // Initialize study stats if not exists
      if (!users[currentUser].studyStats) {
        users[currentUser].studyStats = {
          totalMinutes: 0,
          totalDays: 0,
          sessions: 0,
          lastStudyDate: null
        };
      }
      
      const stats = users[currentUser].studyStats;
      
      // Update total minutes
      stats.totalMinutes += sessionMinutes;
      
      // Check if this is a new study day
      if (stats.lastStudyDate !== today) {
        stats.totalDays += 1;
        stats.lastStudyDate = today;
      }
      
      // Update sessions
      stats.sessions += 1;
      
      // Save back to users
      users[currentUser].studyStats = stats;
      localStorage.setItem('users', JSON.stringify(users));
      
      console.log('Updated study stats:', stats);
      
      // Display stats
      this.displayStudyStats(stats);
    }
  }

  displayStudyStats(stats) {
    const statsDiv = document.getElementById('study-stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div style="background: var(--primary-light); padding: 15px; border-radius: 12px; margin-top: 20px;">
          <h3 style="color: var(--primary); margin-bottom: 10px;">Th?ng Kê H?c T?p</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary);">${stats.totalMinutes}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Phút h?c</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary);">${stats.totalDays}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Ngày h?c</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary);">${stats.sessions}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Bu?i h?c</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  startStudyTimer() {
    this.studyTimer = setInterval(() => {
      if (this.sessionStartTime) {
        const currentTime = Date.now();
        const sessionTime = Math.floor((currentTime - this.sessionStartTime) / 60000);
        
        // Update display
        const timerDiv = document.getElementById('session-timer');
        if (timerDiv) {
          timerDiv.textContent = `Th?i gian h?c: ${sessionTime} phút`;
        }
        
        // Check for 10-minute milestone
        if (sessionTime > 0 && sessionTime % 10 === 0) {
          this.awardStudyTokens(10);
        }
      }
    }, 1000); // Update every second
  }

  stopStudyTimer() {
    if (this.studyTimer) {
      clearInterval(this.studyTimer);
      this.studyTimer = null;
    }
  }

  awardStudyTokens(minutes) {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      const tokenAmount = Math.floor(minutes / 10) * 20; // 20 tokens per 10 minutes
      
      users[currentUser].tokens = (users[currentUser].tokens || 0) + tokenAmount;
      localStorage.setItem('users', JSON.stringify(users));
      
      this.showMessage(`Chúc m?ng! B?n nh?n du?c ${tokenAmount} tokens sau ${minutes} phút h?c!`, 'success');
      
      // Update display
      this.displayUserInfo();
    }
  }

  renderGrid() {
    const grid = document.getElementById('study-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    this.users.forEach(user => {
      const userElement = document.createElement('div');
      userElement.className = 'user-card';
      userElement.innerHTML = `
        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="user-name">${user.name}</div>
        <div class="user-status">??ang h?c</div>
      `;
      grid.appendChild(userElement);
    });
  }

  startHeartbeat() {
    setInterval(() => {
      if (this.currentUser) {
        this.currentUser.lastSeen = Date.now();
        this.saveToLocalStorage();
      }
    }, 30000); // Update every 30 seconds
  }

  updateStats() {
    const statsDiv = document.getElementById('room-stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <p>Ng??i dùng: ${this.users.size}</p>
        <p>T?ng th?i gian: ${Math.floor(this.totalStudyTime / 60)} gi?</p>
      `;
    }
  }

  showMessage(message, type = 'info') {
    // Create enhanced toast notification with icon
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Icon mapping for different message types
    const icons = {
      'error': '??',
      'success': '??', 
      'info': '??',
      'warning': '??'
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

// Initialize the enhanced study room when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Quick check before initializing
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (!currentUser || !users[currentUser]) {
    console.log('No authenticated user found, redirecting to login...');
    window.location.href = 'auth.html';
    return;
  }
  
  new EnhancedStudyRoom();
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
