// Simple Admin Management System
class SimpleAdmin {
  constructor() {
    this.currentUserToBan = null;
    this.init();
  }

  init() {
    // Password modal shown by default, load users after check
    this.currentUserToBan = null;
  }

  checkPassword() {
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('password-error');
    
    if (password !== '093981') {
      errorMsg.style.display = 'block';
      return false;
    }
    
    // Hide password modal and load users
    document.getElementById('password-modal').style.display = 'none';
    this.loadUsers();
    return true;
  }

  loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userList = document.getElementById('user-list');
    
    userList.innerHTML = '';
    
    Object.keys(users).forEach(username => {
      const user = users[username];
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      // Check if user is currently banned
      const banInfo = this.getBanInfo(username);
      const isBanned = banInfo && banInfo.until > Date.now();
      
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name">${username}</div>
            <div class="user-status ${isBanned ? 'banned-status' : ''}">
              ${isBanned ? `🚫 Banned đến ${new Date(banInfo.until).toLocaleTimeString('vi-VN')}` : '🟢 Online'}
            </div>
          </div>
        </div>
        <button class="kick-btn" onclick="showBanModal('${username}')">Kick</button>
      `;
      
      userList.appendChild(userItem);
    });
  }

  getBanInfo(username) {
    const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
    return bans[username];
  }

  banUser(username, durationMinutes) {
    const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
    const until = Date.now() + (durationMinutes * 60 * 1000);
    
    bans[username] = {
      until: until,
      duration: durationMinutes,
      bannedAt: Date.now()
    };
    
    localStorage.setItem('userBans', JSON.stringify(bans));
    
    // If banning current user, logout them
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser === username) {
      localStorage.removeItem('currentUser');
      window.location.href = 'index.html';
    }
    
    this.loadUsers();
  }
}

// Global variable for current user to ban
let currentUserToBan = null;

// Global functions
function showBanModal(username) {
  currentUserToBan = username;
  document.getElementById('ban-username').textContent = `Người dùng: ${username}`;
  document.getElementById('ban-modal').style.display = 'flex';
  document.getElementById('ban-duration').value = '';
  document.getElementById('ban-duration').focus();
}

function closeBanModal() {
  document.getElementById('ban-modal').style.display = 'none';
  currentUserToBan = null;
}

function parseDuration(input) {
  input = input.trim().toLowerCase();
  
  // Hours format: 1g, 2g, ..., 10g (g = giờ)
  if (input.endsWith('g')) {
    const hours = parseInt(input.slice(0, -1));
    if (!isNaN(hours) && hours >= 1 && hours <= 10) {
      return hours * 60; // Convert to minutes
    }
  }
  
  // Minutes format: 1p, 2p, ..., 180p (p = phút)
  if (input.endsWith('p')) {
    const minutes = parseInt(input.slice(0, -1));
    if (!isNaN(minutes) && minutes >= 1 && minutes <= 180) {
      return minutes;
    }
  }
  
  // Legacy: plain number (treat as minutes)
  const minutes = parseInt(input);
  if (!isNaN(minutes) && minutes > 0) {
    return minutes;
  }
  
  return null; // Invalid
}

function formatDuration(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}g ${m}p` : `${h}g`;
  }
  return `${minutes}p`;
}

function confirmBan() {
  const durationInput = document.getElementById('ban-duration').value;
  const durationMinutes = parseDuration(durationInput);
  
  if (!durationMinutes) {
    alert('❌ Định dạng không hợp lệ!\nNhập: 1g-10g (giờ) hoặc 1p-180p (phút)\nVí dụ: 2g, 30p, 1g30p');
    return;
  }
  
  if (currentUserToBan) {
    simpleAdmin.banUser(currentUserToBan, durationMinutes);
    closeBanModal();
    alert(`✅ Đã kick ${currentUserToBan} trong ${formatDuration(durationMinutes)}!`);
  }
}

// Global function for password check
function checkAdminPassword() {
  if (simpleAdmin.checkPassword()) {
    // Success - modal hidden by checkPassword
  }
}

// Initialize
let simpleAdmin;
document.addEventListener('DOMContentLoaded', () => {
  simpleAdmin = new SimpleAdmin();
});
