// Token Page Management
class TokenPage {
  constructor() {
    this.init();
  }

  init() {
    this.checkPassword();
    this.loadCurrentTokens();
    this.setupEventListeners();
  }

  checkPassword() {
    const password = prompt('🔐 Nhập mật khẩu:');
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

  loadCurrentTokens() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      document.getElementById('current-amount').textContent = users[currentUser].tokens || 0;
    }
  }

  setupEventListeners() {
    const tokenInput = document.getElementById('token-amount');
    
    tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTokens();
      }
    });
  }

  addTokens() {
    const amount = parseInt(document.getElementById('token-amount').value);
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (isNaN(amount) || amount < 0) {
      this.showMessage('❌ Vui lòng nhập số token hợp lệ!', 'error');
      return;
    }
    
    if (amount > 1000000) {
      this.showMessage('⚠️ Số token quá lớn! Vui lòng nhập số nhỏ hơn.', 'warning');
      return;
    }
    
    if (currentUser && users[currentUser]) {
      users[currentUser].tokens = (users[currentUser].tokens || 0) + amount;
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('userTokens', users[currentUser].tokens.toString());
      
      document.getElementById('current-amount').textContent = users[currentUser].tokens;
      document.getElementById('token-amount').value = '';
      
      this.showMessage(`✅ Đã thêm ${amount.toLocaleString()} tokens! Tổng: ${users[currentUser].tokens.toLocaleString()} tokens`, 'success');
    } else {
      this.showMessage('❌ Không tìm thấy người dùng hiện tại!', 'error');
    }
  }

  showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="success-message">${message}</div>`;
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }
}

// Global function
function addTokens() {
  tokenPage.addTokens();
}

// Initialize
let tokenPage;
document.addEventListener('DOMContentLoaded', () => {
  tokenPage = new TokenPage();
});
