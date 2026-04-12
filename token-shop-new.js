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
      // Premium colors (more expensive and beautiful)
      { id: 17, name: "Vàng kim", price: 500, primary: "#FFD700", secondary: "#FFA500", bg: "#FFFBEB", textColor: "#78350F", tier: "luxury" },
      { id: 18, name: "Bac", price: 600, primary: "#C0C0C0", secondary: "#808080", bg: "#F8F9FA", textColor: "#374151", tier: "luxury" },
      { id: 19, name: "Dáng", price: 700, primary: "#B87333", secondary: "#8B4513", bg: "#FEF5E7", textColor: "#451A03", tier: "luxury" },
      { id: 20, name: "Tím hoang gia", price: 800, primary: "#7851A9", secondary: "#6A1B9A", bg: "#F3E5F5", textColor: "#581C87", tier: "luxury" },
      // Dark themes with white text
      { id: 21, name: "Nen den", price: 450, primary: "#1F2937", secondary: "#111827", bg: "#111827", textColor: "#FFFFFF", tier: "premium" },
      { id: 22, name: "Nen xanh dam", price: 550, primary: "#1E3A8A", secondary: "#1E40AF", bg: "#1E3A8A", textColor: "#FFFFFF", tier: "luxury" },
      { id: 23, name: "Nen tím dam", price: 650, primary: "#581C87", secondary: "#6B21A8", bg: "#581C87", textColor: "#FFFFFF", tier: "luxury" },
      { id: 24, name: "Nen do dam", price: 750, primary: "#7F1D1D", secondary: "#991B1B", bg: "#7F1D1D", textColor: "#FFFFFF", tier: "luxury" },
      // EXCLUSIVE colors - only available in Token Shop (not in main app)
      { id: 25, name: "Holographic", price: 1000, primary: "#FF00FF", secondary: "#00FFFF", bg: "linear-gradient(45deg, #FF00FF, #00FFFF, #FF00FF)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true },
      { id: 26, name: "Rainbow", price: 1200, primary: "#FF0000", secondary: "#9400D3", bg: "linear-gradient(90deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #0000FF, #4B0082, #9400D3)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true },
      { id: 27, name: "Galaxy", price: 1500, primary: "#4B0082", secondary: "#000000", bg: "radial-gradient(ellipse at center, #4B0082, #000000, #191970)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true },
      { id: 28, name: "Aurora", price: 1300, primary: "#39FF14", secondary: "#FF1493", bg: "linear-gradient(135deg, #39FF14, #00CED1, #FF1493)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true },
      { id: 29, name: "Phoenix", price: 1400, primary: "#FF4500", secondary: "#FFD700", bg: "linear-gradient(180deg, #FF4500, #FF6347, #FFD700)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true },
      { id: 30, name: "Cyberpunk", price: 1100, primary: "#FFFF00", secondary: "#FF00FF", bg: "linear-gradient(135deg, #000000, #FFFF00, #FF00FF)", textColor: "#FFFFFF", tier: "exclusive", exclusive: true }
    ];
    this.init();
  }

  init() {
    this.checkPassword();
    this.loadUserData();
    this.renderColors();
    this.updateTokenDisplay();
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
      
      colorItem.innerHTML = `
        <div class="color-preview" style="background: linear-gradient(135deg, ${color.primary}, ${color.secondary});"></div>
        <div class="color-name">${color.name}</div>
        ${isPurchased 
          ? `<div class="color-owned">✅ Đã sở hữu</div>
             <button class="gift-btn" data-color-id="${color.id}" onclick="event.stopPropagation(); tokenShop.giftColor(${color.id})">🎁 Tặng</button>` 
          : `<div class="color-price">${color.price} tokens</div>`
        }
        ${!isPurchased && !canAfford ? '<div class="lock-icon">🔒</div>' : ''}
        ${color.exclusive ? '<div class="exclusive-badge">⭐ Exclusive</div>' : ''}
      `;
      
      colorItem.addEventListener('click', () => this.selectColor(color));
      colorGrid.appendChild(colorItem);
    });
  }

  selectColor(color) {
    const isPurchased = this.purchasedColors.includes(color.id);
    
    if (!isPurchased) {
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
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
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
