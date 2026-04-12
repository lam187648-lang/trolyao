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
    
    if (!userList) return; // Exit if element not found
    
    userList.innerHTML = '';
    
    const usernames = Object.keys(users);
    
    // Show empty state if no users
    if (usernames.length === 0) {
      userList.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
          <p>Chưa có tài khoản nào!</p>
          <p style="font-size: 14px; margin-top: 8px;">Người dùng cần đăng ký tại trang chủ.</p>
        </div>
      `;
      return;
    }
    
    usernames.forEach(username => {
      const user = users[username];
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      // Check if user is currently banned
      const banInfo = this.getBanInfo(username);
      const isBanned = banInfo && banInfo.until > Date.now();
      
      // Format last login time
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập';
      
      userItem.innerHTML = `
        <div class="user-info">
          <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name">${username}</div>
            <div class="user-status ${isBanned ? 'banned-status' : ''}">
              ${isBanned ? `🚫 Banned đến ${new Date(banInfo.until).toLocaleTimeString('vi-VN')}` : '🟢 Hoạt động'}
            </div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
              💎 ${user.tokens || 0} tokens | Đăng nhập: ${lastLogin}
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="kick-btn" onclick="showBanModal('${username}')">Kick</button>
          <button class="kick-btn" style="background: #dc2626;" onclick="showDeleteModal('${username}')">🗑️ Xóa</button>
        </div>
      `;
      
      userList.appendChild(userItem);
    });
    
    console.log(`📋 Loaded ${usernames.length} users:`, usernames);
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

// Global variable for current user to ban/delete
let currentUserToBan = null;
let currentUserToDelete = null;

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
  
  // Combined format: 1g30p, 2g15p, etc. (hours + minutes)
  const combinedMatch = input.match(/^(\d+)g(\d+)p$/);
  if (combinedMatch) {
    const hours = parseInt(combinedMatch[1]);
    const minutes = parseInt(combinedMatch[2]);
    if (hours >= 1 && hours <= 10 && minutes >= 0 && minutes <= 59) {
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes <= 600 ? totalMinutes : null; // Max 10h
    }
  }
  
  // Hours format: 1g, 2g, ..., 10g (g = giờ)
  if (input.endsWith('g') && !input.includes('p')) {
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
  if (!isNaN(minutes) && minutes > 0 && minutes <= 600) {
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
    alert('❌ Định dạng không hợp lệ!\nNhập: 1g-10g (giờ), 1p-180p (phút), hoặc 1g30p\nVí dụ: 2g, 30p, 1g30p, 5g');
    return;
  }
  
  if (currentUserToBan) {
    simpleAdmin.banUser(currentUserToBan, durationMinutes);
    closeBanModal();
    alert(`✅ Đã kick ${currentUserToBan} trong ${formatDuration(durationMinutes)}!`);
  }
}

// Delete user data functions
function showDeleteModal(username) {
  currentUserToDelete = username;
  document.getElementById('delete-username').textContent = username;
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
  currentUserToDelete = null;
}

function confirmDelete() {
  if (!currentUserToDelete) return;
  
  const username = currentUserToDelete;
  const password = document.getElementById('delete-password').value;
  
  // Verify admin password
  if (password !== '093981') {
    alert('❌ Mật khẩu admin không đúng!');
    return;
  }
  
  // Confirm again
  if (!confirm(`⚠️ Bạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu của "${username}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!\n\nDữ liệu bị xóa:\n- Tài khoản\n- Tokens\n- Màu đã mua\n- Lịch sử`)) {
    return;
  }
  
  // Delete user data
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  delete users[username];
  localStorage.setItem('users', JSON.stringify(users));
  
  // Delete ban info if exists
  const bans = JSON.parse(localStorage.getItem('userBans') || '{}');
  delete bans[username];
  localStorage.setItem('userBans', JSON.stringify(bans));
  
  // Delete garden history if exists
  const gardenHistory = JSON.parse(localStorage.getItem('gardenHistory') || '{}');
  delete gardenHistory[username];
  localStorage.setItem('gardenHistory', JSON.stringify(gardenHistory));
  
  // If deleting current user, logout
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser === username) {
    localStorage.removeItem('currentUser');
  }
  
  closeDeleteModal();
  simpleAdmin.loadUsers();
  alert(`✅ Đã xóa toàn bộ dữ liệu của "${username}"!`);
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
