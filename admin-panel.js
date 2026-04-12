// Admin Panel Management System - Fixed to show users from localStorage
class AdminPanel {
  constructor() {
    this.activeUsers = new Map();
    this.serverStartTime = Date.now();
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.loadUserData();
    this.renderAllUsers();
    this.updateSystemStats();
    
    // Update user list every 3 seconds to detect new logins
    setInterval(() => {
      this.renderAllUsers();
    }, 3000);
  }

  checkAuthentication() {
    console.log('Admin panel accessed');
  }

  loadUserData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser && users[currentUser]) {
      document.getElementById('current-tokens').textContent = users[currentUser].tokens || 0;
    }
  }

  // Get currently logged in users from all devices (using lastActive)
  getOnlineUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const onlineUsers = [];
    const now = Date.now();
    const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    
    Object.entries(users).forEach(([username, userData]) => {
      const lastActive = userData.lastActive || userData.lastLogin || 0;
      const isOnline = (now - lastActive) < ONLINE_THRESHOLD;
      
      onlineUsers.push({
        username: username,
        tokens: userData.tokens || 0,
        isOnline: isOnline,
        lastActive: lastActive,
        lastSeen: this.formatLastSeen(now - lastActive)
      });
    });
    
    // Sort: online first, then by last active
    return onlineUsers.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return b.lastActive - a.lastActive;
    });
  }

  formatLastSeen(diffMs) {
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  }

  renderAllUsers() {
    const usersList = document.getElementById('active-users-list');
    const allUsers = this.getOnlineUsers();
    const onlineCount = allUsers.filter(u => u.isOnline).length;
    
    if (allUsers.length === 0) {
      usersList.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Chưa có tài khoản nào</div>';
      document.getElementById('online-users').textContent = '0';
      document.getElementById('total-users').textContent = '0';
      return;
    }
    
    usersList.innerHTML = '';
    
    allUsers.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.style.opacity = user.isOnline ? '1' : '0.6';
      
      const statusColor = user.isOnline ? '#22c55e' : '#888';
      const statusText = user.isOnline ? '🟢 Online' : `⚪ ${user.lastSeen}`;
      
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar-small" style="background:${user.isOnline ? 'var(--primary)' : '#888'}">
            ${user.username.charAt(0).toUpperCase()}
          </div>
          <div class="user-details">
            <div class="user-name-small">${user.username}</div>
            <div class="user-status" style="color:${statusColor};font-size:11px;">
              ${statusText} | 💎 ${user.tokens} tokens
            </div>
          </div>
        </div>
        <button class="kick-btn" onclick="kickUser('${user.username}')">Xóa</button>
      `;
      
      usersList.appendChild(userItem);
    });
    
    document.getElementById('online-users').textContent = onlineCount;
    document.getElementById('total-users').textContent = allUsers.length;
  }

  updateSystemStats() {
    setInterval(() => {
      // Update server time
      const now = new Date();
      document.getElementById('server-time').textContent = now.toLocaleTimeString('vi-VN');
      
      // Calculate total tokens
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const totalTokens = Object.values(users).reduce((sum, user) => sum + (user.tokens || 0), 0);
      document.getElementById('total-tokens').textContent = totalTokens.toLocaleString();
    }, 1000);
  }
}

// Global functions for button clicks
function kickUser(username) {
  if (confirm(`Xóa tài khoản ${username}?\n\nTất cả dữ liệu của user này sẽ bị xóa!`)) {
    // Delete user from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    delete users[username];
    localStorage.setItem('users', JSON.stringify(users));
    
    // If deleting current user, also clear currentUser
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser === username) {
      localStorage.removeItem('currentUser');
    }
    
    // Refresh the list
    location.reload();
    
    alert(`Đã xóa tài khoản ${username}!`);
  }
}

function addTokensToCurrentUser() {
  const amount = parseInt(document.getElementById('token-amount').value);
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (isNaN(amount) || amount < 0) {
    alert('Vui lòng nhập số token hợp lệ!');
    return;
  }
  
  if (currentUser && users[currentUser]) {
    users[currentUser].tokens = (users[currentUser].tokens || 0) + amount;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('userTokens', users[currentUser].tokens.toString());
    
    document.getElementById('current-tokens').textContent = users[currentUser].tokens;
    document.getElementById('token-amount').value = '';
    
    alert(`Đã thêm ${amount} tokens cho ${currentUser}!`);
  } else {
    alert('Không tìm thấy người dùng hiện tại!');
  }
}

function removeTokensFromCurrentUser() {
  const amount = parseInt(document.getElementById('token-amount-remove').value);
  const currentUser = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  
  if (isNaN(amount) || amount < 0) {
    alert('Vui lòng nhập số token hợp lệ!');
    return;
  }
  
  if (currentUser && users[currentUser]) {
    const currentTokens = users[currentUser].tokens || 0;
    if (amount > currentTokens) {
      alert(`Không thể trừ ${amount} tokens! ${currentUser} chỉ có ${currentTokens} tokens.`);
      return;
    }
    
    users[currentUser].tokens = currentTokens - amount;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('userTokens', users[currentUser].tokens.toString());
    
    document.getElementById('current-tokens').textContent = users[currentUser].tokens;
    document.getElementById('token-amount-remove').value = '';
    
    alert(`Đã trừ ${amount} tokens từ ${currentUser}!`);
  } else {
    alert('Không tìm thấy người dùng hiện tại!');
  }
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});
