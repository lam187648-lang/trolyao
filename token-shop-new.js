// Enhanced Token Shop Management System with proper text colors
class TokenShop {
  constructor() {
    this.serverAccount = false;
    this.colors = [
      // Basic colors - light backgrounds with dark text
      { id: 1, name: "Xanh dương", price: 0, primary: "#3B82F6", secondary: "#1E40AF", bg: "#EFF6FF", textColor: "#1E3A8A", tier: "basic" },
      { id: 2, name: "Xanh lá", price: 0, primary: "#10B981", secondary: "#047857", bg: "#F0FDF4", textColor: "#064E3B", tier: "basic" },
      { id: 3, name: "Tím", price: 0, primary: "#8B5CF6", secondary: "#6D28D9", bg: "#F5F3FF", textColor: "#581C87", tier: "premium" },
      { id: 4, name: "Hồng", price: 0, primary: "#EC4899", secondary: "#BE185D", bg: "#FDF2F8", textColor: "#831843", tier: "premium" },
      { id: 5, name: "Vàng", price: 0, primary: "#F59E0B", secondary: "#D97706", bg: "#FFFBEB", textColor: "#78350F", tier: "premium" },
      { id: 6, name: "Cam", price: 0, primary: "#F97316", secondary: "#EA580C", bg: "#FFF7ED", textColor: "#7C2D12", tier: "premium" },
      { id: 7, name: "Đỏ", price: 0, primary: "#EF4444", secondary: "#DC2626", bg: "#FEF2F2", textColor: "#7F1D1D", tier: "premium" },
      { id: 8, name: "Xám", price: 0, primary: "#6B7280", secondary: "#4B5563", bg: "#F9FAFB", textColor: "#374151", tier: "basic" },
      { id: 9, name: "Xanh ngọc", price: 0, primary: "#14B8A6", secondary: "#0F766E", bg: "#F0FDFA", textColor: "#134E4A", tier: "premium" },
      { id: 10, name: "Xám xanh", price: 0, primary: "#6366F1", secondary: "#4F46E5", bg: "#EEF2FF", textColor: "#312E81", tier: "basic" },
      { id: 11, name: "Xám đỏ", price: 0, primary: "#A855F7", secondary: "#9333EA", bg: "#FAF5FF", textColor: "#581C87", tier: "premium" },
      { id: 12, name: "Xám hồng", price: 0, primary: "#F472B6", secondary: "#EC4899", bg: "#FDF4FF", textColor: "#831843", tier: "premium" },
      { id: 13, name: "Nâu", price: 0, primary: "#92400E", secondary: "#78350F", bg: "#FEF3C7", textColor: "#451A03", tier: "basic" },
      { id: 14, name: "Xanh đậm", price: 50, primary: "#1E40AF", secondary: "#1E3A8A", bg: "#DBEAFE", textColor: "#1E3A8A", tier: "premium" },
      { id: 15, name: "Xám đậm", price: 50, primary: "#374151", secondary: "#111827", bg: "#F3F4F6", textColor: "#111827", tier: "basic" },
      { id: 16, name: "Xám nhạt", price: 0, primary: "#D1D5DB", secondary: "#9CA3AF", bg: "#F9FAFB", textColor: "#6B7280", tier: "basic" },
      // Dark themes with white text
      { id: 21, name: "Nền đen", price: 450, primary: "#1F2937", secondary: "#111827", bg: "#111827", textColor: "#FFFFFF", tier: "premium" },
      { id: 22, name: "Nền xanh đậm", price: 550, primary: "#1E3A8A", secondary: "#1E40AF", bg: "#1E3A8A", textColor: "#FFFFFF", tier: "luxury" },
      { id: 23, name: "Nền tím đậm", price: 650, primary: "#581C87", secondary: "#6B21A8", bg: "#581C87", textColor: "#FFFFFF", tier: "luxury" },
      { id: 24, name: "Nền đỏ đậm", price: 750, primary: "#7F1D1D", secondary: "#991B1B", bg: "#7F1D1D", textColor: "#FFFFFF", tier: "luxury" },
      // EXCLUSIVE colors from app.js - FREE but must be unlocked here first (syncs with app.js)
      { id: 17, name: "Vàng Kim", price: 200, primary: "#FFD700", secondary: "#B8860B", bg: "#FFFAF0", textColor: "#78350F", tier: "exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-gold", description: "Miễn phí nhưng cần mở khóa" },
      { id: 18, name: "Bạc", price: 150, primary: "#C0C0C0", secondary: "#808080", bg: "#F5F5F5", textColor: "#374151", tier: "exclusive", unlockRequired: true, icon: "🥈", cssClass: "theme-silver", description: "Miễn phí nhưng cần mở khóa" },
      { id: 19, name: "Đồng", price: 100, primary: "#CD7F32", secondary: "#8B4513", bg: "#FFF8DC", textColor: "#451A03", tier: "exclusive", unlockRequired: true, icon: "🥉", cssClass: "theme-bronze", description: "Miễn phí nhưng cần mở khóa" },
      { id: 20, name: "Cầu Vồng", price: 300, primary: "#FF6B6B", secondary: "#4ECDC4", bg: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)", textColor: "#581C87", tier: "exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow", description: "Miễn phí nhưng cần mở khóa" },
      // Premium EXCLUSIVE colors - only available in Token Shop (expensive) - must unlock first
      { id: 25, name: "Holographic", price: 1000, primary: "#FF00FF", secondary: "#00FFFF", bg: "linear-gradient(45deg, #FF00FF, #00FFFF, #FF00FF)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "✨", cssClass: "theme-holographic" },
      { id: 26, name: "Rainbow", price: 1200, primary: "#FF0000", secondary: "#9400D3", bg: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌈", cssClass: "theme-rainbow-premium" },
      { id: 27, name: "Galaxy", price: 1500, primary: "#4B0082", secondary: "#000000", bg: "radial-gradient(ellipse at center, #4B0082, #000000, #191970)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌌", cssClass: "theme-galaxy" },
      { id: 28, name: "Aurora", price: 1400, primary: "#39FF14", secondary: "#FF1493", bg: "linear-gradient(135deg, #39FF14, #00CED1, #FF1493)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌠", cssClass: "theme-aurora" },
      { id: 29, name: "Phoenix", price: 1300, primary: "#FF4500", secondary: "#FFD700", bg: "linear-gradient(180deg, #FF4500, #FF6347, #FFD700)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🔥", cssClass: "theme-phoenix" },
      { id: 30, name: "Cyberpunk", price: 1100, primary: "#FFFF00", secondary: "#FF00FF", bg: "linear-gradient(135deg, #000000, #FFFF00, #FF00FF)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "⚡", cssClass: "theme-cyberpunk" },
      // New beautiful expensive premium colors
      { id: 31, name: "💎 Diamond", price: 2000, primary: "#00CED1", secondary: "#B0E0E6", bg: "linear-gradient(135deg, #E0F7FA, #00CED1, #FFFFFF)", textColor: "#006064", tier: "premium-exclusive", unlockRequired: true, icon: "💎", cssClass: "theme-diamond" },
      { id: 32, name: "🔮 Royal Amethyst", price: 1800, primary: "#9966CC", secondary: "#663399", bg: "linear-gradient(145deg, #E6E6FA, #9966CC, #4B0082)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🔮", cssClass: "theme-amethyst" },
      { id: 33, name: "🌅 Sunset Gold", price: 1600, primary: "#FF8C00", secondary: "#FF6347", bg: "linear-gradient(180deg, #FFD700, #FF8C00, #FF6347)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌅", cssClass: "theme-sunset" },
      { id: 34, name: "🧊 Frozen Ice", price: 1700, primary: "#00FFFF", secondary: "#E0FFFF", bg: "linear-gradient(135deg, #E0FFFF, #00FFFF, #87CEEB)", textColor: "#006064", tier: "premium-exclusive", unlockRequired: true, icon: "🧊", cssClass: "theme-ice" },
      { id: 35, name: "🌊 Ocean Deep", price: 1900, primary: "#006994", secondary: "#003366", bg: "linear-gradient(180deg, #00CED1, #006994, #003366)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌊", cssClass: "theme-ocean" },
      { id: 36, name: "🔥 Magma", price: 1750, primary: "#FF4500", secondary: "#8B0000", bg: "linear-gradient(180deg, #FFD700, #FF4500, #8B0000)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌋", cssClass: "theme-magma" },
      { id: 37, name: "🌸 Sakura", price: 1650, primary: "#FFB7C5", secondary: "#FF69B4", bg: "linear-gradient(135deg, #FFF0F5, #FFB7C5, #FF69B4)", textColor: "#880E4F", tier: "premium-exclusive", unlockRequired: true, icon: "🌸", cssClass: "theme-sakura" },
      { id: 38, name: "🌲 Emerald Forest", price: 1550, primary: "#50C878", secondary: "#228B22", bg: "linear-gradient(145deg, #98FB98, #50C878, #228B22)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌲", cssClass: "theme-emerald" },
      { id: 39, name: "⭐ Starlight", price: 1850, primary: "#FFD700", secondary: "#C0C0C0", bg: "radial-gradient(ellipse at center, #1a1a2e, #16213e, #0f3460)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "⭐", cssClass: "theme-starlight" },
      { id: 40, name: "🌙 Midnight", price: 1950, primary: "#191970", secondary: "#000080", bg: "linear-gradient(180deg, #2C3E50, #191970, #000000)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "🌙", cssClass: "theme-midnight" },
      { id: 41, name: "⚜️ Golden Royal", price: 2500, primary: "#D4AF37", secondary: "#B8860B", bg: "linear-gradient(145deg, #FFF8DC, #D4AF37, #B8860B)", textColor: "#5D4037", tier: "premium-exclusive", unlockRequired: true, icon: "👑", cssClass: "theme-royal" },
      { id: 42, name: "🌈 Prism", price: 3000, primary: "#FF1493", secondary: "#00BFFF", bg: "conic-gradient(from 0deg, #FF1493, #FFD700, #00FF00, #00BFFF, #FF1493)", textColor: "#FFFFFF", tier: "premium-exclusive", unlockRequired: true, icon: "💫", cssClass: "theme-prism" }
    ];
    this.init();
  }

  async init() {
    if (!(await this.checkAuth())) return;
    this.serverAccount = window.AuthApi.hasSession();
    this.loadUserData();
    this.renderColors();
    this.updateTokenDisplay();
  }

  async checkAuth() {
    try {
      const { databaseConfigured } = await window.AuthApi.databaseStatus();
      if (databaseConfigured) {
        const user = await window.AuthApi.restoreSession();
        if (user) return true;
        this.showSignInRequired();
        return false;
      }
    } catch (error) {
      this.showMessage(`Không kiểm tra được máy chủ xác thực: ${error.message}`, 'error');
      return false;
    }

    const currentUser = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!currentUser || !users[currentUser] || users[currentUser].serverAccount) {
      this.showSignInRequired();
      return false;
    }
    return true;
  }

  showSignInRequired() {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%); font-family: Inter, sans-serif;">
          <div style="background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center; max-width: 400px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #1e40af; margin-bottom: 16px;">Yêu Cầu Đăng Nhập</h2>
            <p style="color: #64748b; margin-bottom: 24px;">Bạn phải đăng nhập để truy cập Cửa Hàng Token!</p>
            <a href="auth.html" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; text-decoration:none;">Đăng Nhập Ngay</a>
            <a href="index.html" style="display:block;margin-top:16px;">Về trang chủ</a>
          </div>
        </div>
      `;
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
    
    const visibleColors = this.serverAccount
      ? this.colors.filter(color => (color.id >= 1 && color.id <= 16) || (color.id >= 17 && color.id <= 42))
      : this.colors;
    visibleColors.forEach(color => {
      const colorItem = document.createElement('div');
      colorItem.className = 'color-item';
      
      const isPurchased = this.purchasedColors.includes(color.id);
      const isServerBasic = this.serverAccount && ((color.id >= 1 && color.id <= 13) || color.id === 16);
      const canServerPurchase = this.serverAccount && [14, 15].includes(color.id);
      const price = this.serverAccount && canServerPurchase ? 50 : color.price;
      const canAfford = this.currentTokens >= price;
      const isServerRestricted = this.serverAccount && !isPurchased && !isServerBasic && !canServerPurchase;
      
      if (isPurchased) {
        colorItem.classList.add('purchased');
      }
      
      if (!isPurchased && !isServerBasic && !canServerPurchase) {
        colorItem.classList.add('locked');
      } else if (!isPurchased && !isServerBasic && !canAfford) {
        colorItem.classList.add('locked');
      }
      
      // Determine display based on color type
      let actionDisplay;
      if (isPurchased) {
        actionDisplay = `<div class="color-owned">✅ Đã sở hữu</div>
             ${this.serverAccount ? '' : `<button class="gift-btn" data-color-id="${color.id}" onclick="event.stopPropagation(); tokenShop.giftColor(${color.id})">🎁 Tặng</button>`}`;
      } else if (isServerBasic) {
        actionDisplay = `<div class="color-price free">🆓 Miễn phí</div>`;
      } else if (this.serverAccount && !canServerPurchase) {
        actionDisplay = `<div class="color-price">🔒 Chỉ Admin cấp</div>`;
      } else if (this.serverAccount && canServerPurchase) {
        actionDisplay = `<div class="color-price">${price} tokens</div>`;
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
        ${isServerRestricted || (!isPurchased && !isServerBasic && !canAfford && !color.unlockRequired) ? '<div class="lock-icon">🔒</div>' : ''}
        ${color.exclusive || color.unlockRequired ? '<div class="exclusive-badge">⭐ Đặc biệt</div>' : ''}
      `;
      
      colorItem.addEventListener('click', () => {
        void this.selectColor(color);
      });
      colorGrid.appendChild(colorItem);
    });
  }

  async selectColor(color) {
    const isPurchased = this.purchasedColors.includes(color.id);

    if (this.serverAccount) {
      const isBasic = (color.id >= 1 && color.id <= 13) || color.id === 16;
      if (isPurchased || isBasic) {
        await this.applyColor(color);
        return;
      }
      if (![14, 15].includes(color.id)) {
        this.showMessage('Màu đặc biệt chỉ có thể được Admin cấp.', 'error');
        return;
      }
      const price = 50;
      if (this.currentTokens < price) {
        this.showMessage(`Bạn cần ${price} tokens để mở khóa màu này.`, 'error');
        return;
      }
      if (confirm(`Mua màu "${color.name}" với ${price} tokens?`)) {
        await this.purchaseColor(color);
      }
      return;
    }
    
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

  async purchaseColor(color) {
    if (this.serverAccount) {
      try {
        await window.AuthApi.request(`/api/themes/${color.id}/purchase`, { method: 'POST' });
        await window.AuthApi.restoreSession();
        this.loadUserData();
        this.renderColors();
        this.updateTokenDisplay();
        this.showMessage(`Đã mua màu "${color.name}"!`, 'success');
      } catch (error) {
        this.showMessage(error.message || 'Không thể mua màu này.', 'error');
      }
      return;
    }

    this.currentTokens -= color.price;
    this.purchasedColors.push(color.id);
    
    this.updateUserData();
    this.renderColors();
    this.updateTokenDisplay();
    
    this.showMessage(`✅ Đã mua màu "${color.name}"!`, 'success');
  }

  giftColor(colorId) {
    this.showMessage('Chỉ Admin mới có thể cấp màu cho tài khoản khác.', 'error');
  }

  async applyColor(color) {
    if (this.serverAccount) {
      try {
        await window.AuthApi.request('/api/themes/selected', {
          method: 'PUT',
          body: { themeId: String(color.id) }
        });
      } catch (error) {
        this.showMessage(error.message || 'Bạn chưa có quyền sử dụng màu này.', 'error');
        return;
      }
    }
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
      if (users[currentUser].serverAccount) {
        localStorage.setItem('selectedColorTheme', this.selectedTheme);
        return;
      }
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
    this.showMessage('Chỉ Admin mới có thể cộng Token. Hãy nhận thưởng học tập hoặc liên hệ Admin.', 'error');
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
    window.location.href = "admin-panel.html";
  }

  giveTokens() {
    this.showMessage("Không thể tự cộng token từ trình duyệt. Chức năng này cần được chuyển sang máy chủ có phân quyền.", "error");
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
