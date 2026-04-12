const socket = io("http://localhost:4000");

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
    
    socket.on("users", (users) => {
      this.renderUsers(users);
    });
    
    socket.on("kicked", (username) => {
      const currentUser = localStorage.getItem('currentUser');

      if (currentUser === username) {
        alert("Bạn đã bị admin kick!");
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
      }
    });
    
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

  updateUsersList(usersFromServer) {
    const usersList = document.getElementById('active-users-list');
    usersList.innerHTML = '';

    usersFromServer.forEach(user => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';

      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name-small">${user.username}</div>
            <div class="user-status">Online</div>
          </div>
        </div>
        <button class="kick-btn" onclick="kickUser('${user.username}')">Kick</button>
      `;

      usersList.appendChild(userItem);
    });

    document.getElementById('online-users').textContent = usersFromServer.length;
  }

  renderUsers(users) {
    const list = document.getElementById("active-users-list");
    list.innerHTML = "";

    users.forEach(u => {
      list.innerHTML += `
        <div>
          ${u.username}
            <button onclick="kickUser('${u.username}')">Kick</button>
          </div>
        `;
    });
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
}

// Global functions for button clicks
function kickUser(username) {
  if (confirm(`Kick ${username}?`)) {
    socket.emit("kick", username);
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
