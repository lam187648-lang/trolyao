// Admin Panel Management System
class AdminPanel {
  constructor() {
    this.activeUsers = new Map();
    this.serverStartTime = Date.now();
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.loadUserData();
    this.startRealTimeUpdates();
    this.updateSystemStats();
  }

  checkAuthentication() {
    // No password required - direct access
    console.log('Admin panel accessed directly');
  }

  loadUserData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser && users[currentUser]) {
      document.getElementById('current-tokens').textContent = users[currentUser].tokens || 0;
    }
    
    this.updateUsersList();
  }

  updateUsersList() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const usersList = document.getElementById('active-users-list');
    
    usersList.innerHTML = '';
    
    Object.keys(users).forEach(username => {
      const user = users[username];
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar-small">${username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name-small">${username}</div>
            <div class="user-status">Tokens: ${user.tokens || 0}</div>
          </div>
        </div>
        <button class="kick-btn" onclick="kickUser('${username}')">Kick</button>
      `;
      
      usersList.appendChild(userItem);
    });
    
    document.getElementById('total-users').textContent = Object.keys(users).length;
  }

  updateSystemStats() {
    setInterval(() => {
      // Update server time
      const now = new Date();
      document.getElementById('server-time').textContent = now.toLocaleTimeString('vi-VN');
      
      // Calculate total tokens
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      const totalTokens = Object.values(users).reduce((sum, user) => sum + (user.tokens || 0), 0);
      document.getElementById('total-tokens').textContent = totalTokens;
      
      // Update online users (simplified - all users in localStorage)
      document.getElementById('online-users').textContent = Object.keys(users).length;
    }, 1000);
  }

  startRealTimeUpdates() {
    setInterval(() => {
      this.updateUsersList();
    }, 5000); // Update every 5 seconds
  }
}

// Global functions for button clicks
function kickUser(username) {
  if (confirm(`Bạn có chắc muốn kick người dùng "${username}"?`)) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username]) {
      // Reset user data
      users[username].tokens = 0;
      users[username].purchasedColors = [];
      users[username].selectedColorTheme = '0';
      
      localStorage.setItem('users', JSON.stringify(users));
      
      // If kicking current user, logout them
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser === username) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return;
      }
      
      alert(`Đã kick người dùng "${username}"! Token và dữ liệu đã được reset.`);
      location.reload();
    }
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
