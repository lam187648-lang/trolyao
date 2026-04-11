// Simple Admin Management System
class SimpleAdmin {
  constructor() {
    this.currentUserToBan = null;
    this.init();
  }

  init() {
    this.checkPassword();
    this.loadUsers();
  }

  checkPassword() {
    const password = prompt('🔐 Nhập mật khẩu admin:');
    if (password !== '093981') {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); font-family: Inter, sans-serif;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h2 style="color: #ef4444; margin-bottom: 16px;">Mật Khẩu Sai!</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Bạn không có quyền truy cập trang này!</p>
            <button onclick="window.location.href='index.html'" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
              Quay lại
            </button>
          </div>
        </div>
      `;
      return;
    }
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

// Global functions
function showBanModal(username) {
  SimpleAdmin.currentUserToBan = username;
  document.getElementById('ban-username').textContent = `Người dùng: ${username}`;
  document.getElementById('ban-modal').style.display = 'flex';
  document.getElementById('ban-duration').value = '';
  document.getElementById('ban-duration').focus();
}

function closeBanModal() {
  document.getElementById('ban-modal').style.display = 'none';
  SimpleAdmin.currentUserToBan = null;
}

function confirmBan() {
  const duration = parseInt(document.getElementById('ban-duration').value);
  
  if (isNaN(duration) || duration < 1) {
    alert('Vui lòng nhập thời gian hợp lệ (tối thiểu 1 phút)!');
    return;
  }
  
  if (SimpleAdmin.currentUserToBan) {
    SimpleAdmin.banUser(SimpleAdmin.currentUserToBan, duration);
    closeBanModal();
    alert(`Đã kick ${SimpleAdmin.currentUserToBan} trong ${duration} phút!`);
  }
}

// Initialize
let simpleAdmin;
document.addEventListener('DOMContentLoaded', () => {
  simpleAdmin = new SimpleAdmin();
});
