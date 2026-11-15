// Enhanced Token Shop Management System with proper text colors
class TokenShop {
  constructor() {
    this.colors = [
      // Basic colors - light backgrounds with dark text
      { id: 1, name: "Xanh dáng", price: 100, primary: "#3B82F6", secondary: "#1E40AF", bg: "#EFF6FF", textColor: "#1E3A8A", tier: "basic" },
      { id: 2, name: "Xanh lá", price: 150, primary: "#10B981", secondary: "#047857", bg: "#F0FDF4", textColor: "#064E3B", tier: "basic" },
      { id: 3, name: "Tím", price: 200, primary: "#8B5CF6", secondary: "#6D28D9", bg: "#F5F3FF", textColor: "#581C87", tier: "premium" },
      { id: 4, name: "Háng", price: 250, primary: "#EC4899", secondary: "#BE185D", bg: "#FDF2F8", textColor: "#831843", tier: "premium" },
      { id: 5, name: "Vàng", price: 300, primary: "#F59E0B", secondary: "#D97706", bg: "#FFFBEB", textColor: "#78350F", tier: "premium" },
      { id: 6, name: "Cam", price: 350, primary: "#F97316", secondary: "#EA580C", bg: "#FFF7ED", textColor: "#7C2D12", tier: "premium" },
      { id: 7, name: "Dö", price: 400, primary: "#EF4444", secondary: "#DC2626", bg: "#FEF2F2", textColor: "#7F1D1D", tier: "premium" },
      { id: 8, name: "Xám", price: 180, primary: "#6B7280", secondary: "#4B5563", bg: "#F9FAFB", textColor: "#374151", tier: "basic" },
      { id: 9, name: "Xanh ngoc", price: 220, primary: "#14B8A6", secondary: "#0F766E", bg: "#F0FDFA", textColor: "#134E4A", tier: "premium" },
      { id: 10, name: "Xanh xanh", price: 160, primary: "#6366F1", secondary: "#4F46E5", bg: "#EEF2FF", textColor: "#312E81", tier: "basic" },
      { id: 11, name: "Xám dö", price: 280, primary: "#A855F7", secondary: "#9333EA", bg: "#FAF5FF", textColor: "#581C87", tier: "premium" },
      { id: 12, name: "Xám háng", price: 320, primary: "#F472B6", secondary: "#EC4899", bg: "#FDF4FF", textColor: "#831843", tier: "premium" },
      { id: 13, name: "Náu", price: 190, primary: "#92400E", secondary: "#78350F", bg: "#FEF3C7", textColor: "#451A03", tier: "basic" },
      { id: 14, name: "Xanh dam", price: 240, primary: "#1E40AF", secondary: "#1E3A8A", bg: "#DBEAFE", textColor: "#1E3A8A", tier: "premium" },
      { id: 15, name: "Xám dam", price: 170, primary: "#374151", secondary: "#111827", bg: "#F3F4F6", textColor: "#111827", tier: "basic" },
      { id: 16, name: "Xám nhát", price: 140, primary: "#D1D5DB", secondary: "#9CA3AF", bg: "#F9FAFB", textColor: "#6B7280", tier: "basic" },
      // Dark themes with white text
      { id: 21, name: "Nền đen", price: 450, primary: "#1F2937", secondary: "#111827", bg: "#111827", textColor: "#FFFFFF", tier: "premium" },
      { id: 22, name: "Nền xanh đậm", price: 550, primary: "#1E3A8A", secondary: "#1E40AF", bg: "#1E3A8A", textColor: "#FFFFFF", tier: "luxury" },
      { id: 23, name: "Nền tím đậm", price: 650, primary: "#581C87", secondary: "#6B21A8", bg: "#581C87", textColor: "#FFFFFF", tier: "luxury" },
      { id: 24, name: "Nền đỏ đậm", price: 750, primary: "#7F1D1D", secondary: "#991B1B", bg: "#7F1D1D", textColor: "#FFFFFF", tier: "luxury" },
      // EXCLUSIVE colors from app.js - FREE but must be unlocked here first (syncs with app.js)
      { id: 17, name: "Vàng Kim", price: 0, primary: "#FFD700", secondary: "#B8860B", bg: "#FFFAF0", textColor: "#78350F", tier: "exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-gold", description: "Miễn phí nhưng cần mở khóa" },
      { id: 18, name: "Bạc", price: 0, primary: "#C0C0C0", secondary: "#808080", bg: "#F5F5F5", textColor: "#374151", tier: "exclusive", unlockRequired: true, icon: "🥈", cssClass: "theme-silver", description: "Miễn phí nhưng cần mở khóa" },
      { id: 19, name: "Đồng", price: 0, primary: "#CD7F32", secondary: "#8B4513", bg: "#FFF8DC", textColor: "#451A03", tier: "exclusive", unlockRequired: true, icon: "🥉", cssClass: "theme-bronze", description: "Miễn phí nhưng cần mở khóa" },
      { id: 20, name: "Cầu Vồng", price: 0, primary: "#FF6B6B", secondary: "#4ECDC4", bg: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)", textColor: "#581C87", tier: "exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow", description: "Miễn phí nhưng cần mở khóa" },
      // Premium EXCLUSIVE colors - only available in Token Shop (expensive) - must unlock first
      { id: 25, name: "Holographic", price: 1000, primary: "#FF00FF", secondary: "#00FFFF", bg: "linear-gradient(45deg, #FF00FF, #00FFFF, #FF00FF)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "✨", cssClass: "theme-holographic" },
      { id: 26, name: "Rainbow", price: 1200, primary: "#FF0000", secondary: "#9400D3", bg: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow-premium" },
      { id: 27, name: "Galaxy", price: 1500, primary: "#4B0082", secondary: "#000000", bg: "radial-gradient(ellipse at center, #4B0082, #000000, #191970)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌌", cssClass: "theme-galaxy" },
      { id: 28, name: "Aurora", price: 1300, primary: "#39FF14", secondary: "#FF1493", bg: "linear-gradient(135deg, #39FF14, #00CED1, #FF1493)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌠", cssClass: "theme-aurora" },
      { id: 29, name: "Phoenix", price: 1400, primary: "#FF4500", secondary: "#FFD700", bg: "linear-gradient(180deg, #FF4500, #FF6347, #FFD700)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🔥", cssClass: "theme-phoenix" },
      { id: 30, name: "Cyberpunk", price: 1100, primary: "#FFFF00", secondary: "#FF00FF", bg: "linear-gradient(135deg, #000000, #FFFF00, #FF00FF)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "⚡", cssClass: "theme-cyberpunk" },
      // New beautiful expensive premium colors
      { id: 31, name: "💎 Diamond", price: 2500, primary: "#00CED1", secondary: "#B0E0E6", bg: "linear-gradient(135deg, #E0F7FA, #00CED1, #FFFFFF)", textColor: "#006064", tier: "premium-exclusive", unlockRequired: true, icon: "💎", cssClass: "theme-diamond" },
      { id: 32, name: "🔮 Royal Amethyst", price: 2200, primary: "#9966CC", secondary: "#663399", bg: "linear-gradient(145deg, #E6E6FA, #9966CC, #4B0082)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🔮", cssClass: "theme-amethyst" },
      { id: 33, name: "🌅 Sunset Gold", price: 2800, primary: "#FF8C00", secondary: "#FF6347", bg: "linear-gradient(180deg, #FFD700, #FF8C00, #FF6347)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌅", cssClass: "theme-sunset" },
      { id: 34, name: "🧊 Frozen Ice", price: 2000, primary: "#00FFFF", secondary: "#E0FFFF", bg: "linear-gradient(135deg, #E0FFFF, #00FFFF, #87CEEB)", textColor: "#006064", tier: "premium-exclusive", unlockRequired: true, icon: "🧊", cssClass: "theme-ice" },
      { id: 35, name: "🌊 Ocean Deep", price: 2400, primary: "#006994", secondary: "#003366", bg: "linear-gradient(180deg, #00CED1, #006994, #003366)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌊", cssClass: "theme-ocean" },
      { id: 36, name: "🔥 Magma", price: 3000, primary: "#FF4500", secondary: "#8B0000", bg: "linear-gradient(180deg, #FFD700, #FF4500, #8B0000)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌋", cssClass: "theme-magma" },
      { id: 37, name: "🌸 Sakura", price: 1900, primary: "#FFB7C5", secondary: "#FF69B4", bg: "linear-gradient(135deg, #FFF0F5, #FFB7C5, #FF69B4)", textColor: "#880E4F", tier: "premium-exclusive", unlockRequired: true, icon: "🌸", cssClass: "theme-sakura" },
      { id: 38, name: "🌲 Emerald Forest", price: 2300, primary: "#50C878", secondary: "#228B22", bg: "linear-gradient(145deg, #98FB98, #50C878, #228B22)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌲", cssClass: "theme-emerald" },
      { id: 39, name: "⭐ Starlight", price: 3500, primary: "#FFD700", secondary: "#C0C0C0", bg: "radial-gradient(ellipse at center, #1a1a2e, #16213e, #0f3460)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "⭐", cssClass: "theme-starlight" },
      { id: 40, name: "🌙 Midnight", price: 2700, primary: "#191970", secondary: "#000080", bg: "linear-gradient(180deg, #2C3E50, #191970, #000000)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌙", cssClass: "theme-midnight" },
      { id: 41, name: "⚜️ Golden Royal", price: 5000, primary: "#D4AF37", secondary: "#B8860B", bg: "linear-gradient(145deg, #FFF8DC, #D4AF37, #B8860B)", textColor: "#5D4037", tier: "premium-exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-royal" },
      { id: 42, name: "🌈 Prism", price: 4500, primary: "#FF1493", secondary: "#00BFFF", bg: "conic-gradient(from 0deg, #FF1493, #FFD700, #00FF00, #00BFFF, #FF1493)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "💫", cssClass: "theme-prism" }
    ];
    this.init();
  }

  init() {
    if (!this.checkAuth()) return;
    this.loadUserData();
    this.renderColors();
    this.updateTokenDisplay();
  }

  checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!currentUser || !users[currentUser]) {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); font-family: Inter, sans-serif;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #1e40af; margin-bottom: 16px;">Yêu Cầu Đăng Nhập</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Bạn phải đăng nhập để truy cập Cửa Hàng Token!</p>
            <button onclick="window.location.href='index.html'" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
              Đăng Nhập Ngay
            </button>
          </div>
        </div>
      `;
      return false;
    }
    return true;
  }

  loadUserData() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      this.currentTokens = users[currentUser].tokens || 0;
      this.purchasedColors = users[currentUser].purchasedColors || [];
      this.selectedTheme = users[currentUser].selectedColorTheme || '0';
    } else {
      this.currentTokens = 0;
      this.purchasedColors = [];
      this.selectedTheme = '0';
    }
  }

  renderColors() {
    const colorGrid = document.getElementById('color-grid');
    colorGrid.innerHTML = '';
    
    this.colors.forEach(color => {
      const colorItem = document.createElement('div');
      colorItem.className = 'color-item';
      
      const isPurchased = this.purchasedColors.includes(color.id);
      const canAfford = this.currentTokens >= color.price;
      
      if (isPurchased) {
        colorItem.classList.add('purchased');
      }
      
      if (!isPurchased && !canAfford) {
        colorItem.classList.add('locked');
      }
      
      // Determine display based on color type
      let actionDisplay;
      if (isPurchased) {
        actionDisplay = `<div class="color-owned">✅ Đã sở hữu</div>
             <button class="gift-btn" data-color-id="${color.id}" onclick="event.stopPropagation(); tokenShop.giftColor(${color.id})">🎁 Tặng</button>`;
      } else if (color.unlockRequired) {
        actionDisplay = `<div class="color-price unlock-free">🔓 Nhấn để mở khóa miễn phí</div>`;
      } else if (color.price === 0) {
        actionDisplay = `<div class="color-price free">🆓 Miễn phí</div>`;
      } else {
        actionDisplay = `<div class="color-price">${color.price} tokens</div>`;
      }
      
      // Add icon for exclusive colors only
      const iconDisplay = color.icon ? `<div class="color-icon">${color.icon}</div>` : '';
      
      colorItem.innerHTML = `
        <div class="color-preview ${color.cssClass || ''}" style="background: linear-gradient(135deg, ${color.primary}, ${color.secondary});">
          ${iconDisplay}
        </div>
        <div class="color-name">${color.name}</div>
        ${actionDisplay}
        ${!isPurchased && !canAfford && !color.unlockRequired ? '<div class="lock-icon">🔒</div>' : ''}
        ${color.exclusive || color.unlockRequired ? '<div class="exclusive-badge">⭐ Đặc biệt</div>' : ''}
      `;
      
      colorItem.addEventListener('click', () => this.selectColor(color));
      colorGrid.appendChild(colorItem);
    });
  }

  selectColor(color) {
    const isPurchased = this.purchasedColors.includes(color.id);
    
    if (!isPurchased) {
      // Handle unlockRequired colors (free but need to unlock first)
      if (color.unlockRequired) {
        if (confirm(`🔓 Mở khóa màu "${color.name}" miễn phí?

Màu này sẽ được thêm vào bộ sưu tập của bạn và có thể sử dụng trong phần Thay Màu Nền ở trang chính.`)) {
          this.purchaseColor(color);
        }
        return;
      }
      
      // Regular purchase check
      if (this.currentTokens < color.price) {
        this.showMessage(`❌ Bạn cần ${color.price} tokens để mua màu này! Hiện tại bạn có ${this.currentTokens} tokens.`, 'error');
        return;
      }
      
      if (confirm(`Mua màu "${color.name}" với ${color.price} tokens?`)) {
        this.purchaseColor(color);
      }
    } else {
      this.applyColor(color);
    }
  }

  purchaseColor(color) {
    this.currentTokens -= color.price;
    this.purchasedColors.push(color.id);
    
    this.updateUserData();
    this.renderColors();
    this.updateTokenDisplay();
    
    this.showMessage(`✅ Đã mua màu "${color.name}"!`, 'success');
  }

  giftColor(colorId) {
    const color = this.colors.find(c => c.id === colorId);
    if (!color) return;

    // Check if user owns this color
    if (!this.purchasedColors.includes(colorId)) {
      this.showMessage('❌ Bạn cần sở hữu màu này trước khi tặng!', 'error');
      return;
    }

    // Prompt for recipient username
    const recipient = prompt(`🎁 Tặng màu "${color.name}" cho ai?\nNhập tên người dùng:`);
    if (!recipient) return;

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Check if recipient exists
    if (!users[recipient]) {
      this.showMessage(`❌ Người dùng "${recipient}" không tồn tại!`, 'error');
      return;
    }

    // Check if recipient already has this color
    if (!users[recipient].purchasedColors) {
      users[recipient].purchasedColors = [];
    }
    
    if (users[recipient].purchasedColors.includes(colorId)) {
      this.showMessage(`❌ ${recipient} đã có màu này rồi!`, 'error');
      return;
    }

    // Gift the color
    users[recipient].purchasedColors.push(colorId);
    localStorage.setItem('users', JSON.stringify(users));
    
    this.showMessage(`✅ Đã tặng màu "${color.name}" cho ${recipient}!`, 'success');
    
    // Log for debugging
    console.log(`Gift: ${color.name} from ${localStorage.getItem('currentUser')} to ${recipient}`);
  }

  applyColor(color) {
    this.selectedTheme = color.id.toString();
    this.updateUserData();
    this.renderColors();
    
    // Apply color to page with proper text color
    document.documentElement.style.setProperty('--primary', color.primary);
    document.documentElement.style.setProperty('--primary-hover', color.secondary);
    document.documentElement.style.setProperty('--primary-light', color.bg);
    document.documentElement.style.setProperty('--text-primary', color.textColor);
    document.body.style.background = `linear-gradient(145deg, ${color.bg} 0%, ${color.primary}15 50%, ${color.bg} 100%)`;
    
    // Update all text colors to match theme
    this.updateAllTextColors(color.textColor);
    
    this.showMessage(`✅ Đã áp dụng màu "${color.name}"!`, 'success');
  }

  updateAllTextColors(textColor) {
    // Update text colors throughout the page
    const elementsToUpdate = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'div', 'button', 'input',
      '.section-title', '.color-name', '.token-amount'
    ];
    
    elementsToUpdate.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!el.style.color || el.style.color === '') {
          el.style.color = textColor;
        }
      });
    });
  }

  updateUserData() {
    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (currentUser && users[currentUser]) {
      users[currentUser].tokens = this.currentTokens;
      users[currentUser].purchasedColors = this.purchasedColors;
      users[currentUser].selectedColorTheme = this.selectedTheme;
      
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('userTokens', this.currentTokens.toString());
      
      // Sync with global keys for cross-page compatibility
      localStorage.setItem('purchasedColors', JSON.stringify(this.purchasedColors));
      localStorage.setItem('selectedColorTheme', this.selectedTheme);
    }
  }

  updateTokenDisplay() {
    const tokenElement = document.getElementById('current-tokens');
    if (tokenElement) {
      tokenElement.textContent = this.currentTokens.toLocaleString();
    }
  }

  addTokens() {
    const amount = parseInt(document.getElementById('token-amount').value);
    
    if (isNaN(amount) || amount < 0) {
      this.showMessage('❌ Vui lòng nhập số token hợp lệ!', 'error');
      return;
    }
    
    if (amount > 1000000) {
      this.showMessage('⚠️ Số token quá lớn! Vui lòng nhập số nhỏ hơn.', 'warning');
      return;
    }
    
    this.currentTokens += amount;
    this.updateUserData();
    this.updateTokenDisplay();
    this.renderColors();
    
    document.getElementById('token-amount').value = '';
    this.showMessage(`✅ Đã nạp ${amount.toLocaleString()} tokens! Tổng: ${this.currentTokens.toLocaleString()} tokens`, 'success');
  }

  showMessage(message, type = 'info') {
    const container = document.getElementById('token-message');
    if (!container) return; // Exit if element not found
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
      if (container) container.innerHTML = '';
    }, 5000);
  }

  showAdminPanel() {
    const password = prompt('🔐 Nhập mật khẩu Admin:');
    if (password !== '093981') {
      alert('❌ Mật khẩu không đúng!');
      return;
    }
    
    // Show admin stats
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const userCount = Object.keys(users).length;
    const currentUser = localStorage.getItem('currentUser');
    
    let adminHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center; font-family: Inter, sans-serif;">
        <div style="background: white; padding: 30px; border-radius: 16px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h2 style="color: #6366f1; margin-bottom: 20px;">🔐 Admin Panel</h2>
          <p><strong>Tổng users:</strong> ${userCount}</p>
          <p><strong>User hiện tại:</strong> ${currentUser}</p>
          <hr style="margin: 20px 0;">
          <h3>Quản lý người dùng:</h3>
          <div style="margin-top: 15px;">
    `;
    
    Object.entries(users).forEach(([username, data]) => {
      adminHTML += `
        <div style="padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <span>${username} (${data.tokens || 0} tokens)</span>
          <button onclick="tokenShop.giveTokens('${username}')" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">+💰</button>
        </div>
      `;
    });
    
    adminHTML += `
          </div>
          <button onclick="this.closest('.admin-modal').remove()" style="margin-top: 20px; width: 100%; background: #ef4444; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">Đóng</button>
        </div>
      </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = adminHTML;
    document.body.appendChild(modal);
  }

  giveTokens(username) {
    const amount = parseInt(prompt(`Nhập số tokens muốn cộng cho ${username}:`));
    if (!amount || amount <= 0) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
      users[username].tokens = (users[username].tokens || 0) + amount;
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update current user display if it's them
      if (username === localStorage.getItem('currentUser')) {
        this.currentTokens = users[username].tokens;
        this.updateTokenDisplay();
      }
      
      alert(`✅ Đã cộng ${amount} tokens cho ${username}!`);
      this.showAdminPanel(); // Refresh
    }
  }
}

// Global function
function addTokens() {
  tokenShop.addTokens();
}

// Initialize
let tokenShop;
document.addEventListener('DOMContentLoaded', () => {
  tokenShop = new TokenShop();
});
